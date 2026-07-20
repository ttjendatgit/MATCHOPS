using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/admin/coaches")]
[Authorize(Roles = "ADMIN")]
public class AdminCoachesController : ControllerBase
{
    private readonly ICoachService _coachService;

    public AdminCoachesController(ICoachService coachService)
    {
        _coachService = coachService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCoachProfiles(
        [FromQuery] CoachProfileStatus? status,
        [FromQuery] string? city,
        [FromQuery] string? district,
        [FromQuery] Guid? sportId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _coachService.GetCoachProfilesForAdminAsync(
            status, city, district, sportId, search, page, pageSize);
        return Ok(ApiResponse<AdminCoachProfileListResponseDto>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCoachProfileById(Guid id)
    {
        var result = await _coachService.GetCoachProfileForAdminAsync(id);
        return Ok(ApiResponse<AdminCoachProfileDetailDto>.Ok(result));
    }

    [HttpPatch("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var result = await _coachService.ApproveCoachProfileAsync(id);
        return Ok(ApiResponse<AdminCoachProfileDetailDto>.Ok(result, "Hồ sơ huấn luyện viên đã được duyệt."));
    }

    [HttpPatch("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, RejectCoachProfileRequestDto dto)
    {
        var result = await _coachService.RejectCoachProfileAsync(id, dto);
        return Ok(ApiResponse<AdminCoachProfileDetailDto>.Ok(result, "Hồ sơ huấn luyện viên đã bị từ chối."));
    }

    [HttpPatch("{id:guid}/suspend")]
    public async Task<IActionResult> Suspend(Guid id, SuspendCoachProfileRequestDto dto)
    {
        var result = await _coachService.SuspendCoachProfileAsync(id, dto);
        return Ok(ApiResponse<AdminCoachProfileDetailDto>.Ok(result, "Hồ sơ huấn luyện viên đã bị tạm khóa."));
    }

    [HttpPatch("{id:guid}/reactivate")]
    public async Task<IActionResult> Reactivate(Guid id)
    {
        var result = await _coachService.ReactivateCoachProfileAsync(id);
        return Ok(ApiResponse<AdminCoachProfileDetailDto>.Ok(result, "Hồ sơ huấn luyện viên đã được kích hoạt lại."));
    }
}
