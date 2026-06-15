using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/match-requests")]
    public class MatchRequestController : ControllerBase
    {
        private readonly IMatchRequestService _requestService;
        private readonly ICurrentUserService _currentUserService;

        public MatchRequestController(IMatchRequestService requestService, ICurrentUserService currentUserService)
        {
            _requestService = requestService;
            _currentUserService = currentUserService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateRequest(CreateMatchRequestDto dto)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _requestService.CreateRequestAsync(userId, dto);
            return Ok(ApiResponse<MatchRequestResponseDto>.Ok(result, "Đã gửi yêu cầu tham gia."));
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _requestService.GetPendingRequestsAsync(userId);
            return Ok(ApiResponse<List<MatchRequestResponseDto>>.Ok(result));
        }

        [HttpGet("sent")]
        public async Task<IActionResult> GetSentRequests()
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _requestService.GetSentRequestsAsync(userId);
            return Ok(ApiResponse<List<MatchRequestResponseDto>>.Ok(result));
        }

        [HttpPut("{id:guid}/accept")]
        public async Task<IActionResult> AcceptRequest(Guid id)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            await _requestService.AcceptRequestAsync(userId, id);
            return Ok(ApiResponse<object>.Ok("Đã chấp nhận yêu cầu."));
        }

        [HttpPut("{id:guid}/reject")]
        public async Task<IActionResult> RejectRequest(Guid id)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            await _requestService.RejectRequestAsync(userId, id);
            return Ok(ApiResponse<object>.Ok("Đã từ chối yêu cầu."));
        }
    }
}
