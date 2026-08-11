namespace MATCHOP.API.DTOs.Membership;

/// <summary>
/// Request to create/upgrade a subscription to a specific plan.
/// </summary>
public class CreateSubscriptionDto
{
    /// <summary>MembershipPlan.Id to subscribe to.</summary>
    public Guid PlanId { get; set; }

    /// <summary>"MONTHLY" | "YEARLY". Defaults to MONTHLY.</summary>
    public string BillingCycle { get; set; } = "MONTHLY";
}

/// <summary>
/// Response after initiating subscription payment via SePay QR.
/// </summary>
public class SubscriptionPaymentResponseDto
{
    /// <summary>URL ảnh QR VietQR để hiển thị cho user quét.</summary>
    public string QrImageUrl { get; set; } = null!;

    /// <summary>Nội dung chuyển khoản cần ghi chính xác (VD: MEM3F2A1B4C).</summary>
    public string PaymentContent { get; set; } = null!;

    /// <summary>Số tài khoản nhận tiền.</summary>
    public string AccountNumber { get; set; } = null!;

    /// <summary>Tên chủ tài khoản.</summary>
    public string AccountName { get; set; } = null!;

    /// <summary>Tên ngân hàng.</summary>
    public string BankName { get; set; } = null!;

    /// <summary>Số tiền cần chuyển (VND).</summary>
    public decimal Amount { get; set; }

    /// <summary>Hết hạn thanh toán lúc.</summary>
    public DateTime ExpireAt { get; set; }

    /// <summary>Subscription ID đang chờ xác nhận thanh toán.</summary>
    public Guid PendingSubscriptionId { get; set; }
}

// MembershipPaymentResultDto giữ lại để không ảnh hưởng code khác (có thể xóa sau).
public class MembershipPaymentResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = null!;
    public string? SubscriptionId { get; set; }
    public string? OrderId { get; set; }
    public decimal? Amount { get; set; }
    public string? PlanName { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Usage statistics for the current billing period.
/// </summary>
public class MembershipUsageDto
{
    public int UsedMatchPosts { get; set; }
    public int MaxMatchPosts { get; set; }
    public int UsedJoinRequests { get; set; }
    public int MaxJoinRequests { get; set; }
    public int UsedVenues { get; set; }
    public int MaxVenues { get; set; }
    public int UsedCourts { get; set; }
    public int MaxCourts { get; set; }

    /// <summary>Days remaining in current billing period.</summary>
    public int DaysRemaining { get; set; }

    /// <summary>Start of current billing period.</summary>
    public DateTime PeriodStart { get; set; }

    /// <summary>End of current billing period.</summary>
    public DateTime PeriodEnd { get; set; }
}
