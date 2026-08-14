using MATCHOP.API.DTOs.OwnerApplications;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/owner-applications")]
[Authorize]
public class OwnerApplicationsController : ControllerBase
{
    private readonly IOwnerApplicationService _ownerApplicationService;
    private readonly ICurrentUserService _currentUserService;

    public OwnerApplicationsController(
        IOwnerApplicationService ownerApplicationService,
        ICurrentUserService currentUserService)
    {
        _ownerApplicationService = ownerApplicationService;
        _currentUserService = currentUserService;
    }

    private Guid GetCurrentUserId()
    {
        return _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
    }

    [HttpPost("apply")]
    public async Task<IActionResult> Apply(OwnerApplyRequestDto dto)
    {
        var result = await _ownerApplicationService.ApplyAsync(GetCurrentUserId(), dto);
        return Ok(ApiResponse<OwnerApplicationMeResponseDto>.Ok(result, "Đơn đăng ký chủ sân đã được gửi."));
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyApplication()
    {
        var result = await _ownerApplicationService.GetMyApplicationAsync(GetCurrentUserId());
        return Ok(ApiResponse<OwnerApplicationMeResponseDto>.Ok(result));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyApplication(OwnerUpdateApplicationRequestDto dto)
    {
        var result = await _ownerApplicationService.UpdateMyApplicationAsync(GetCurrentUserId(), dto);
        return Ok(ApiResponse<OwnerApplicationMeResponseDto>.Ok(result, "Đơn đăng ký đã được cập nhật."));
    }
}
