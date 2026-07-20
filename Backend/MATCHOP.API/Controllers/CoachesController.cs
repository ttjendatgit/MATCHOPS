using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Authorize]
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

    [HttpPost("apply")]
    public async Task<IActionResult> Apply(CoachApplyRequestDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _coachService.ApplyAsync(userId, dto);
        return StatusCode(201, ApiResponse<CoachProfileMeResponseDto>.Ok(
            result, "Đăng ký huấn luyện viên thành công. Chờ admin duyệt."));
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetCurrentUserId();
        var result = await _coachService.GetMyProfileAsync(userId);
        return Ok(ApiResponse<CoachProfileMeResponseDto>.Ok(result));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile(CoachUpdateMyProfileRequestDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _coachService.UpdateMyProfileAsync(userId, dto);
        return Ok(ApiResponse<CoachProfileMeResponseDto>.Ok(result, "Cập nhật hồ sơ huấn luyện viên thành công."));
    }
}
