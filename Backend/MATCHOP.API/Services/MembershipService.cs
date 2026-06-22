using MATCHOP.API.DTOs.Membership;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public class MembershipService : IMembershipService
{
    private readonly ApplicationDbContext _context;

    public MembershipService(ApplicationDbContext context)
    {
        _context = context;
    }

    // ── Plans ─────────────────────────────────────────────────────────────────

    public async Task<List<MembershipPlanResponseDto>> GetActivePlansAsync()
    {
        var plans = await _context.MembershipPlans
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.TargetRole)
            .ThenBy(p => p.SortOrder)
            .ToListAsync();

        return plans.Select(MapPlan).ToList();
    }

    public async Task<List<MembershipPlanResponseDto>> GetPlansByRoleAsync(UserRole role)
    {
        var plans = await _context.MembershipPlans
            .AsNoTracking()
            .Where(p => p.IsActive && p.TargetRole == role)
            .OrderBy(p => p.SortOrder)
            .ToListAsync();

        return plans.Select(MapPlan).ToList();
    }

    // ── Subscription ──────────────────────────────────────────────────────────

    public async Task<MySubscriptionResponseDto?> GetMySubscriptionAsync(Guid userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Select(u => new { u.Id, u.Role })
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);

        // ADMIN has no membership plans
        if (user.Role == UserRole.ADMIN)
            return null;

        // Try to find existing subscription with plan data
        var sub = await _context.UserSubscriptions
            .AsNoTracking()
            .Include(s => s.MembershipPlan)
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (sub is not null)
        {
            return new MySubscriptionResponseDto
            {
                SubscriptionId     = sub.Id,
                Status             = sub.Status.ToString(),
                StartedAt          = sub.StartedAt,
                ExpiresAt          = sub.ExpiresAt,
                CancelledAt        = sub.CancelledAt,
                IsFallbackFreePlan = false,
                Plan               = MapPlan(sub.MembershipPlan)
            };
        }

        // No subscription row → return FREE plan as fallback
        var freePlan = await GetFreePlanForRoleAsync(user.Role);

        if (freePlan is null)
            return null;  // Defensive: should never happen with seed data

        return new MySubscriptionResponseDto
        {
            SubscriptionId     = null,
            Status             = null,
            StartedAt          = null,
            ExpiresAt          = null,
            CancelledAt        = null,
            IsFallbackFreePlan = true,
            Plan               = MapPlan(freePlan)
        };
    }

    public async Task<MembershipPlan?> GetEffectivePlanAsync(Guid userId, UserRole role)
    {
        // Check for active subscription
        var sub = await _context.UserSubscriptions
            .AsNoTracking()
            .Include(s => s.MembershipPlan)
            .FirstOrDefaultAsync(s =>
                s.UserId == userId &&
                s.Status == SubscriptionStatus.ACTIVE);

        if (sub is not null)
            return sub.MembershipPlan;

        // Fall back to FREE plan for the role
        return await GetFreePlanForRoleAsync(role);
    }

    public async Task<MembershipPlan?> GetFreePlanForRoleAsync(UserRole role)
    {
        return await _context.MembershipPlans
            .AsNoTracking()
            .FirstOrDefaultAsync(p =>
                p.TargetRole == role &&
                p.Tier == MembershipTier.FREE &&
                p.IsActive);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private static MembershipPlanResponseDto MapPlan(MembershipPlan p) => new()
    {
        Id                       = p.Id,
        Code                     = p.Code,
        Name                     = p.Name,
        TargetRole               = p.TargetRole.ToString(),
        Tier                     = p.Tier.ToString(),
        PricePerMonth            = p.PricePerMonth,
        PricePerYear             = p.PricePerYear,
        CommissionRate           = p.CommissionRate,
        MaxVenues                = p.MaxVenues,
        MaxCourts                = p.MaxCourts,
        MaxMatchPostsPerMonth    = p.MaxMatchPostsPerMonth,
        MaxJoinRequestsPerMonth  = p.MaxJoinRequestsPerMonth,
        SortOrder                = p.SortOrder,
    };
}
