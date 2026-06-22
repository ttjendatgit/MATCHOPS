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
}
