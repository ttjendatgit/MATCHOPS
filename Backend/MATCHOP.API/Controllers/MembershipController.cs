using MATCHOP.API.DTOs.Membership;
using MATCHOP.API.DTOs.Payments;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using MATCHOP.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/membership")]
public class MembershipController : ControllerBase
{
    private readonly IMembershipService    _membershipService;
    private readonly IPaymentService       _paymentService;
    private readonly ICurrentUserService  _currentUser;
    private readonly IConfiguration       _config;

    public MembershipController(
        IMembershipService membershipService,
        IPaymentService paymentService,
        ICurrentUserService currentUser,
        IConfiguration config)
    {
        _membershipService = membershipService;
        _paymentService    = paymentService;
        _currentUser      = currentUser;
        _config           = config;
    }

    /// <summary>
    /// GET /api/membership/plans
    /// Returns all active plans sorted by role then sort order.
    /// Public — no authentication required.
    /// </summary>
    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlans([FromQuery] string? role = null, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(role) &&
            Enum.TryParse<MATCHOP.API.Enums.UserRole>(role, ignoreCase: true, out var parsedRole))
        {
            var byRole = await _membershipService.GetPlansByRoleAsync(parsedRole, cancellationToken);
            return Ok(ApiResponse<List<MembershipPlanResponseDto>>.Ok(byRole));
        }

        var all = await _membershipService.GetActivePlansAsync(cancellationToken);
        return Ok(ApiResponse<List<MembershipPlanResponseDto>>.Ok(all));
    }

    /// <summary>
    /// GET /api/membership/my-subscription
    /// Returns the authenticated user's current subscription with usage stats.
    /// </summary>
    [HttpGet("my-subscription")]
    [Authorize]
    public async Task<IActionResult> GetMySubscription(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId
            ?? throw new AppException(ErrorCodes.AuthRequired, "Bạn chưa đăng nhập.", StatusCodes.Status401Unauthorized);

        var result = await _membershipService.GetMySubscriptionAsync(userId, cancellationToken);

        if (result is null)
            return Ok(ApiResponse<MySubscriptionResponseDto?>.Ok(
                null,
                "Không áp dụng membership cho tài khoản này."));

        return Ok(ApiResponse<MySubscriptionResponseDto>.Ok(result));
    }

    /// <summary>
    /// POST /api/membership/subscribe
    /// Creates a pending subscription and returns SePay QR payment info.
    /// </summary>
    [HttpPost("subscribe")]
    [Authorize]
    public async Task<IActionResult> Subscribe([FromBody] CreateSubscriptionDto dto, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId
            ?? throw new AppException(ErrorCodes.AuthRequired, "Bạn chưa đăng nhập.", StatusCodes.Status401Unauthorized);

        // Tạo pending subscription
        var subscription = await _membershipService.CreateSubscriptionAsync(
            userId, dto.PlanId, dto.BillingCycle, cancellationToken);

        // Lấy thông tin gói
        var plans = await _membershipService.GetActivePlansAsync(cancellationToken);
        var plan = plans.FirstOrDefault(p => p.Id == dto.PlanId);

        if (plan is null)
            throw new AppException(ErrorCodes.ValidationError, "Không tìm thấy gói membership.", StatusCodes.Status404NotFound);

        // Tính số tiền
        var price = dto.BillingCycle.ToUpperInvariant() == "YEARLY" && plan.PricePerYear.HasValue
            ? plan.PricePerYear.Value
            : plan.PricePerMonth;

        // Tạo nội dung chuyển khoản SePay: MEM + 8 ký tự đầu subscriptionId
        var paymentContent = SePayHelper.BuildMembershipPaymentContent(subscription.Id);
        var amount = (long)Math.Round(price);

        // Tạo QR VietQR
        var bankBin       = _config["SePay:BankBin"]!;
        var accountNumber = _config["SePay:AccountNumber"]!;
        var accountName   = _config["SePay:AccountName"]!;
        var bankName      = _config["SePay:BankName"]!;

        var qrImageUrl = SePayHelper.BuildVietQrUrl(bankBin, accountNumber, amount, paymentContent, accountName);

        return Ok(ApiResponse<SubscriptionPaymentResponseDto>.Ok(new SubscriptionPaymentResponseDto
        {
            QrImageUrl             = qrImageUrl,
            PaymentContent         = paymentContent,
            AccountNumber          = accountNumber,
            AccountName            = accountName,
            BankName               = bankName,
            Amount                 = price,
            ExpireAt               = DateTime.UtcNow.AddMinutes(30),
            PendingSubscriptionId  = subscription.Id
        }));
    }

    /// <summary>
    /// POST /api/membership/verify-payment
    /// Kiểm tra giao dịch SePay và kích hoạt gói nếu đã thanh toán (fallback khi webhook chậm).
    /// </summary>
    [HttpPost("verify-payment")]
    [Authorize]
    public async Task<IActionResult> VerifyPayment(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId
            ?? throw new AppException(ErrorCodes.AuthRequired, "Bạn chưa đăng nhập.", StatusCodes.Status401Unauthorized);

        var result = await _paymentService.VerifyMembershipPaymentAsync(userId, cancellationToken);
        return Ok(ApiResponse<MembershipPaymentVerifyResultDto>.Ok(result, result.Message));
    }

    /// <summary>
    /// POST /api/admin/membership/confirm-payment
    /// Admin xác nhận thủ công (body JSON — ổn định hơn route param).
    /// </summary>
    [HttpPost("~/api/admin/membership/confirm-payment")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> AdminConfirmPaymentBody(
        [FromBody] AdminConfirmPaymentDto dto,
        CancellationToken cancellationToken = default)
    {
        if (dto.SubscriptionId == Guid.Empty)
            throw new AppException(ErrorCodes.ValidationError, "SubscriptionId không hợp lệ.", StatusCodes.Status400BadRequest);

        await _membershipService.ActivateSubscriptionByAdminAsync(dto.SubscriptionId, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { subscriptionId = dto.SubscriptionId }, "Đã kích hoạt gói thành viên."));
    }

    /// <summary>
    /// POST /api/admin/membership/subscriptions/{id}/confirm-payment
    /// Admin xác nhận thủ công khi user đã chuyển khoản nhưng SePay webhook/API chưa khớp.
    /// </summary>
    [HttpPost("~/api/admin/membership/subscriptions/{id:guid}/confirm-payment")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> AdminConfirmPayment(Guid id, CancellationToken cancellationToken = default)
    {
        await _membershipService.ActivateSubscriptionByAdminAsync(id, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { subscriptionId = id }, "Đã kích hoạt gói thành viên."));
    }

    // VNPay return endpoint removed – membership payment now handled via SePay webhook.
    // See: POST /api/payments/sepay/webhook → HandleSePayWebhookAsync (MEM prefix logic).

    /// <summary>
    /// GET /api/membership/usage
    /// Returns current usage statistics for the authenticated user.
    /// </summary>
    [HttpGet("usage")]
    [Authorize]
    public async Task<IActionResult> GetUsage(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId
            ?? throw new AppException(ErrorCodes.AuthRequired, "Bạn chưa đăng nhập.", StatusCodes.Status401Unauthorized);

        var subscription = await _membershipService.GetMySubscriptionAsync(userId, cancellationToken);
        if (subscription?.Usage is null)
            return Ok(ApiResponse<object>.Ok(new { }));

        return Ok(ApiResponse<MembershipUsageDto>.Ok(subscription.Usage));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// GET /api/admin/membership/subscriptions
    /// Returns all subscriptions for admin management.
    /// </summary>
    [HttpGet("~/api/admin/membership/subscriptions")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAllSubscriptions(
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<SubscriptionStatus>(status, ignoreCase: true, out var parsedStatus))
        {
            var result = await _membershipService.GetSubscriptionsByStatusAsync(parsedStatus, cancellationToken);
            return Ok(ApiResponse<List<AdminSubscriptionDto>>.Ok(result));
        }

        var all = await _membershipService.GetAllSubscriptionsAsync(cancellationToken);
        return Ok(ApiResponse<List<AdminSubscriptionDto>>.Ok(all));
    }

    /// <summary>
    /// GET /api/admin/membership/plans
    /// Returns all plans (including inactive) for admin.
    /// </summary>
    [HttpGet("~/api/admin/membership/plans")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAllPlans(CancellationToken cancellationToken = default)
    {
        var plans = await _membershipService.GetAllPlansAsync(cancellationToken);
        return Ok(ApiResponse<List<MembershipPlanResponseDto>>.Ok(plans));
    }

    /// <summary>
    /// GET /api/admin/membership/statistics
    /// Returns membership statistics for admin dashboard.
    /// </summary>
    [HttpGet("~/api/admin/membership/statistics")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken = default)
    {
        var stats = await _membershipService.GetStatisticsAsync(cancellationToken);
        return Ok(ApiResponse<MembershipStatisticsDto>.Ok(stats));
    }

}
