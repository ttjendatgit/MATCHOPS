using MATCHOP.API.DTOs.OwnerApplications;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/admin/owner-applications")]
[Authorize(Roles = "ADMIN")]
public class AdminOwnerApplicationsController : ControllerBase
{
    private readonly IOwnerApplicationService _ownerApplicationService;

    public AdminOwnerApplicationsController(IOwnerApplicationService ownerApplicationService)
    {
        _ownerApplicationService = ownerApplicationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetApplications(
        [FromQuery] OwnerApplicationStatus? status,
        [FromQuery] string? city,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _ownerApplicationService.GetApplicationsForAdminAsync(
            status, city, search, page, pageSize);
        return Ok(ApiResponse<AdminOwnerApplicationListResponseDto>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetApplicationById(Guid id)
    {
        var result = await _ownerApplicationService.GetApplicationForAdminAsync(id);
        return Ok(ApiResponse<AdminOwnerApplicationDetailDto>.Ok(result));
    }

    [HttpPatch("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var result = await _ownerApplicationService.ApproveApplicationAsync(id);
        return Ok(ApiResponse<AdminOwnerApplicationDetailDto>.Ok(result, "Đơn đăng ký đã được duyệt. Người dùng đã được nâng lên Chủ sân."));
    }

    [HttpPatch("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, RejectOwnerApplicationRequestDto dto)
    {
        var result = await _ownerApplicationService.RejectApplicationAsync(id, dto);
        return Ok(ApiResponse<AdminOwnerApplicationDetailDto>.Ok(result, "Đơn đăng ký đã bị từ chối."));
    }
}
