using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/matching")]
    public class MatchingController : ControllerBase
    {
        private readonly IMatchPostService _matchPostService;
        private readonly IMatchQueueService _matchQueueService;
        private readonly IMatchRoomService _matchRoomService;
        private readonly ICurrentUserService _currentUserService;

        public MatchingController(
            IMatchPostService matchPostService,
            IMatchQueueService matchQueueService,
            IMatchRoomService matchRoomService,
            ICurrentUserService currentUserService)
        {
            _matchPostService = matchPostService;
            _matchQueueService = matchQueueService;
            _matchRoomService = matchRoomService;
            _currentUserService = currentUserService;
        }

        // --- Match Posts ---

        [HttpPost("posts")]
        public async Task<IActionResult> CreatePost(CreateMatchPostDto dto, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _matchPostService.CreatePostAsync(userId, dto, cancellationToken);
            return Ok(ApiResponse<MatchPostResponseDto>.Ok(result, "Tạo bài tìm trận thành công."));
        }

        [HttpGet("posts")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPosts([FromQuery] MatchPostFilterDto filter, CancellationToken cancellationToken = default)
        {
            var result = await _matchPostService.GetPostsAsync(filter, cancellationToken);
            return Ok(ApiResponse<List<MatchPostResponseDto>>.Ok(result));
        }

        [HttpGet("posts/{id:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPostById(Guid id, CancellationToken cancellationToken = default)
        {
            var result = await _matchPostService.GetPostByIdAsync(id, cancellationToken);
            return Ok(ApiResponse<MatchPostResponseDto>.Ok(result));
        }

        [HttpPatch("posts/{id:guid}")]
        public async Task<IActionResult> UpdatePost(Guid id, UpdateMatchPostDto dto, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _matchPostService.UpdatePostAsync(userId, id, dto, cancellationToken);
            return Ok(ApiResponse<MatchPostResponseDto>.Ok(result, "Cập nhật bài đăng thành công."));
        }

        [HttpDelete("posts/{id:guid}")]
        public async Task<IActionResult> DeletePost(Guid id, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            await _matchPostService.DeletePostAsync(userId, id, cancellationToken);
            return Ok(ApiResponse<object>.Ok("Xóa bài đăng thành công."));
        }

        // --- Match Queue ---

        [HttpPost("queue/join")]
        public async Task<IActionResult> JoinQueue(JoinQueueDto dto, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            await _matchQueueService.JoinQueueAsync(userId, dto, cancellationToken);
            return Ok(ApiResponse<object>.Ok("Đã tham gia hàng chờ ghép trận."));
        }

        [HttpPost("queue/leave/{sportId:guid}")]
        public async Task<IActionResult> LeaveQueue(Guid sportId, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            await _matchQueueService.LeaveQueueAsync(userId, sportId, cancellationToken);
            return Ok(ApiResponse<object>.Ok("Đã rời khỏi hàng chờ."));
        }

        [HttpGet("queue/status/{sportId:guid}")]
        public async Task<IActionResult> GetQueueStatus(Guid sportId, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _matchQueueService.GetUserQueueStatusAsync(userId, sportId, cancellationToken);
            
            if (result == null)
            {
                return Ok(ApiResponse<MatchQueueResponseDto>.Ok(null!, "User is not in queue"));
            }

            return Ok(ApiResponse<MatchQueueResponseDto>.Ok(result));
        }

        // --- Match Rooms ---

        [HttpGet("rooms")]
        public async Task<IActionResult> GetMyRooms(CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _matchRoomService.GetUserRoomsAsync(userId, cancellationToken);
            return Ok(ApiResponse<List<MatchRoomResponseDto>>.Ok(result));
        }

        [HttpGet("rooms/{id:guid}")]
        public async Task<IActionResult> GetRoomById(Guid id, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _matchRoomService.GetRoomByIdAsync(id, userId, cancellationToken);
            return Ok(ApiResponse<MatchRoomResponseDto>.Ok(result));
        }

        [HttpPost("rooms/{id:guid}/accept")]
        public async Task<IActionResult> AcceptMatch(Guid id, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            await _matchRoomService.AcceptMatchAsync(userId, id, cancellationToken);
            return Ok(ApiResponse<object>.Ok("Đã chấp nhận trận đấu."));
        }

        [HttpPost("rooms/{id:guid}/reject")]
        public async Task<IActionResult> RejectMatch(Guid id, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            await _matchRoomService.RejectMatchAsync(userId, id, cancellationToken);
            return Ok(ApiResponse<object>.Ok("Đã từ chối trận đấu."));
        }
    }
}
