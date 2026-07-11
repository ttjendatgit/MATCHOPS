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
/// Response after initiating subscription payment.
/// </summary>
public class SubscriptionPaymentResponseDto
{
    /// <summary>VNPay payment URL to redirect user to.</summary>
    public string PaymentUrl { get; set; } = null!;

    /// <summary>Internal order reference.</summary>
    public string OrderId { get; set; } = null!;

    /// <summary>Amount to be charged.</summary>
    public decimal Amount { get; set; }

    /// <summary>Payment expiration time.</summary>
    public DateTime ExpireAt { get; set; }

    /// <summary>Temporary subscription ID pending payment confirmation.</summary>
    public Guid PendingSubscriptionId { get; set; }
}

/// <summary>
/// Result of processing membership payment return from VNPay.
/// </summary>
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
