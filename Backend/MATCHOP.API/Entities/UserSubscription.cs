using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class UserSubscription
{
    public Guid   Id               { get; set; }
    public Guid   UserId           { get; set; }
    public Guid   MembershipPlanId { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.ACTIVE;

    public DateTime  StartedAt   { get; set; }
    public DateTime? ExpiresAt   { get; set; }  // null = Free (never expires)
    public DateTime? CancelledAt { get; set; }

    /// <summary>Target plan while an ACTIVE user completes an upgrade payment.</summary>
    public Guid? PendingMembershipPlanId { get; set; }

    /// <summary>"MONTHLY" | "YEARLY" — used for amount verification and activation.</summary>
    public string? PendingBillingCycle { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User           User           { get; set; } = null!;
    public MembershipPlan MembershipPlan { get; set; } = null!;
}
