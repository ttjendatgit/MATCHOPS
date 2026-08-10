using MATCHOP.API.DTOs.Chat;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;
        private readonly ICurrentUserService _currentUserService;

        public ChatController(IChatService chatService, ICurrentUserService currentUserService)
        {
            _chatService = chatService;
            _currentUserService = currentUserService;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations(CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _chatService.GetUserConversationsAsync(userId, cancellationToken);
            return Ok(ApiResponse<List<ConversationDto>>.Ok(result));
        }

        [HttpGet("conversations/{id:guid}/messages")]
        public async Task<IActionResult> GetMessages(Guid id, [FromQuery] int skip = 0, [FromQuery] int take = 20, CancellationToken cancellationToken = default)
        {
            var result = await _chatService.GetConversationMessagesAsync(id, skip, take, cancellationToken);
            return Ok(ApiResponse<List<MessageDto>>.Ok(result));
        }

        [HttpPost("conversations/private/{targetUserId:guid}")]
        public async Task<IActionResult> StartPrivateChat(Guid targetUserId, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _chatService.CreatePrivateConversationAsync(userId, targetUserId, cancellationToken);
            return Ok(ApiResponse<ConversationDto>.Ok(result));
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage(SendMessageDto dto, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _chatService.SendMessageAsync(userId, dto, cancellationToken);
            return Ok(ApiResponse<MessageDto>.Ok(result));
        }
    }
}
