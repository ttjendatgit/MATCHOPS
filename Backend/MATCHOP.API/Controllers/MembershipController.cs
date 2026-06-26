using MATCHOP.API.DTOs.Membership;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using MATCHOP.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/membership")]
public class MembershipController : ControllerBase
{
    private readonly IMembershipService    _membershipService;
    private readonly ICurrentUserService   _currentUser;

    public MembershipController(
        IMembershipService  membershipService,
        ICurrentUserService currentUser)
    {
        _membershipService = membershipService;
        _currentUser       = currentUser;
    }

    /// <summary>
    /// GET /api/membership/plans
    /// Returns all active plans sorted by role then sort order.
    /// Public — no authentication required (used by public pricing page).
    /// </summary>
    [HttpGet("plans")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPlans([FromQuery] string? role = null, CancellationToken cancellationToken = default)
        {
            if (!string.IsNullOrWhiteSpace(role) &&
                Enum.TryParse<MATCHOP.API.Enums.UserRole>(role, ignoreCase: true, out var parsedRole))
            {
                var byRole = await _membershipService.GetPlansByRoleAsync(parsedRole, cancellationToken);
                return Ok(ApiResponse<List<MembershipPlanResponseDto>>.Ok(byRole));
            }

            var all = await _membershipService.GetActivePlansAsync(cancellationToken);
            return Ok(ApiResponse<List<MembershipPlanResponseDto>>.Ok(all));
        }

        /// <summary>
        /// GET /api/membership/my-subscription
        /// Returns the authenticated user's current subscription.
        /// If no subscription exists, returns the implicit FREE plan with isFallbackFreePlan = true.
        /// ADMIN users receive null data with a 200 OK.
        /// </summary>
        [HttpGet("my-subscription")]
        [Authorize]
        public async Task<IActionResult> GetMySubscription(CancellationToken cancellationToken = default)
        {
            var userId = _currentUser.UserId
                ?? throw new AppException(ErrorCodes.AuthRequired, "Bạn chưa đăng nhập.", StatusCodes.Status401Unauthorized);

            var result = await _membershipService.GetMySubscriptionAsync(userId, cancellationToken);

            if (result is null)
                return Ok(ApiResponse<MySubscriptionResponseDto?>.Ok(
                    null,
                    "Không áp dụng membership cho tài khoản này."));

            return Ok(ApiResponse<MySubscriptionResponseDto>.Ok(result));
        }
}
