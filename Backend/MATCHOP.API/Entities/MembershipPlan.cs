using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class MembershipPlan
{
    public Guid   Id           { get; set; }

    /// <summary>Stable string key used for seeding and lookup, e.g. "USER_FREE", "OWNER_PRO".</summary>
    public string Code         { get; set; } = null!;

    public string Name         { get; set; } = null!;

    public UserRole       TargetRole  { get; set; }
    public MembershipTier Tier        { get; set; }

    public decimal  PricePerMonth { get; set; }
    public decimal? PricePerYear  { get; set; }

    /// <summary>Platform commission rate (0.07 = 7%). Relevant for OWNER tiers only.</summary>
    public decimal? CommissionRate { get; set; }

    public int? MaxVenues               { get; set; }
    public int? MaxCourts               { get; set; }
    public int? MaxMatchPostsPerMonth   { get; set; }
    public int? MaxJoinRequestsPerMonth { get; set; }

    /// <summary>JSON array of feature flag strings, e.g. ["analytics","priority_support"].</summary>
    public string? FeaturesJson { get; set; }

    public bool IsActive  { get; set; } = true;
    public int  SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<UserSubscription> Subscriptions { get; set; } = new List<UserSubscription>();
}
