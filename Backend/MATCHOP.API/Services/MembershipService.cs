using System.Text.Json;
using MATCHOP.API.DTOs.Membership;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories;
using MATCHOP.API.Repositories.Interfaces;
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

    public async Task<List<MembershipPlanResponseDto>> GetActivePlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await _context.MembershipPlans
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.TargetRole)
            .ThenBy(p => p.SortOrder)
            .ToListAsync(cancellationToken);

        return plans.Select(MapPlan).ToList();
    }

    public async Task<List<MembershipPlanResponseDto>> GetPlansByRoleAsync(UserRole role, CancellationToken cancellationToken = default)
    {
        var plans = await _context.MembershipPlans
            .AsNoTracking()
            .Where(p => p.IsActive && p.TargetRole == role)
            .OrderBy(p => p.SortOrder)
            .ToListAsync(cancellationToken);

        return plans.Select(MapPlan).ToList();
    }

    // ── Subscription ──────────────────────────────────────────────────────────

    public async Task<MySubscriptionResponseDto?> GetMySubscriptionAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Select(u => new { u.Id, u.Role })
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
            throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);

        // ADMIN has no membership plans
        if (user.Role == UserRole.ADMIN)
            return null;

        // Try to find existing subscription with plan data
        var sub = await _context.UserSubscriptions
            .AsNoTracking()
            .Include(s => s.MembershipPlan)
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (sub is not null)
        {
            var usage = await GetUsageAsync(userId, user.Role, cancellationToken);
            return new MySubscriptionResponseDto
            {
                SubscriptionId     = sub.Id,
                Status             = sub.Status.ToString(),
                StartedAt          = sub.StartedAt,
                ExpiresAt          = sub.ExpiresAt,
                CancelledAt        = sub.CancelledAt,
                IsFallbackFreePlan = false,
                Plan               = MapPlan(sub.MembershipPlan),
                Usage              = usage
            };
        }

        // No subscription row → return FREE plan as fallback
        var freePlan = await GetFreePlanForRoleAsync(user.Role, cancellationToken);

        if (freePlan is null)
            return null;

        var fallbackUsage = await GetUsageAsync(userId, user.Role, cancellationToken);
        return new MySubscriptionResponseDto
        {
            SubscriptionId     = null,
            Status             = null,
            StartedAt          = null,
            ExpiresAt          = null,
            CancelledAt        = null,
            IsFallbackFreePlan = true,
            Plan               = MapPlan(freePlan),
            Usage              = fallbackUsage
        };
    }

    public async Task<MembershipPlan?> GetEffectivePlanAsync(Guid userId, UserRole role, CancellationToken cancellationToken = default)
    {
        // Check for active subscription
        var sub = await _context.UserSubscriptions
            .AsNoTracking()
            .Include(s => s.MembershipPlan)
            .FirstOrDefaultAsync(s =>
                s.UserId == userId &&
                s.Status == SubscriptionStatus.ACTIVE, cancellationToken);

        if (sub is not null)
            return sub.MembershipPlan;

        // Fall back to FREE plan for the role
        return await GetFreePlanForRoleAsync(role, cancellationToken);
    }

    public async Task<MembershipPlan?> GetFreePlanForRoleAsync(UserRole role, CancellationToken cancellationToken = default)
    {
        return await _context.MembershipPlans
            .AsNoTracking()
            .FirstOrDefaultAsync(p =>
                p.TargetRole == role &&
                p.Tier == MembershipTier.FREE &&
                p.IsActive, cancellationToken);
    }

    // ── Create Subscription ───────────────────────────────────────────────────

    public async Task<UserSubscription> CreateSubscriptionAsync(
        Guid userId,
        Guid planId,
        string billingCycle,
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
            throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);

        var plan = await _context.MembershipPlans
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == planId && p.IsActive, cancellationToken);

        if (plan is null)
            throw new AppException(ErrorCodes.ValidationError, "Không tìm thấy gói membership.", StatusCodes.Status404NotFound);

        // Verify plan matches user role
        if (plan.TargetRole != user.Role)
            throw new AppException(
                ErrorCodes.ValidationError,
                $"Gói này chỉ dành cho {(plan.TargetRole == UserRole.OWNER ? "chủ sân" : "người chơi")}.",
                StatusCodes.Status400BadRequest);

        // FREE plan doesn't need payment
        if (plan.Tier == MembershipTier.FREE)
            throw new AppException(
                ErrorCodes.ValidationError,
                "Gói miễn phí không cần thanh toán.",
                StatusCodes.Status400BadRequest);

        // Check if user already has active subscription - cancel it first
        var existingSub = await _context.UserSubscriptions
            .FirstOrDefaultAsync(s =>
                s.UserId == userId &&
                s.Status == SubscriptionStatus.ACTIVE, cancellationToken);

        if (existingSub is not null)
        {
            existingSub.Status = SubscriptionStatus.CANCELLED;
            existingSub.CancelledAt = DateTime.UtcNow;
            existingSub.UpdatedAt = DateTime.UtcNow;
        }

        // Calculate expiration
        var duration = billingCycle.ToUpperInvariant() == "YEARLY" ? 365 : 30;
        var expiresAt = DateTime.UtcNow.AddDays(duration);

        var subscription = new UserSubscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            MembershipPlanId = planId,
            Status = SubscriptionStatus.PENDING, // Will be ACTIVE after payment
            StartedAt = DateTime.UtcNow,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.UserSubscriptions.Add(subscription);
        await _context.SaveChangesAsync(cancellationToken);

        return subscription;
    }

    public async Task ActivateSubscriptionAsync(Guid subscriptionId, CancellationToken cancellationToken = default)
    {
        var subscription = await _context.UserSubscriptions
            .Include(s => s.MembershipPlan)
            .FirstOrDefaultAsync(s => s.Id == subscriptionId, cancellationToken);

        if (subscription is null)
            throw new AppException(ErrorCodes.ValidationError, "Không tìm thấy subscription.", StatusCodes.Status404NotFound);

        if (subscription.Status != SubscriptionStatus.PENDING)
            throw new AppException(ErrorCodes.ValidationError, "Subscription không ở trạng thái chờ.", StatusCodes.Status400BadRequest);

        subscription.Status = SubscriptionStatus.ACTIVE;
        subscription.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    // ── Admin Methods ────────────────────────────────────────────────────────

    /// <summary>Get all subscriptions with user and plan details for admin.</summary>
    public async Task<List<AdminSubscriptionDto>> GetAllSubscriptionsAsync(CancellationToken cancellationToken = default)
    {
        var subscriptions = await _context.UserSubscriptions
            .AsNoTracking()
            .Include(s => s.User)
            .Include(s => s.MembershipPlan)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        return subscriptions.Select(s => new AdminSubscriptionDto
        {
            SubscriptionId = s.Id,
            UserId = s.UserId,
            UserEmail = s.User?.Email ?? string.Empty,
            UserFullName = s.User?.FullName ?? string.Empty,
            UserRole = s.User?.Role.ToString() ?? string.Empty,
            PlanId = s.MembershipPlanId,
            PlanName = s.MembershipPlan?.Name ?? string.Empty,
            PlanTier = s.MembershipPlan?.Tier.ToString() ?? string.Empty,
            Status = s.Status.ToString(),
            PlanPrice = s.MembershipPlan?.PricePerMonth ?? 0,
            StartedAt = s.StartedAt,
            ExpiresAt = s.ExpiresAt,
            CancelledAt = s.CancelledAt,
            CreatedAt = s.CreatedAt
        }).ToList();
    }

    /// <summary>Get subscriptions filtered by status for admin.</summary>
    public async Task<List<AdminSubscriptionDto>> GetSubscriptionsByStatusAsync(
        SubscriptionStatus status,
        CancellationToken cancellationToken = default)
    {
        var subscriptions = await _context.UserSubscriptions
            .AsNoTracking()
            .Include(s => s.User)
            .Include(s => s.MembershipPlan)
            .Where(s => s.Status == status)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        return subscriptions.Select(s => new AdminSubscriptionDto
        {
            SubscriptionId = s.Id,
            UserId = s.UserId,
            UserEmail = s.User?.Email ?? string.Empty,
            UserFullName = s.User?.FullName ?? string.Empty,
            UserRole = s.User?.Role.ToString() ?? string.Empty,
            PlanId = s.MembershipPlanId,
            PlanName = s.MembershipPlan?.Name ?? string.Empty,
            PlanTier = s.MembershipPlan?.Tier.ToString() ?? string.Empty,
            Status = s.Status.ToString(),
            PlanPrice = s.MembershipPlan?.PricePerMonth ?? 0,
            StartedAt = s.StartedAt,
            ExpiresAt = s.ExpiresAt,
            CancelledAt = s.CancelledAt,
            CreatedAt = s.CreatedAt
        }).ToList();
    }

    /// <summary>Get all plans including inactive ones for admin.</summary>
    public async Task<List<MembershipPlanResponseDto>> GetAllPlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await _context.MembershipPlans
            .AsNoTracking()
            .OrderBy(p => p.TargetRole)
            .ThenBy(p => p.SortOrder)
            .ToListAsync(cancellationToken);

        return plans.Select(MapPlan).ToList();
    }

    /// <summary>Get membership statistics for admin dashboard.</summary>
    public async Task<MembershipStatisticsDto> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var allSubscriptions = await _context.UserSubscriptions
            .AsNoTracking()
            .Include(s => s.MembershipPlan)
            .ToListAsync(cancellationToken);

        var allUsers = await _context.Users
            .AsNoTracking()
            .Where(u => u.Role != UserRole.ADMIN)
            .ToListAsync(cancellationToken);

        var stats = new MembershipStatisticsDto
        {
            TotalSubscriptions = allSubscriptions.Count,
            ActiveSubscriptions = allSubscriptions.Count(s => s.Status == SubscriptionStatus.ACTIVE),
            ExpiredSubscriptions = allSubscriptions.Count(s => s.Status == SubscriptionStatus.EXPIRED),
            CancelledSubscriptions = allSubscriptions.Count(s => s.Status == SubscriptionStatus.CANCELLED),
            PendingSubscriptions = allSubscriptions.Count(s => s.Status == SubscriptionStatus.PENDING),
            TotalRevenue = allSubscriptions
                .Where(s => s.Status == SubscriptionStatus.ACTIVE && s.MembershipPlan != null)
                .Sum(s => s.MembershipPlan!.PricePerMonth),
            FreePlanUsers = allUsers.Count(u =>
                !allSubscriptions.Any(s => s.UserId == u.Id && s.Status == SubscriptionStatus.ACTIVE)),
            PaidPlanUsers = allUsers.Count(u =>
                allSubscriptions.Any(s => s.UserId == u.Id && s.Status == SubscriptionStatus.ACTIVE &&
                    s.MembershipPlan != null && s.MembershipPlan.Tier != MembershipTier.FREE)),
            SubscriptionsByPlan = allSubscriptions
                .GroupBy(s => s.MembershipPlan?.Name ?? "Unknown")
                .ToDictionary(g => g.Key, g => g.Count()),
            SubscriptionsByTier = allSubscriptions
                .GroupBy(s => s.MembershipPlan?.Tier.ToString() ?? "Unknown")
                .ToDictionary(g => g.Key, g => g.Count())
        };

        return stats;
    }

    // ── Limit Enforcement ─────────────────────────────────────────────────────

    /// <summary>
    /// Check if user can create more venues. Throws if limit exceeded.
    /// </summary>
    public async Task CheckVenueLimitAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
            throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);

        if (user.Role != UserRole.OWNER)
            return; // Non-owners don't have venue limits

        var plan = await GetEffectivePlanAsync(userId, user.Role, cancellationToken);
        if (plan?.MaxVenues is null)
            return; // Unlimited

        var currentCount = await _context.Venues
            .CountAsync(v => v.OwnerId == userId, cancellationToken);

        if (currentCount >= plan.MaxVenues)
            throw new AppException(
                ErrorCodes.MembershipLimitExceeded,
                $"Bạn đã đạt giới hạn {plan.MaxVenues} cụm sân của gói {plan.Name}. " +
                $"Vui lòng nâng cấp gói để thêm cụm sân.",
                StatusCodes.Status403Forbidden);
    }

    /// <summary>
    /// Check if user can create more courts. Throws if limit exceeded.
    /// </summary>
    public async Task CheckCourtLimitAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
            throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);

        if (user.Role != UserRole.OWNER)
            return;

        var plan = await GetEffectivePlanAsync(userId, user.Role, cancellationToken);
        if (plan?.MaxCourts is null)
            return; // Unlimited

        var currentCount = await _context.Courts
            .CountAsync(c => c.Venue!.OwnerId == userId, cancellationToken);

        if (currentCount >= plan.MaxCourts)
            throw new AppException(
                ErrorCodes.MembershipLimitExceeded,
                $"Bạn đã đạt giới hạn {plan.MaxCourts} sân của gói {plan.Name}. " +
                $"Vui lòng nâng cấp gói để thêm sân.",
                StatusCodes.Status403Forbidden);
    }

    /// <summary>
    /// Check if user can post more matches. Throws if limit exceeded.
    /// </summary>
    public async Task CheckMatchPostLimitAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
            throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);

        if (user.Role != UserRole.USER)
            return;

        var plan = await GetEffectivePlanAsync(userId, user.Role, cancellationToken);
        if (plan?.MaxMatchPostsPerMonth is null)
            return; // Unlimited

        // Get start of current billing period (reset monthly)
        var now = DateTime.UtcNow;
        var periodStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var periodEnd = periodStart.AddMonths(1).AddDays(-1);

        var usedCount = await _context.MatchPosts
            .CountAsync(m =>
                m.CreatorId == userId &&
                m.CreatedAt >= periodStart &&
                m.CreatedAt <= periodEnd, cancellationToken);

        if (usedCount >= plan.MaxMatchPostsPerMonth)
            throw new AppException(
                ErrorCodes.MembershipLimitExceeded,
                $"Bạn đã đạt giới hạn {plan.MaxMatchPostsPerMonth} bài ghép đối/tháng của gói {plan.Name}. " +
                $"Vui lòng nâng cấp gói hoặc đợi sang tháng sau.",
                StatusCodes.Status403Forbidden);
    }

    /// <summary>
    /// Check if user can send more join requests. Throws if limit exceeded.
    /// </summary>
    public async Task CheckJoinRequestLimitAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
            throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);

        if (user.Role != UserRole.USER)
            return;

        var plan = await GetEffectivePlanAsync(userId, user.Role, cancellationToken);
        if (plan?.MaxJoinRequestsPerMonth is null)
            return; // Unlimited

        // Get start of current billing period
        var now = DateTime.UtcNow;
        var periodStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var periodEnd = periodStart.AddMonths(1).AddDays(-1);

        var usedCount = await _context.MatchRequests
            .CountAsync(mr =>
                mr.SenderUserId == userId &&
                mr.CreatedAt >= periodStart &&
                mr.CreatedAt <= periodEnd, cancellationToken);

        if (usedCount >= plan.MaxJoinRequestsPerMonth)
            throw new AppException(
                ErrorCodes.MembershipLimitExceeded,
                $"Bạn đã đạt giới hạn {plan.MaxJoinRequestsPerMonth} yêu cầu tham gia/tháng của gói {plan.Name}. " +
                $"Vui lòng nâng cấp gói hoặc đợi sang tháng sau.",
                StatusCodes.Status403Forbidden);
    }

    /// <summary>
    /// Get current usage statistics for a user.
    /// </summary>
    public async Task<MembershipUsageDto?> GetUsageAsync(Guid userId, UserRole role, CancellationToken cancellationToken = default)
    {
        var plan = await GetEffectivePlanAsync(userId, role, cancellationToken);
        if (plan is null)
            return null;

        var now = DateTime.UtcNow;
        var periodStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var periodEnd = periodStart.AddMonths(1).AddDays(-1);

        var usage = new MembershipUsageDto
        {
            MaxMatchPosts = plan.MaxMatchPostsPerMonth ?? int.MaxValue,
            MaxJoinRequests = plan.MaxJoinRequestsPerMonth ?? int.MaxValue,
            MaxVenues = plan.MaxVenues ?? int.MaxValue,
            MaxCourts = plan.MaxCourts ?? int.MaxValue,
            DaysRemaining = (periodEnd - now).Days,
            PeriodStart = periodStart,
            PeriodEnd = periodEnd
        };

        if (role == UserRole.OWNER)
        {
            usage.UsedVenues = await _context.Venues.CountAsync(v => v.OwnerId == userId, cancellationToken);
            usage.UsedCourts = await _context.Courts.CountAsync(c => c.Venue!.OwnerId == userId, cancellationToken);
        }
        else if (role == UserRole.USER)
        {
            usage.UsedMatchPosts = await _context.MatchPosts
                .CountAsync(m =>
                    m.CreatorId == userId &&
                    m.CreatedAt >= periodStart &&
                    m.CreatedAt <= periodEnd, cancellationToken);

            usage.UsedJoinRequests = await _context.MatchRequests
                .CountAsync(mr =>
                    mr.SenderUserId == userId &&
                    mr.CreatedAt >= periodStart &&
                    mr.CreatedAt <= periodEnd, cancellationToken);
        }

        return usage;
    }

    // ── Mapping ─────────────────────────────────────────────────────────────

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
        IsActive                 = p.IsActive,
        Features                 = ParseFeatures(p.FeaturesJson)
    };

    private static List<string> ParseFeatures(string? featuresJson)
    {
        if (string.IsNullOrWhiteSpace(featuresJson))
            return new List<string>();

        try
        {
            return JsonSerializer.Deserialize<List<string>>(featuresJson) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}
