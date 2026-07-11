using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/admin/matches")]
[Authorize(Roles = "ADMIN")]
public class AdminMatchController : ControllerBase
{
    private readonly IMatchPostService _matchPostService;
    private readonly IMatchRequestService _matchRequestService;
    private readonly IMatchRoomService _matchRoomService;

    public AdminMatchController(
        IMatchPostService matchPostService,
        IMatchRequestService matchRequestService,
        IMatchRoomService matchRoomService)
    {
        _matchPostService = matchPostService;
        _matchRequestService = matchRequestService;
        _matchRoomService = matchRoomService;
    }

    /// <summary>GET /api/admin/matches/posts — Admin get all match posts</summary>
    [HttpGet("posts")]
    public async Task<IActionResult> GetAllPosts(
        [FromQuery] Guid? sportId,
        [FromQuery] string? status,
        [FromQuery] string? city,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var filter = new MatchPostFilterDto
        {
            SportId = sportId,
            City = city,
            StatusFilter = status,
            Page = page,
            PageSize = pageSize
        };

        var result = await _matchPostService.GetAllPostsAsync(filter, cancellationToken);
        return Ok(ApiResponse<MatchPostAdminListDto>.Ok(result));
    }

    /// <summary>GET /api/admin/matches/posts/{id} — Admin get match post by id</summary>
    [HttpGet("posts/{id:guid}")]
    public async Task<IActionResult> GetPostById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _matchPostService.GetPostByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<MatchPostResponseDto>.Ok(result));
    }

    /// <summary>PATCH /api/admin/matches/posts/{id}/status — Admin update match post status</summary>
    [HttpPatch("posts/{id:guid}/status")]
    public async Task<IActionResult> UpdatePostStatus(
        Guid id,
        [FromBody] UpdateMatchPostStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<MatchPostStatus>(dto.Status, true, out var status))
        {
            return BadRequest(ApiResponse<object>.Fail("Trạng thái không hợp lệ."));
        }

        var result = await _matchPostService.UpdatePostStatusAsync(id, status, cancellationToken);
        return Ok(ApiResponse<MatchPostResponseDto>.Ok(result, "Cập nhật trạng thái thành công."));
    }

    /// <summary>DELETE /api/admin/matches/posts/{id} — Admin delete match post</summary>
    [HttpDelete("posts/{id:guid}")]
    public async Task<IActionResult> DeletePost(Guid id, CancellationToken cancellationToken = default)
    {
        await _matchPostService.DeletePostAsync(id, cancellationToken);
        return Ok(ApiResponse<object>.Ok("Xóa bài đăng thành công."));
    }

    /// <summary>GET /api/admin/matches/requests — Admin get all match requests</summary>
    [HttpGet("requests")]
    public async Task<IActionResult> GetAllRequests(
        [FromQuery] Guid? postId,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _matchRequestService.GetAllRequestsAsync(
            postId, status, page, pageSize, cancellationToken);
        return Ok(ApiResponse<MatchRequestAdminListDto>.Ok(result));
    }

    /// <summary>GET /api/admin/matches/rooms — Admin get all match rooms</summary>
    [HttpGet("rooms")]
    public async Task<IActionResult> GetAllRooms(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _matchRoomService.GetAllRoomsAsync(status, page, pageSize, cancellationToken);
        return Ok(ApiResponse<MatchRoomAdminListDto>.Ok(result));
    }

    /// <summary>GET /api/admin/matches/statistics — Admin get match statistics</summary>
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken = default)
    {
        var stats = await _matchPostService.GetStatisticsAsync(cancellationToken);
        return Ok(ApiResponse<MatchStatisticsDto>.Ok(stats));
    }
}

public class UpdateMatchPostStatusDto
{
    public string Status { get; set; } = string.Empty;
}
