using MATCHOP.API.DTOs.Payments;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories.Interfaces;
using MATCHOP.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public class PaymentService : IPaymentService
{
    private readonly IBookingRepository _bookingRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PaymentService> _logger;
    private readonly IMembershipService _membershipService;
    private readonly ISePayApiService _sePayApiService;

    public PaymentService(
        IBookingRepository bookingRepository,
        ICurrentUserService currentUserService,
        IConfiguration config,
        ApplicationDbContext context,
        ILogger<PaymentService> logger,
        IMembershipService membershipService,
        ISePayApiService sePayApiService)
    {
        _bookingRepository    = bookingRepository;
        _currentUserService   = currentUserService;
        _config               = config;
        _context              = context;
        _logger               = logger;
        _membershipService    = membershipService;
        _sePayApiService      = sePayApiService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tạo QR SePay
    // ─────────────────────────────────────────────────────────────────────────

   public async Task<CreateSePayQrResponseDto> CreateSePayQrAsync(
    Guid bookingId,
    CancellationToken cancellationToken = default)
{
    var userId = GetCurrentUserIdOrThrow();

    var booking = await _bookingRepository.GetByIdAndUserIdAsync(bookingId, userId, cancellationToken);
    if (booking is null)
        throw new AppException(
            ErrorCodes.BookingNotFound,
            "Không tìm thấy booking của bạn.",
            StatusCodes.Status404NotFound);

    // Kiểm tra booking hết hạn
    if (booking.Status == BookingStatus.PENDING_PAYMENT &&
        booking.ExpireAt is not null &&
        booking.ExpireAt <= DateTime.UtcNow)
        throw new AppException(
            ErrorCodes.BookingExpired,
            "Booking đã hết hạn thanh toán. Vui lòng đặt lại.",
            StatusCodes.Status400BadRequest);

    if (booking.Status != BookingStatus.PENDING_PAYMENT)
        throw new AppException(
            ErrorCodes.BookingAlreadyPaid,
            "Booking này không ở trạng thái chờ thanh toán.",
            StatusCodes.Status400BadRequest);

    // Lấy config SePay / Ngân hàng
    var bankBin       = _config["SePay:BankBin"];
    var accountNumber = _config["SePay:AccountNumber"];
    var accountName   = _config["SePay:AccountName"];
    var bankName      = _config["SePay:BankName"];

    // ========== DEBUG LOG ==========
    _logger.LogWarning("=== SePay Config Debug ===");
    _logger.LogWarning("BankBin       = [{BankBin}]", bankBin ?? "NULL");
    _logger.LogWarning("AccountNumber = [{AccountNumber}]", accountNumber ?? "NULL");
    _logger.LogWarning("AccountName   = [{AccountName}]", accountName ?? "NULL");
    _logger.LogWarning("BankName      = [{BankName}]", bankName ?? "NULL");
    // ==============================

    // Kiểm tra config
    if (string.IsNullOrWhiteSpace(bankBin) ||
        string.IsNullOrWhiteSpace(accountNumber) ||
        string.IsNullOrWhiteSpace(accountName))
    {
        throw new AppException(
            ErrorCodes.InternalServerError,
            "Cấu hình SePay chưa đầy đủ (BankBin / AccountNumber / AccountName).",
            StatusCodes.Status500InternalServerError);
    }

    // Nội dung CK: MATCHOP + 8 ký tự đầu bookingId
    var content = SePayHelper.BuildPaymentContent(bookingId);

    // Số tiền (VND nguyên, không nhân 100 như VNPay)
    var amount = (long)Math.Round(booking.TotalPrice);

    var qrUrl = SePayHelper.BuildVietQrUrl(bankBin, accountNumber, amount, content, accountName);

    return new CreateSePayQrResponseDto
    {
        QrImageUrl     = qrUrl,
        PaymentContent = content,
        AccountNumber  = accountNumber,
        AccountName    = accountName,
        BankName       = bankName,
        Amount         = booking.TotalPrice,
        ExpireAt       = booking.ExpireAt ?? DateTime.UtcNow.AddMinutes(10)
    };
}

    // ─────────────────────────────────────────────────────────────────────────
    // Tạo QR SePay cho Coach Session
    // ─────────────────────────────────────────────────────────────────────────

    public async Task<CreateSePayQrResponseDto> CreateSePayQrForCoachSessionAsync(
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserIdOrThrow();

        var session = await _context.CoachSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.RequesterId == userId, cancellationToken);
            
        if (session is null)
            throw new AppException(
                ErrorCodes.CoachSessionNotFound,
                "Không tìm thấy buổi huấn luyện của bạn.",
                StatusCodes.Status404NotFound);

        if (session.Status != CoachSessionStatus.AWAITING_PAYMENT || session.PaymentStatus != CoachSessionPaymentStatus.UNPAID)
            throw new AppException(
                ErrorCodes.CoachSessionPaymentNotAllowed,
                "Buổi huấn luyện này không ở trạng thái chờ thanh toán.",
                StatusCodes.Status400BadRequest);

        if (session.PriceAmount is null || session.PriceAmount <= 0)
            throw new AppException(
                ErrorCodes.CoachSessionPaymentNotAllowed,
                "Buổi huấn luyện chưa có giá thanh toán.",
                StatusCodes.Status400BadRequest);

        var bankBin       = _config["SePay:BankBin"]!;
        var accountNumber = _config["SePay:AccountNumber"]!;
        var accountName   = _config["SePay:AccountName"]!;
        var bankName      = _config["SePay:BankName"]!;

        var content = $"COACH{session.Id:N}"[..13].ToUpper(); // COACH + 8 chars
        var amount = (long)Math.Round(session.PriceAmount.Value);

        var qrUrl = SePayHelper.BuildVietQrUrl(bankBin, accountNumber, amount, content, accountName);

        return new CreateSePayQrResponseDto
        {
            QrImageUrl     = qrUrl,
            PaymentContent = content,
            AccountNumber  = accountNumber,
            AccountName    = accountName,
            BankName       = bankName,
            Amount         = session.PriceAmount.Value,
            ExpireAt       = DateTime.UtcNow.AddMinutes(30)
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Xử lý Webhook SePay
    // ─────────────────────────────────────────────────────────────────────────

    public async Task<SePayWebhookResponse> HandleSePayWebhookAsync(
        SePayWebhookPayload payload,
        string? authorizationHeader,
        CancellationToken cancellationToken = default)
    {
        // 1. Xác thực API Key
        var apiKey = _config["SePay:WebhookApiKey"]!;
        if (!SePayHelper.ValidateApiKey(authorizationHeader, apiKey))
        {
            _logger.LogWarning("SePay webhook: invalid API key. Header={Header}", authorizationHeader);
            return new SePayWebhookResponse { Success = false, Message = "Unauthorized." };
        }

        // 2. Chỉ xử lý tiền vào
        if (!string.Equals(payload.TransferType, "in", StringComparison.OrdinalIgnoreCase))
            return new SePayWebhookResponse { Success = true, Message = "Ignored (not incoming)." };

        // 3. Tách mã thanh toán từ nội dung CK
        var rawContent = payload.Content ?? payload.Code ?? "";

        // ── Membership payment (prefix MEM) ─────────────────────────────
        if (rawContent.Contains("MEM", StringComparison.OrdinalIgnoreCase))
            return await HandleMembershipWebhookAsync(payload, rawContent, cancellationToken);

        // ── Coach Session payment (prefix COACH) ────────────────────────
        if (rawContent.Contains("COACH", StringComparison.OrdinalIgnoreCase))
            return await HandleCoachSessionWebhookAsync(payload, rawContent, cancellationToken);

        // ── Booking payment (prefix MATCHOP) ────────────────────────────
        var paymentContent = SePayHelper.ExtractPaymentContent(rawContent);
        if (paymentContent is null)
        {
            _logger.LogInformation("SePay webhook id={Id}: no MATCHOP code in content '{Content}'",
                payload.Id, payload.Content);
            return new SePayWebhookResponse { Success = true, Message = "No matching order code." };
        }

        // 4. Tìm booking đang chờ thanh toán khớp với mã
        //    Duyệt các booking PENDING_PAYMENT, so sánh content
        var pendingBookings = await _bookingRepository.GetPendingPaymentBookingsAsync(cancellationToken);
        var booking = pendingBookings
            .FirstOrDefault(b => SePayHelper.TryMatchBookingId(paymentContent, b.Id));

        if (booking is null)
        {
            _logger.LogInformation("SePay webhook id={Id}: no booking found for code '{Code}'",
                payload.Id, paymentContent);
            return new SePayWebhookResponse { Success = true, Message = "No booking matched." };
        }

        // 5. Idempotency: kiểm tra đã xử lý chưa (tránh SePay retry double-confirm)
        var alreadyProcessed = _context.Payments
            .Any(p => p.TransactionCode == payload.Id.ToString());
        if (alreadyProcessed)
        {
            _logger.LogInformation("SePay webhook id={Id}: already processed.", payload.Id);
            return new SePayWebhookResponse { Success = true, Message = "Already processed." };
        }

        // 6. Kiểm tra số tiền (±1 VND để tránh lỗi làm tròn)
        var expectedAmount = (long)Math.Round(booking.TotalPrice);
        if (Math.Abs(payload.TransferAmount - expectedAmount) > 1)
        {
            _logger.LogWarning(
                "SePay webhook id={Id}: amount mismatch. Expected={Expected}, Received={Received}",
                payload.Id, expectedAmount, payload.TransferAmount);
            // Vẫn trả success=true để SePay không retry, nhưng không confirm booking
            return new SePayWebhookResponse { Success = true, Message = "Amount mismatch – not confirmed." };
        }

        // 7. Cập nhật booking & tạo payment record (transaction)
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            booking.Status        = BookingStatus.CONFIRMED;
            booking.PaymentStatus = BookingPaymentStatus.PAID;
            booking.ExpireAt      = null;
            booking.UpdatedAt     = DateTime.UtcNow;

            foreach (var slot in booking.BookingSlots
                         .Where(s => s.Status == BookingSlotStatus.HOLDING))
            {
                slot.Status    = BookingSlotStatus.BOOKED;
                slot.UpdatedAt = DateTime.UtcNow;
            }

            _context.Payments.Add(new Payment
            {
                Id              = Guid.NewGuid(),
                BookingId       = booking.Id,
                UserId          = booking.UserId,
                Amount          = payload.TransferAmount,
                Method          = PaymentMethod.BANK_TRANSFER,
                Status          = PaymentTransactionStatus.SUCCESS,
                TransactionCode = payload.Id.ToString(),
                PaidAt          = DateTime.UtcNow,
                CreatedAt       = DateTime.UtcNow,
                UpdatedAt       = DateTime.UtcNow
            });

            await _bookingRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "SePay webhook id={Id}: booking {BookingId} CONFIRMED. Amount={Amount}",
                payload.Id, booking.Id, payload.TransferAmount);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "SePay webhook id={Id}: error confirming booking {BookingId}",
                payload.Id, booking.Id);
            throw;
        }

        return new SePayWebhookResponse { Success = true, Message = "Booking confirmed." };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Membership webhook handler
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<SePayWebhookResponse> HandleMembershipWebhookAsync(
        SePayWebhookPayload payload,
        string rawContent,
        CancellationToken cancellationToken = default)
    {
        var memCode = SePayHelper.ExtractMembershipPaymentContent(rawContent);
        if (memCode is null)
            return new SePayWebhookResponse { Success = true, Message = "Invalid MEM code." };

        var subscription = await FindPendingMembershipSubscriptionAsync(memCode, cancellationToken);
        if (subscription is null)
        {
            _logger.LogInformation("SePay webhook id={Id}: no subscription for MEM code '{Code}'",
                payload.Id, memCode);
            return new SePayWebhookResponse { Success = true, Message = "No subscription matched." };
        }

        if (IsMembershipFullyActive(subscription))
            return new SePayWebhookResponse { Success = true, Message = "Already activated." };

        var expectedAmount = await GetExpectedMembershipAmountAsync(subscription, cancellationToken);
        if (expectedAmount is null)
        {
            _logger.LogWarning("SePay webhook id={Id}: plan not found for subscription {SubId}",
                payload.Id, subscription.Id);
            return new SePayWebhookResponse { Success = true, Message = "Plan not found." };
        }

        if (Math.Abs(payload.TransferAmount - expectedAmount.Value) > 1)
        {
            _logger.LogWarning(
                "SePay webhook id={Id}: membership amount mismatch. Expected={Expected}, Received={Received}",
                payload.Id, expectedAmount, payload.TransferAmount);
            return new SePayWebhookResponse { Success = true, Message = "Amount mismatch – not activated." };
        }

        try
        {
            await _membershipService.ActivateSubscriptionAsync(subscription.Id, cancellationToken);

            _logger.LogInformation(
                "SePay webhook id={Id}: subscription {SubId} ACTIVATED. Amount={Amount}",
                payload.Id, subscription.Id, payload.TransferAmount);

            return new SePayWebhookResponse { Success = true, Message = "Subscription activated." };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SePay webhook id={Id}: error activating subscription {SubId}",
                payload.Id, subscription.Id);
            throw;
        }
    }

    public async Task<MembershipPaymentVerifyResultDto> VerifyMembershipPaymentAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var subscription = await _context.UserSubscriptions
            .Include(s => s.MembershipPlan)
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (subscription is null)
        {
            return new MembershipPaymentVerifyResultDto
            {
                Activated = false,
                Message = "Không tìm thấy gói đang chờ thanh toán."
            };
        }

        if (IsMembershipFullyActive(subscription))
        {
            return new MembershipPaymentVerifyResultDto
            {
                Activated = false,
                AlreadyActive = true,
                Message = "Gói thành viên đã được kích hoạt."
            };
        }

        var isAwaitingPayment =
            subscription.Status == SubscriptionStatus.PENDING ||
            (subscription.Status == SubscriptionStatus.ACTIVE && subscription.PendingMembershipPlanId.HasValue);

        if (!isAwaitingPayment)
        {
            return new MembershipPaymentVerifyResultDto
            {
                Activated = false,
                Message = "Gói không ở trạng thái chờ thanh toán."
            };
        }

        var paymentContent = SePayHelper.BuildMembershipPaymentContent(subscription.Id);
        var expectedAmount = await GetExpectedMembershipAmountAsync(subscription, cancellationToken);
        if (expectedAmount is null)
        {
            return new MembershipPaymentVerifyResultDto
            {
                Activated = false,
                Message = "Không xác định được số tiền gói membership."
            };
        }

        if (!_sePayApiService.IsConfigured)
        {
            _logger.LogWarning(
                "Membership verify: SePay ApiToken missing for user {UserId}, content {Content}",
                userId,
                paymentContent);

            return new MembershipPaymentVerifyResultDto
            {
                Activated = false,
                Message = "Hệ thống chưa cấu hình tra cứu SePay. Vui lòng liên hệ admin để xác nhận thanh toán."
            };
        }

        var match = await _sePayApiService.FindIncomingTransactionAsync(
            paymentContent,
            expectedAmount.Value,
            cancellationToken);

        if (match is null)
        {
            return new MembershipPaymentVerifyResultDto
            {
                Activated = false,
                Message = $"Chưa tìm thấy giao dịch {paymentContent} ({expectedAmount:N0}đ) trên SePay. Hệ thống sẽ tiếp tục kiểm tra tự động."
            };
        }

        await _membershipService.ActivateSubscriptionAsync(subscription.Id, cancellationToken);

        _logger.LogInformation(
            "Membership verify: subscription {SubId} ACTIVATED via SePay API. Tx={TxId}, Amount={Amount}",
            subscription.Id, match.TransactionId, match.AmountIn);

        return new MembershipPaymentVerifyResultDto
        {
            Activated = true,
            Message = "Thanh toán thành công! Gói của bạn đã được kích hoạt."
        };
    }

    private async Task<UserSubscription?> FindPendingMembershipSubscriptionAsync(
        string memCode,
        CancellationToken cancellationToken)
    {
        var shortId = memCode[3..];

        var candidates = await _context.UserSubscriptions
            .Where(s =>
                s.Status == SubscriptionStatus.PENDING ||
                (s.Status == SubscriptionStatus.ACTIVE && s.PendingMembershipPlanId != null))
            .ToListAsync(cancellationToken);

        return candidates.FirstOrDefault(s =>
            s.Id.ToString("N").StartsWith(shortId, StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsMembershipFullyActive(UserSubscription subscription) =>
        subscription.Status == SubscriptionStatus.ACTIVE &&
        subscription.PendingMembershipPlanId == null &&
        subscription.PendingBillingCycle == null;

    private async Task<long?> GetExpectedMembershipAmountAsync(
        UserSubscription subscription,
        CancellationToken cancellationToken)
    {
        var targetPlanId = subscription.PendingMembershipPlanId ?? subscription.MembershipPlanId;
        var plan = await _context.MembershipPlans
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == targetPlanId, cancellationToken);

        if (plan is null)
            return null;

        var billingCycle = subscription.PendingBillingCycle ?? "MONTHLY";
        var expectedPrice = billingCycle == "YEARLY" && plan.PricePerYear.HasValue
            ? plan.PricePerYear.Value
            : plan.PricePerMonth;

        return (long)Math.Round(expectedPrice);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Coach Session webhook handler
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<SePayWebhookResponse> HandleCoachSessionWebhookAsync(
        SePayWebhookPayload payload,
        string rawContent,
        CancellationToken cancellationToken = default)
    {
        // Idempotency check
        var alreadyProcessed = _context.Payments
            .Any(p => p.TransactionCode == payload.Id.ToString());
        if (alreadyProcessed)
            return new SePayWebhookResponse { Success = true, Message = "Already processed." };

        var upper = rawContent.ToUpperInvariant();
        var idx = upper.IndexOf("COACH", StringComparison.Ordinal);
        if (idx < 0 || upper.Length < idx + 13)
            return new SePayWebhookResponse { Success = true, Message = "Invalid COACH code." };

        var code = upper.Substring(idx, 13); // COACH + 8 chars
        var shortId = code[5..]; // 8 chars after COACH

        var pendingSessions = await _context.CoachSessions
            .Where(s => s.Status == CoachSessionStatus.AWAITING_PAYMENT)
            .ToListAsync(cancellationToken);

        var session = pendingSessions
            .FirstOrDefault(s => s.Id.ToString("N").StartsWith(shortId, StringComparison.OrdinalIgnoreCase));

        if (session is null)
        {
            _logger.LogInformation("SePay webhook id={Id}: no coach session for code '{Code}'",
                payload.Id, code);
            return new SePayWebhookResponse { Success = true, Message = "No coach session matched." };
        }

        try
        {
            session.PaymentStatus = CoachSessionPaymentStatus.PAID;
            session.Status = CoachSessionStatus.PAID;
            session.PaymentTransactionCode = payload.Id.ToString();
            session.PaidAt = DateTime.UtcNow;
            session.UpdatedAt = DateTime.UtcNow;

            // Ghi chú: Không tạo row trong bảng Payments vì bảng Payments có FK cứng (bắt buộc) tới Bookings.
            // Lịch sử thanh toán của Coach Session được track trực tiếp qua PaymentTransactionCode.
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "SePay webhook id={Id}: coach session {SessionId} PAID. Amount={Amount}",
                payload.Id, session.Id, payload.TransferAmount);

            return new SePayWebhookResponse { Success = true, Message = "Coach session paid." };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SePay webhook id={Id}: error paying coach session {SessionId}",
                payload.Id, session.Id);
            throw;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Guid GetCurrentUserIdOrThrow()
    {
        if (_currentUserService.UserId is null)
            throw new AppException(
                ErrorCodes.AuthRequired,
                "Bạn chưa đăng nhập.",
                StatusCodes.Status401Unauthorized);
        return _currentUserService.UserId.Value;
    }
}