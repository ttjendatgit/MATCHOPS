using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/coaches")]
[Authorize]
public class CoachAvailabilityController : ControllerBase
{
    private readonly ICoachAvailabilityService _availabilityService;
    private readonly ICurrentUserService _currentUserService;

    public CoachAvailabilityController(
        ICoachAvailabilityService availabilityService,
        ICurrentUserService currentUserService)
    {
        _availabilityService = availabilityService;
        _currentUserService = currentUserService;
    }

    private Guid GetCurrentUserId()
    {
        return _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
    }

    [HttpGet("me/availability")]
    public async Task<IActionResult> GetMyAvailability()
    {
        var userId = GetCurrentUserId();
        var result = await _availabilityService.GetMyAvailabilityAsync(userId);
        return Ok(ApiResponse<List<CoachAvailabilitySlotResponseDto>>.Ok(result));
    }

    /// <summary>Public, read-only weekly availability preview for an ACTIVE coach profile.</summary>
    [HttpGet("{coachProfileId:guid}/availability")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicAvailability(Guid coachProfileId)
    {
        var result = await _availabilityService.GetPublicAvailabilityAsync(coachProfileId);
        return Ok(ApiResponse<List<CoachAvailabilitySlotResponseDto>>.Ok(result));
    }

    [HttpPut("me/availability")]
    public async Task<IActionResult> ReplaceMyAvailability(UpdateCoachAvailabilityRequestDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _availabilityService.ReplaceMyAvailabilityAsync(userId, dto);
        return Ok(ApiResponse<List<CoachAvailabilitySlotResponseDto>>.Ok(result, "Đã lưu lịch rảnh."));
    }
}
