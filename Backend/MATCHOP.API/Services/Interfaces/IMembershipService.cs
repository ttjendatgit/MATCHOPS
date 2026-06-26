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
    /// Returns the caller's subscription. If no subscription row exists,
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
}
