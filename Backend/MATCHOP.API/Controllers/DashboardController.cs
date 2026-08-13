using MATCHOP.API.DTOs.Dashboard;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardStatisticsService _dashboardStatisticsService;
    private readonly IAIAnalyticsService _aiAnalyticsService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ApplicationDbContext _dbContext;

    public DashboardController(
        IDashboardStatisticsService dashboardStatisticsService,
        IAIAnalyticsService aiAnalyticsService,
        ICurrentUserService currentUserService,
        ApplicationDbContext dbContext)
    {
        _dashboardStatisticsService = dashboardStatisticsService;
        _aiAnalyticsService = aiAnalyticsService;
        _currentUserService = currentUserService;
        _dbContext = dbContext;
    }

    [HttpGet("admin/statistics")]
    public async Task<IActionResult> GetAdminStatistics(CancellationToken cancellationToken = default)
    {
        await EnsureRoleAsync(UserRole.ADMIN, cancellationToken);
        var result = await _dashboardStatisticsService.GetAdminStatisticsAsync(cancellationToken);
        return Ok(ApiResponse<DashboardAdminStatisticsDto>.Ok(result));
    }

    [HttpGet("admin/ai-summary")]
    public async Task<IActionResult> GetAdminAiSummary(CancellationToken cancellationToken = default)
    {
        await EnsureRoleAsync(UserRole.ADMIN, cancellationToken);
        var result = await _aiAnalyticsService.GetAdminAiSummaryAsync(cancellationToken);
        return Ok(ApiResponse<DashboardAiSummaryDto>.Ok(result));
    }

    [HttpGet("owner/statistics")]
    public async Task<IActionResult> GetOwnerStatistics(CancellationToken cancellationToken = default)
    {
        await EnsureRoleAsync(UserRole.OWNER, cancellationToken);
        var ownerId = GetCurrentUserId();
        var result = await _dashboardStatisticsService.GetOwnerStatisticsAsync(ownerId, cancellationToken);
        return Ok(ApiResponse<DashboardOwnerStatisticsDto>.Ok(result));
    }

    [HttpGet("owner/ai-summary")]
    public async Task<IActionResult> GetOwnerAiSummary(CancellationToken cancellationToken = default)
    {
        await EnsureRoleAsync(UserRole.OWNER, cancellationToken);
        var ownerId = GetCurrentUserId();
        var result = await _aiAnalyticsService.GetOwnerAiSummaryAsync(ownerId, cancellationToken);
        return Ok(ApiResponse<DashboardAiSummaryDto>.Ok(result));
    }

    [HttpGet("user/statistics")]
    public async Task<IActionResult> GetUserStatistics(CancellationToken cancellationToken = default)
    {
        await EnsureRoleAsync(UserRole.USER, cancellationToken);
        var userId = GetCurrentUserId();
        var result = await _dashboardStatisticsService.GetUserStatisticsAsync(userId, cancellationToken);
        return Ok(ApiResponse<DashboardUserStatisticsDto>.Ok(result));
    }

    [HttpGet("user/ai-summary")]
    public async Task<IActionResult> GetUserAiSummary(CancellationToken cancellationToken = default)
    {
        await EnsureRoleAsync(UserRole.USER, cancellationToken);
        var userId = GetCurrentUserId();
        var result = await _aiAnalyticsService.GetUserAiSummaryAsync(userId, cancellationToken);
        return Ok(ApiResponse<DashboardAiSummaryDto>.Ok(result));
    }

    [HttpGet("coach/statistics")]
    public async Task<IActionResult> GetCoachStatistics(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        await EnsureCoachProfileAsync(userId, cancellationToken);
        var result = await _dashboardStatisticsService.GetCoachStatisticsAsync(userId, cancellationToken);
        return Ok(ApiResponse<DashboardCoachStatisticsDto>.Ok(result));
    }

    private Guid GetCurrentUserId() =>
        _currentUserService.UserId
        ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized", StatusCodes.Status401Unauthorized);

    private async Task EnsureRoleAsync(UserRole requiredRole, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var actualRole = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => (UserRole?)u.Role)
            .FirstOrDefaultAsync(cancellationToken);

        if (!actualRole.HasValue)
        {
            throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized", StatusCodes.Status401Unauthorized);
        }

        if (actualRole.Value != requiredRole)
        {
            throw new AppException(ErrorCodes.FORBIDDEN, "Forbidden", StatusCodes.Status403Forbidden);
        }
    }

    private async Task EnsureCoachProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        var hasProfile = await _dbContext.CoachProfiles
            .AsNoTracking()
            .AnyAsync(c => c.UserId == userId, cancellationToken);

        if (!hasProfile)
        {
            throw new AppException(
                ErrorCodes.CoachProfileNotFound,
                "Bạn chưa có hồ sơ huấn luyện viên.",
                StatusCodes.Status404NotFound);
        }
    }
}
