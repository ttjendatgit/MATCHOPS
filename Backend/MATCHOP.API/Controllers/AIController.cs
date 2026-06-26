using MATCHOP.API.DTOs.AI;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

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
            if (string.IsNullOrWhiteSpace(dto.Message))
            {
                throw new AppException(ErrorCodes.ValidationError, "Message is required", StatusCodes.Status400BadRequest);
            }
            // #region debug-point D:controller-chat
            _ = ReportAiDebugAsync("D", "AIController.Chat started", new
            {
                userId,
                messageLength = dto.Message?.Length ?? 0
            });
            // #endregion
            try
            {
                var result = await _aiService.ProcessMessageAsync(userId, dto.Message!, cancellationToken);
                // #region debug-point D:controller-chat-success
                _ = ReportAiDebugAsync("D", "AIController.Chat succeeded", new
                {
                    userId,
                    resultConversationId = result.ConversationId,
                    resultMessageId = result.Id
                });
                // #endregion
                return Ok(ApiResponse<ChatResponseDto>.Ok(result));
            }
            catch (Exception ex)
            {
                // #region debug-point D:controller-chat-error
                _ = ReportAiDebugAsync("D", "AIController.Chat failed", new
                {
                    userId,
                    error = ex.Message,
                    exceptionType = ex.GetType().Name
                });
                // #endregion
                throw;
            }
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
            // #region debug-point E:controller-get-conversation
            _ = ReportAiDebugAsync("E", "AIController.GetConversation started", new
            {
                userId,
                conversationId = id
            });
            // #endregion
            try
            {
                var conversation = await _aiChatRepository.GetConversationWithMessagesAsync(id, userId, cancellationToken);
                if (conversation == null)
                {
                    // #region debug-point E:controller-get-conversation-notfound
                    _ = ReportAiDebugAsync("E", "AIController.GetConversation not found", new
                    {
                        userId,
                        conversationId = id
                    });
                    // #endregion
                    return NotFound(ApiResponse<object>.Fail("Conversation not found"));
                }
                // #region debug-point E:controller-get-conversation-success
                _ = ReportAiDebugAsync("E", "AIController.GetConversation succeeded", new
                {
                    userId,
                    conversationId = id,
                    messageCount = conversation.Messages.Count,
                    conversationTitle = conversation.Title
                });
                // #endregion
                var result = new AIConversationDetailDto
                {
                    Conversation = new AIConversationSummaryDto
                    {
                        Id = conversation.Id,
                        Title = conversation.Title
                    },
                    Messages = conversation.Messages.Select(m => new ChatMessageDto
                    {
                        Role = m.Role,
                        Content = m.Content,
                        CreatedAt = m.CreatedAt
                    }).ToList()
                };
                return Ok(ApiResponse<AIConversationDetailDto>.Ok(result));
            }
            catch (Exception ex)
            {
                // #region debug-point E:controller-get-conversation-error
                _ = ReportAiDebugAsync("E", "AIController.GetConversation failed", new
                {
                    userId,
                    conversationId = id,
                    error = ex.Message,
                    exceptionType = ex.GetType().Name
                });
                // #endregion
                throw;
            }
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

        // #region debug-point D:controller-report-helper
        private static async Task ReportAiDebugAsync(string hypothesisId, string message, object data)
        {
            try
            {
                using var client = new HttpClient();
                using var content = new StringContent(JsonSerializer.Serialize(new
                {
                    sessionId = "ai-chat-history",
                    runId = "pre-fix",
                    hypothesisId,
                    location = "Backend/MATCHOP.API/Controllers/AIController.cs",
                    msg = $"[DEBUG] {message}",
                    data,
                    ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                }), Encoding.UTF8, "application/json");
                await client.PostAsync("http://127.0.0.1:7777/event", content);
            }
            catch
            {
            }
        }
        // #endregion
    }
}
