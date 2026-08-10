using MATCHOP.API.DTOs.Membership;
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
    private readonly ICurrentUserService  _currentUser;
    private readonly IConfiguration       _config;

    public MembershipController(
        IMembershipService membershipService,
        ICurrentUserService currentUser,
        IConfiguration config)
    {
        _membershipService = membershipService;
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
    /// Creates a pending subscription and initiates VNPay payment.
    /// </summary>
    [HttpPost("subscribe")]
    [Authorize]
    public async Task<IActionResult> Subscribe([FromBody] CreateSubscriptionDto dto, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId
            ?? throw new AppException(ErrorCodes.AuthRequired, "Bạn chưa đăng nhập.", StatusCodes.Status401Unauthorized);

        // Create pending subscription
        var subscription = await _membershipService.CreateSubscriptionAsync(
            userId, dto.PlanId, dto.BillingCycle, cancellationToken);

        // Get plan details for payment
        var plans = await _membershipService.GetActivePlansAsync(cancellationToken);
        var plan = plans.FirstOrDefault(p => p.Id == dto.PlanId);

        if (plan is null)
            throw new AppException(ErrorCodes.ValidationError, "Không tìm thấy gói membership.", StatusCodes.Status404NotFound);

        // Calculate amount
        var price = dto.BillingCycle.ToUpperInvariant() == "YEARLY" && plan.PricePerYear.HasValue
            ? plan.PricePerYear.Value
            : plan.PricePerMonth;

        // Generate VNPay payment URL for membership
        var paymentUrl = CreateMembershipPaymentUrl(
            subscription.Id,
            plan.Name,
            price);

        return Ok(ApiResponse<SubscriptionPaymentResponseDto>.Ok(new SubscriptionPaymentResponseDto
        {
            PaymentUrl = paymentUrl,
            OrderId = $"MEM-{subscription.Id:N}"[..20],
            Amount = price,
            ExpireAt = subscription.ExpiresAt ?? DateTime.UtcNow.AddMinutes(30),
            PendingSubscriptionId = subscription.Id
        }));
    }

    /// <summary>
    /// GET /api/membership/payment/return
    /// Handles VNPay callback for membership payment.
    /// </summary>
    [HttpGet("payment/return")]
    [AllowAnonymous]
    public async Task<IActionResult> HandlePaymentReturn(CancellationToken cancellationToken = default)
    {
        var query = Request.Query;

        // Validate signature
        var hashSecret = _config["VNPay:HashSecret"];
        if (!VNPayHelper.ValidateSignature(query, hashSecret!))
        {
            return Redirect($"{_config["App:FrontendUrl"]}/account/subscription?payment=failed&error=invalid_signature");
        }

        var responseCode = query["vnp_ResponseCode"].ToString();
        var orderInfo = query["vnp_OrderInfo"].ToString();

        // Parse subscription ID from order info
        // Format: "MEM-{subscriptionId}"
        var subIdStr = orderInfo.Replace("MEM-", "");
        if (!Guid.TryParse(subIdStr, out var subscriptionId))
        {
            return Redirect($"{_config["App:FrontendUrl"]}/account/subscription?payment=failed&error=invalid_order");
        }

        if (responseCode == "00")
        {
            try
            {
                await _membershipService.ActivateSubscriptionAsync(subscriptionId, cancellationToken);
                return Redirect($"{_config["App:FrontendUrl"]}/account/subscription?payment=success&subscriptionId={subscriptionId}");
            }
            catch
            {
                return Redirect($"{_config["App:FrontendUrl"]}/account/subscription?payment=failed&error=activation_failed");
            }
        }

        var errorMessage = GetVNPayErrorMessage(responseCode);
        return Redirect($"{_config["App:FrontendUrl"]}/account/subscription?payment=failed&error={Uri.EscapeDataString(errorMessage)}");
    }

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

    private string CreateMembershipPaymentUrl(
        Guid subscriptionId,
        string planName,
        decimal amount)
    {
        var tmnCode = _config["VNPay:TmnCode"]!;
        var hashSecret = _config["VNPay:HashSecret"]!;
        var baseUrl = _config["VNPay:BaseUrl"]!;
        var returnUrl = $"{_config["App:BackendUrl"]}/api/membership/payment/return";

        var now = DateTime.UtcNow.AddHours(7);
        var expireTime = now.AddMinutes(30);

        var amountLong = (long)(amount * 100);
        var orderId = $"MEM-{subscriptionId:N}"[..20];

        var parameters = new SortedList<string, string>(StringComparer.Ordinal)
        {
            { "vnp_Version", "2.1.0" },
            { "vnp_Command", "pay" },
            { "vnp_TmnCode", tmnCode },
            { "vnp_Amount", amountLong.ToString() },
            { "vnp_CreateDate", now.ToString("yyyyMMddHHmmss") },
            { "vnp_CurrCode", "VND" },
            { "vnp_IpAddr", HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1" },
            { "vnp_Locale", "vn" },
            { "vnp_OrderInfo", $"MEM-{subscriptionId}" },
            { "vnp_OrderType", "membership" },
            { "vnp_ReturnUrl", returnUrl },
            { "vnp_TxnRef", orderId },
            { "vnp_ExpireDate", expireTime.ToString("yyyyMMddHHmmss") }
        };

        var rawData = VNPayHelper.BuildQueryString(parameters);
        var secureHash = VNPayHelper.HmacSHA512(hashSecret, rawData);
        parameters.Add("vnp_SecureHash", secureHash);

        return $"{baseUrl}?{VNPayHelper.BuildQueryString(parameters)}";
    }

    private static string GetVNPayErrorMessage(string responseCode) => responseCode switch
    {
        "07" => "Trừ tiền thành công nhưng giao dịch bị nghi ngờ gian lận.",
        "09" => "Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking.",
        "10" => "Xác thực thông tin thẻ/tài khoản quá 3 lần.",
        "11" => "Đã hết hạn chờ thanh toán.",
        "12" => "Thẻ/Tài khoản bị khóa.",
        "13" => "Sai mật khẩu OTP.",
        "24" => "Giao dịch bị hủy.",
        "51" => "Tài khoản không đủ số dư.",
        "65" => "Tài khoản vượt quá hạn mức giao dịch trong ngày.",
        "75" => "Ngân hàng thanh toán đang bảo trì.",
        "79" => "Sai mật khẩu quá số lần quy định.",
        _    => $"Thanh toán thất bại (mã lỗi: {responseCode})."
    };
}
