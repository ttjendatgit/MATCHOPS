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

    public PaymentService(
        IBookingRepository bookingRepository,
        ICurrentUserService currentUserService,
        IConfiguration config,
        ApplicationDbContext context,
        ILogger<PaymentService> logger,
        IMembershipService membershipService)
    {
        _bookingRepository    = bookingRepository;
        _currentUserService   = currentUserService;
        _config               = config;
        _context              = context;
        _logger               = logger;
        _membershipService    = membershipService;
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
        var bankBin       = _config["SePay:BankBin"]!;
        var accountNumber = _config["SePay:AccountNumber"]!;
        var accountName   = _config["SePay:AccountName"]!;
        var bankName      = _config["SePay:BankName"]!;

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
            return await HandleMembershipWebhookAsync(payload, rawContent);

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
        // Idempotency check
        var alreadyProcessed = _context.Payments
            .Any(p => p.TransactionCode == payload.Id.ToString());
        if (alreadyProcessed)
            return new SePayWebhookResponse { Success = true, Message = "Already processed." };

        // Tìm subscription đang PENDING_PAYMENT khớp mã MEM
        // Mã format: MEM + 8 ký tự đầu subscriptionId (N format)
        var upper = rawContent.ToUpperInvariant();
        var memIdx = upper.IndexOf("MEM", StringComparison.Ordinal);
        if (memIdx < 0 || upper.Length < memIdx + 11)
            return new SePayWebhookResponse { Success = true, Message = "Invalid MEM code." };

        var memCode = upper.Substring(memIdx, 11); // MEM + 8 chars

        // Tìm subscription có ID bắt đầu bằng 8 ký tự đó
        var shortId = memCode[3..]; // 8 ký tự hex
        var subscription = await _context.UserSubscriptions
            .Where(s => s.Status == SubscriptionStatus.PENDING)
            .FirstOrDefaultAsync(s =>
                s.Id.ToString("N").ToUpper().StartsWith(shortId), cancellationToken);

        if (subscription is null)
        {
            _logger.LogInformation("SePay webhook id={Id}: no subscription for MEM code '{Code}'",
                payload.Id, memCode);
            return new SePayWebhookResponse { Success = true, Message = "No subscription matched." };
        }

        // Activate subscription
        try
        {
            await _membershipService.ActivateSubscriptionAsync(subscription.Id, cancellationToken);

            _context.Payments.Add(new Payment
            {
                Id              = Guid.NewGuid(),
                BookingId       = Guid.Empty, // không có booking
                UserId          = subscription.UserId,
                Amount          = payload.TransferAmount,
                Method          = PaymentMethod.BANK_TRANSFER,
                Status          = PaymentTransactionStatus.SUCCESS,
                TransactionCode = payload.Id.ToString(),
                PaidAt          = DateTime.UtcNow,
                CreatedAt       = DateTime.UtcNow,
                UpdatedAt       = DateTime.UtcNow
            });
            await _context.SaveChangesAsync(cancellationToken);

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