namespace MATCHOP.API.DTOs.Membership;

public class MembershipPlanResponseDto
{
    public Guid    Id           { get; set; }
    public string  Code         { get; set; } = null!;
    public string  Name         { get; set; } = null!;
    public string  TargetRole   { get; set; } = null!;  // "USER" | "OWNER"
    public string  Tier         { get; set; } = null!;  // "FREE" | "STANDARD" | "PRO" | "PREMIUM"
    public decimal PricePerMonth { get; set; }
    public decimal? PricePerYear { get; set; }
    public decimal? CommissionRate { get; set; }
    public int?    MaxVenues               { get; set; }
    public int?    MaxCourts               { get; set; }
    public int?    MaxMatchPostsPerMonth   { get; set; }
    public int?    MaxJoinRequestsPerMonth { get; set; }
    public int     SortOrder    { get; set; }
    public bool    IsActive    { get; set; }

    /// <summary>Feature flags as JSON array, e.g. ["analytics","priority_support"].</summary>
    public List<string> Features { get; set; } = new();
}

public class MySubscriptionResponseDto
{
    /// <summary>Null when user has no UserSubscription row (fallback to FREE plan).</summary>
    public Guid?   SubscriptionId { get; set; }

    /// <summary>"ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING" | null if fallback.</summary>
    public string? Status { get; set; }

    public DateTime? StartedAt   { get; set; }
    public DateTime? ExpiresAt   { get; set; }
    public DateTime? CancelledAt { get; set; }

    /// <summary>True when no subscription row exists and the response reflects the implicit FREE plan.</summary>
    public bool IsFallbackFreePlan { get; set; }

    public MembershipPlanResponseDto Plan { get; set; } = null!;

    /// <summary>Current usage statistics for this billing period.</summary>
    public MembershipUsageDto? Usage { get; set; }

    /// <summary>Khi status=PENDING: nội dung CK cần ghi khi chuyển khoản.</summary>
    public string? PendingPaymentContent { get; set; }

    /// <summary>Khi status=PENDING: số tiền cần thanh toán (VND).</summary>
    public decimal? PendingPaymentAmount { get; set; }
}

public class AdminSubscriptionDto
{
    public Guid     SubscriptionId   { get; set; }
    public Guid     UserId           { get; set; }
    public string   UserEmail        { get; set; } = null!;
    public string   UserFullName     { get; set; } = null!;
    public string   UserRole         { get; set; } = null!;
    public Guid     PlanId           { get; set; }
    public string   PlanName         { get; set; } = null!;
    public string   PlanTier         { get; set; } = null!;
    public string   Status           { get; set; } = null!;
    public decimal  PlanPrice        { get; set; }
    public DateTime StartedAt        { get; set; }
    public DateTime? ExpiresAt       { get; set; }
    public DateTime? CancelledAt     { get; set; }
    public DateTime CreatedAt        { get; set; }
}

public class AdminConfirmPaymentDto
{
    public Guid SubscriptionId { get; set; }
}

public class MembershipStatisticsDto
{
    public int TotalSubscriptions    { get; set; }
    public int ActiveSubscriptions    { get; set; }
    public int ExpiredSubscriptions   { get; set; }
    public int CancelledSubscriptions  { get; set; }
    public int PendingSubscriptions   { get; set; }
    public decimal TotalRevenue       { get; set; }
    public int FreePlanUsers         { get; set; }
    public int PaidPlanUsers         { get; set; }
    public Dictionary<string, int> SubscriptionsByPlan { get; set; } = new();
    public Dictionary<string, int> SubscriptionsByTier  { get; set; } = new();
}
