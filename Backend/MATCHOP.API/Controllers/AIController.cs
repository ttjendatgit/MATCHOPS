using MATCHOP.API.DTOs.AI;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/ai")]
    public class AIController : ControllerBase
    {
        private readonly IAIService _aiService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAIChatRepository _aiChatRepository;

        public AIController(IAIService aiService, ICurrentUserService currentUserService, IAIChatRepository aiChatRepository)
        {
            _aiService = aiService;
            _currentUserService = currentUserService;
            _aiChatRepository = aiChatRepository;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat(ChatRequestDto dto)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _aiService.ProcessMessageAsync(userId, dto.Message);
            return Ok(ApiResponse<ChatResponseDto>.Ok(result));
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var messages = await _aiChatRepository.GetHistoryAsync(userId);
            var result = messages.Select(m => new ChatMessageDto
            {
                Role = m.Role,
                Content = m.Content,
                CreatedAt = m.CreatedAt
            }).ToList();
            return Ok(ApiResponse<List<ChatMessageDto>>.Ok(result));
        }

        [HttpDelete("history")]
        public async Task<IActionResult> ClearHistory()
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            await _aiChatRepository.ClearHistoryAsync(userId);
            return Ok(ApiResponse<object>.Ok("Đã xóa lịch sử chat."));
        }
    }
}
