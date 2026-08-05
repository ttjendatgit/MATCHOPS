using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/coaches")]
[Authorize]
public class CoachSessionRequestsController : ControllerBase
{
    private readonly ICoachSessionRequestService _sessionRequestService;
    private readonly ICurrentUserService _currentUserService;

    public CoachSessionRequestsController(
        ICoachSessionRequestService sessionRequestService,
        ICurrentUserService currentUserService)
    {
        _sessionRequestService = sessionRequestService;
        _currentUserService = currentUserService;
    }

    private Guid GetCurrentUserId()
    {
        return _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
    }

    // ── Requester ─────────────────────────────────────────────────────────────

    [HttpPost("{coachProfileId:guid}/session-requests")]
    public async Task<IActionResult> CreateSessionRequest(Guid coachProfileId, CreateCoachSessionRequestDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _sessionRequestService.CreateAsync(userId, coachProfileId, dto);
        return StatusCode(201, ApiResponse<CoachSessionRequestResponseDto>.Ok(
            result, "Yêu cầu buổi huấn luyện đã được gửi."));
    }

    [HttpGet("session-requests/my-sent")]
    public async Task<IActionResult> GetMySentSessionRequests()
    {
        var userId = GetCurrentUserId();
        var result = await _sessionRequestService.GetMySentRequestsAsync(userId);
        return Ok(ApiResponse<List<CoachSessionRequestResponseDto>>.Ok(result));
    }

    [HttpPatch("session-requests/{requestId:guid}/cancel")]
    public async Task<IActionResult> CancelSessionRequest(Guid requestId)
    {
        var userId = GetCurrentUserId();
        var result = await _sessionRequestService.CancelMyRequestAsync(userId, requestId);
        return Ok(ApiResponse<CoachSessionRequestResponseDto>.Ok(result, "Đã huỷ yêu cầu buổi huấn luyện."));
    }

    // ── Coach (own profile) ──────────────────────────────────────────────────

    [HttpGet("me/session-requests")]
    public async Task<IActionResult> GetMyIncomingSessionRequests()
    {
        var userId = GetCurrentUserId();
        var result = await _sessionRequestService.GetMyIncomingRequestsAsync(userId);
        return Ok(ApiResponse<List<CoachSessionRequestResponseDto>>.Ok(result));
    }

    [HttpPatch("me/session-requests/{requestId:guid}/accept")]
    public async Task<IActionResult> AcceptSessionRequest(Guid requestId, CoachRespondSessionRequestDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _sessionRequestService.AcceptRequestAsync(userId, requestId, dto);
        return Ok(ApiResponse<CoachSessionRequestResponseDto>.Ok(result, "Đã chấp nhận yêu cầu buổi huấn luyện."));
    }

    [HttpPatch("me/session-requests/{requestId:guid}/decline")]
    public async Task<IActionResult> DeclineSessionRequest(Guid requestId, CoachRespondSessionRequestDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _sessionRequestService.DeclineRequestAsync(userId, requestId, dto);
        return Ok(ApiResponse<CoachSessionRequestResponseDto>.Ok(result, "Đã từ chối yêu cầu buổi huấn luyện."));
    }
}
