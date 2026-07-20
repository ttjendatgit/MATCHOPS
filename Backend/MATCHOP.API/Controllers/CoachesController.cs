using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/coaches")]
public class CoachesController : ControllerBase
{
    private readonly ICoachService _coachService;
    private readonly ICurrentUserService _currentUserService;

    public CoachesController(ICoachService coachService, ICurrentUserService currentUserService)
    {
        _coachService = coachService;
        _currentUserService = currentUserService;
    }

    private Guid GetCurrentUserId()
    {
        return _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
    }

    // ── Public ────────────────────────────────────────────────────────────────

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicCoaches(
        [FromQuery] string? city,
        [FromQuery] string? district,
        [FromQuery] Guid? sportId,
        [FromQuery] string? search,
        [FromQuery] decimal? minHourlyRate,
        [FromQuery] decimal? maxHourlyRate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _coachService.GetPublicCoachProfilesAsync(
            city, district, sportId, search, minHourlyRate, maxHourlyRate, page, pageSize);
        return Ok(ApiResponse<PublicCoachListResponseDto>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicCoachById(Guid id)
    {
        var result = await _coachService.GetPublicCoachProfileByIdAsync(id);
        return Ok(ApiResponse<PublicCoachDetailDto>.Ok(result));
    }

    // ── Authenticated (own profile) ──────────────────────────────────────────

    [HttpPost("apply")]
    [Authorize]
    public async Task<IActionResult> Apply(CoachApplyRequestDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _coachService.ApplyAsync(userId, dto);
        return StatusCode(201, ApiResponse<CoachProfileMeResponseDto>.Ok(
            result, "Đăng ký huấn luyện viên thành công. Chờ admin duyệt."));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetCurrentUserId();
        var result = await _coachService.GetMyProfileAsync(userId);
        return Ok(ApiResponse<CoachProfileMeResponseDto>.Ok(result));
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateMyProfile(CoachUpdateMyProfileRequestDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _coachService.UpdateMyProfileAsync(userId, dto);
        return Ok(ApiResponse<CoachProfileMeResponseDto>.Ok(result, "Cập nhật hồ sơ huấn luyện viên thành công."));
    }
}
