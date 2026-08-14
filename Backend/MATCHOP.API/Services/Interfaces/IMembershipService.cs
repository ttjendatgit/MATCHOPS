using MATCHOP.API.DTOs.Membership;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Services.Interfaces;

public interface IMembershipService
{
    /// <summary>All active plans ordered by TargetRole then SortOrder.</summary>
    Task<List<MembershipPlanResponseDto>> GetActivePlansAsync(CancellationToken cancellationToken = default);

    /// <summary>Active plans for a specific role.</summary>
    Task<List<MembershipPlanResponseDto>> GetPlansByRoleAsync(UserRole role, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the caller's subscription with usage stats. If no subscription row exists,
    /// returns the FREE plan for their role with IsFallbackFreePlan = true.
    /// Returns null only for ADMIN users (no membership plans defined for ADMIN).
    /// </summary>
    Task<MySubscriptionResponseDto?> GetMySubscriptionAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the effective MembershipPlan for a user.
    /// Falls back to FREE plan for the given role when no subscription exists.
    /// </summary>
    Task<MembershipPlan?> GetEffectivePlanAsync(Guid userId, UserRole role, CancellationToken cancellationToken = default);

    /// <summary>Returns the FREE plan for the given role, or null if not found.</summary>
    Task<MembershipPlan?> GetFreePlanForRoleAsync(UserRole role, CancellationToken cancellationToken = default);

    /// <summary>Creates a pending subscription (for paid plans) or activates immediately (for FREE).</summary>
    Task<UserSubscription> CreateSubscriptionAsync(Guid userId, Guid planId, string billingCycle, CancellationToken cancellationToken = default);

    /// <summary>Activates a pending subscription after successful payment.</summary>
    Task ActivateSubscriptionAsync(Guid subscriptionId, CancellationToken cancellationToken = default);

    /// <summary>Admin: kích hoạt thủ công khi đã xác nhận chuyển khoản nhưng webhook/API SePay lỗi.</summary>
    Task ActivateSubscriptionByAdminAsync(Guid subscriptionId, CancellationToken cancellationToken = default);

    // ── Admin Methods ────────────────────────────────────────────────────────

    /// <summary>Get all subscriptions (active, expired, cancelled) for admin.</summary>
    Task<List<AdminSubscriptionDto>> GetAllSubscriptionsAsync(CancellationToken cancellationToken = default);

    /// <summary>Get subscriptions by status filter.</summary>
    Task<List<AdminSubscriptionDto>> GetSubscriptionsByStatusAsync(SubscriptionStatus status, CancellationToken cancellationToken = default);

    /// <summary>Get all membership plans including inactive ones for admin.</summary>
    Task<List<MembershipPlanResponseDto>> GetAllPlansAsync(CancellationToken cancellationToken = default);

    /// <summary>Get subscription statistics for admin dashboard.</summary>
    Task<MembershipStatisticsDto> GetStatisticsAsync(CancellationToken cancellationToken = default);

    // ── Limit Enforcement ─────────────────────────────────────────────────────

    /// <summary>Check if user can create more venues. Throws if limit exceeded.</summary>
    Task CheckVenueLimitAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>Check if user can create more courts. Throws if limit exceeded.</summary>
    Task CheckCourtLimitAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>Check if user can post more matches. Throws if limit exceeded.</summary>
    Task CheckMatchPostLimitAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>Check if user can send more join requests. Throws if limit exceeded.</summary>
    Task CheckJoinRequestLimitAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>Get current usage statistics for a user.</summary>
    Task<MembershipUsageDto?> GetUsageAsync(Guid userId, UserRole role, CancellationToken cancellationToken = default);
}
