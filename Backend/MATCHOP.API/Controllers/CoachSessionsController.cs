using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/coaches")]
[Authorize]
public class CoachSessionsController : ControllerBase
{
    private readonly ICoachSessionService _sessionService;
    private readonly ICurrentUserService _currentUserService;

    public CoachSessionsController(ICoachSessionService sessionService, ICurrentUserService currentUserService)
    {
        _sessionService = sessionService;
        _currentUserService = currentUserService;
    }

    private Guid GetCurrentUserId()
    {
        return _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
    }

    // ── Requester ─────────────────────────────────────────────────────────────

    [HttpGet("sessions/my")]
    public async Task<IActionResult> GetMySessions()
    {
        var userId = GetCurrentUserId();
        var result = await _sessionService.GetMySessionsAsync(userId);
        return Ok(ApiResponse<List<CoachSessionResponseDto>>.Ok(result));
    }

    [HttpPost("sessions/{sessionId:guid}/payment")]
    public async Task<IActionResult> PaySession(Guid sessionId, PayCoachSessionRequestDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _sessionService.PayAsync(userId, sessionId, dto);
        return Ok(ApiResponse<CoachSessionResponseDto>.Ok(result, "Thanh toán demo thành công."));
    }

    // ── Coach (own profile) ──────────────────────────────────────────────────

    [HttpGet("me/sessions")]
    public async Task<IActionResult> GetMyCoachSessions()
    {
        var userId = GetCurrentUserId();
        var result = await _sessionService.GetMyCoachSessionsAsync(userId);
        return Ok(ApiResponse<List<CoachSessionResponseDto>>.Ok(result));
    }

    [HttpPatch("me/sessions/{sessionId:guid}/complete")]
    public async Task<IActionResult> CompleteSession(Guid sessionId)
    {
        var userId = GetCurrentUserId();
        var result = await _sessionService.CompleteAsync(userId, sessionId);
        return Ok(ApiResponse<CoachSessionResponseDto>.Ok(result, "Đã đánh dấu buổi huấn luyện hoàn thành."));
    }

    // ── Shared, owner-scoped detail ──────────────────────────────────────────

    [HttpGet("sessions/{sessionId:guid}")]
    public async Task<IActionResult> GetSessionDetail(Guid sessionId)
    {
        var userId = GetCurrentUserId();
        var result = await _sessionService.GetSessionForUserAsync(userId, sessionId);
        return Ok(ApiResponse<CoachSessionResponseDto>.Ok(result));
    }
}
