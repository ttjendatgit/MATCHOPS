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
        public async Task<IActionResult> Chat(ChatRequestDto dto, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var result = await _aiService.ProcessMessageAsync(userId, dto.Message, dto.ConversationId, cancellationToken);
            return Ok(ApiResponse<ChatResponseDto>.Ok(result));
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations(CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var conversations = await _aiChatRepository.GetConversationsAsync(userId, cancellationToken);
            var result = conversations.Select(c => new AIConversationDto
            {
                Id = c.Id,
                Title = c.Title,
                LastMessage = c.Messages.FirstOrDefault()?.Content,
                UpdatedAt = c.UpdatedAt
            }).ToList();
            return Ok(ApiResponse<List<AIConversationDto>>.Ok(result));
        }

        [HttpGet("conversations/{id:guid}")]
        public async Task<IActionResult> GetConversation(Guid id, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var conversation = await _aiChatRepository.GetConversationAsync(id, userId, cancellationToken);
            if (conversation == null)
                return NotFound(ApiResponse<object>.Fail("Conversation not found"));
            
            var messages = await _aiChatRepository.GetMessagesByConversationAsync(id, cancellationToken);
            var result = new
            {
                Conversation = conversation,
                Messages = messages.Select(m => new ChatMessageDto
                {
                    Role = m.Role,
                    Content = m.Content,
                    CreatedAt = m.CreatedAt
                }).ToList()
            };
            return Ok(ApiResponse<object>.Ok(result));
        }

        [HttpDelete("conversations/{id:guid}")]
        public async Task<IActionResult> DeleteConversation(Guid id, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            await _aiChatRepository.DeleteConversationAsync(id, userId, cancellationToken);
            return Ok(ApiResponse<object>.Ok("Đã xóa cuộc trò chuyện."));
        }

        [HttpPut("conversations/{id:guid}/rename")]
        public async Task<IActionResult> RenameConversation(Guid id, [FromBody] RenameConversationDto dto, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var conversation = await _aiChatRepository.GetConversationAsync(id, userId, cancellationToken);
            if (conversation == null)
                return NotFound(ApiResponse<object>.Fail("Conversation not found"));
            
            conversation.Title = dto.Title;
            conversation.UpdatedAt = DateTime.UtcNow;
            await _aiChatRepository.UpdateConversationAsync(conversation, cancellationToken);
            return Ok(ApiResponse<object>.Ok("Đã đổi tên cuộc trò chuyện."));
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory(CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            var messages = await _aiChatRepository.GetHistoryAsync(userId, cancellationToken: cancellationToken);
            var result = messages.Select(m => new ChatMessageDto
            {
                Role = m.Role,
                Content = m.Content,
                CreatedAt = m.CreatedAt
            }).ToList();
            return Ok(ApiResponse<List<ChatMessageDto>>.Ok(result));
        }

        [HttpDelete("history")]
        public async Task<IActionResult> ClearHistory(CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId ?? throw new AppException(ErrorCodes.UNAUTHORIZED, "Unauthorized");
            await _aiChatRepository.ClearHistoryAsync(userId, cancellationToken);
            return Ok(ApiResponse<object>.Ok("Đã xóa lịch sử chat."));
        }
    }
}