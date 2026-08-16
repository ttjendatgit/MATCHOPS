using MATCHOP.API.DTOs.AI;
using MATCHOP.API.Entities;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories;
using MATCHOP.API.Services.AI;
using MATCHOP.API.Services.Interfaces;
using System.Diagnostics;
using System.Text;

namespace MATCHOP.API.Services;

public interface IAIService
{
    Task<ChatResponseDto> ProcessMessageAsync(Guid userId, string userMessage, Guid? conversationId = null, CancellationToken cancellationToken = default);
}

public class AIService : IAIService
{
    private readonly IGroqService _groqService;
    private readonly IAIChatRepository _aiChatRepository;
    private readonly IAiIntentPlanner _intentPlanner;
    private readonly IAiToolExecutor _toolExecutor;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAiRateLimiter _rateLimiter;
    private readonly ILogger<AIService> _logger;

    public AIService(
        IGroqService groqService,
        IAIChatRepository aiChatRepository,
        IAiIntentPlanner intentPlanner,
        IAiToolExecutor toolExecutor,
        ICurrentUserService currentUserService,
        IAiRateLimiter rateLimiter,
        ILogger<AIService> logger)
    {
        _groqService = groqService;
        _aiChatRepository = aiChatRepository;
        _intentPlanner = intentPlanner;
        _toolExecutor = toolExecutor;
        _currentUserService = currentUserService;
        _rateLimiter = rateLimiter;
        _logger = logger;
    }

    public async Task<ChatResponseDto> ProcessMessageAsync(
        Guid userId,
        string userMessage,
        Guid? conversationId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedUserMessage = string.IsNullOrWhiteSpace(userMessage) ? string.Empty : userMessage.Trim();
        _rateLimiter.CheckLimit(userId, 20);

        var sw = Stopwatch.StartNew();
        AIConversation conversation;
        List<AIChatMessage> history;

        if (conversationId.HasValue)
        {
            conversation = await _aiChatRepository.GetConversationAsync(conversationId.Value, userId, cancellationToken)
                ?? throw new AppException(ErrorCodes.ConversationNotFound, "Conversation not found");

            history = await _aiChatRepository.GetMessagesByConversationAsync(conversationId.Value, cancellationToken);
        }
        else
        {
            conversation = new AIConversation
            {
                UserId = userId,
                Title = normalizedUserMessage.Length > 50
                    ? normalizedUserMessage[..50] + "..."
                    : normalizedUserMessage
            };
            await _aiChatRepository.AddConversationAsync(conversation, cancellationToken);
            history = [];
        }

        var metadata = AiJsonHelper.DeserializeMetadata(conversation.MetadataJson);
        var role = _currentUserService.Role ?? "USER";

        string aiResponse;
        string intent = AiIntents.Unknown;

        try
        {
            var plan = await _intentPlanner.PlanAsync(normalizedUserMessage, history, metadata, cancellationToken);
            intent = plan.Intent;

            if (plan.NeedsClarification && !string.IsNullOrWhiteSpace(plan.ClarificationQuestion))
            {
                aiResponse = plan.ClarificationQuestion;
            }
            else
            {
                var context = new AiExecutionContext
                {
                    UserId = userId,
                    Role = role,
                    Metadata = metadata
                };

                var toolResult = await _toolExecutor.ExecuteAsync(plan, context, cancellationToken);
                metadata = context.Metadata;

                var formatted = AiResponseFormatter.TryFormat(toolResult, intent);
                if (formatted != null)
                {
                    aiResponse = formatted;
                }
                else if (!toolResult.Success && !string.IsNullOrWhiteSpace(toolResult.Message))
                {
                    aiResponse = toolResult.Message;
                }
                else if (intent is AiIntents.GeneralChat or AiIntents.Faq or AiIntents.Unknown)
                {
                    aiResponse = await SynthesizeResponseAsync(
                        normalizedUserMessage,
                        role,
                        metadata,
                        toolResult,
                        history,
                        cancellationToken);
                }
                else
                {
                    aiResponse = toolResult.Message
                        ?? "Xin lỗi, tôi chưa hiểu yêu cầu. Bạn có thể thử tìm sân, kiểm tra lịch hoặc xem booking.";
                }
            }
        }
        catch (AppException ex) when (ex.Code == ErrorCodes.AiRateLimited)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI processing failed for user {UserId}", userId);
            aiResponse = "Xin lỗi, hệ thống AI hiện đang gặp sự cố. Bạn có thể thử lại sau.";
        }

        conversation.MetadataJson = AiJsonHelper.SerializeMetadata(metadata);
        conversation.UpdatedAt = DateTime.UtcNow;

        var userMessageEntity = new AIChatMessage
        {
            UserId = userId,
            Role = "user",
            Content = normalizedUserMessage,
            ConversationId = conversation.Id
        };
        await _aiChatRepository.AddMessageAsync(userMessageEntity, cancellationToken);

        var assistantMessageEntity = new AIChatMessage
        {
            UserId = userId,
            Role = "assistant",
            Content = aiResponse,
            ConversationId = conversation.Id
        };
        await _aiChatRepository.AddMessageAsync(assistantMessageEntity, cancellationToken);

        try
        {
            await _aiChatRepository.UpdateConversationAsync(conversation, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to update conversation metadata for {ConversationId}", conversation.Id);
        }

        sw.Stop();
        _logger.LogInformation(
            "AI chat completed UserId={UserId} Intent={Intent} DurationMs={DurationMs} Success=true",
            userId, intent, sw.ElapsedMilliseconds);

        var updatedHistory = await _aiChatRepository.GetMessagesByConversationAsync(conversation.Id, cancellationToken);

        return new ChatResponseDto
        {
            Response = aiResponse,
            ConversationId = conversation.Id,
            Id = assistantMessageEntity.Id,
            Timestamp = assistantMessageEntity.CreatedAt,
            History = updatedHistory.Select(m => new ChatMessageDto
            {
                Role = m.Role,
                Content = m.Content,
                CreatedAt = m.CreatedAt
            }).ToList()
        };
    }

    private async Task<string> SynthesizeResponseAsync(
        string userMessage,
        string role,
        AiConversationMetadata metadata,
        AiToolResult toolResult,
        List<AIChatMessage> history,
        CancellationToken cancellationToken)
    {
        var pendingSummary = metadata.PendingBooking != null
            ? $"{metadata.PendingBooking.CourtName} - {metadata.PendingBooking.VenueName}, {metadata.PendingBooking.BookingDate} {metadata.PendingBooking.StartTime}-{metadata.PendingBooking.EndTime}, {metadata.PendingBooking.TotalPrice:N0}đ"
            : null;

        var toolJson = AiJsonHelper.SerializeToolResult(toolResult);
        var historyText = string.Join("\n", history.TakeLast(6).Select(m => $"{m.Role}: {Truncate(m.Content, 300)}"));

        var messages = new List<GroqMessage>
        {
            new() { role = "system", content = AiPrompts.BuildSynthesizerSystem(role, pendingSummary) },
            new()
            {
                role = "user",
                content = $"""
                    Câu hỏi người dùng: {userMessage}

                    Lịch sử gần đây:
                    {historyText}

                    KẾT QUẢ HỆ THỐNG (JSON):
                    {toolJson}

                    Hãy trả lời người dùng bằng tiếng Việt dựa CHỈ trên dữ liệu trên.
                    """
            }
        };

        return await _groqService.GetChatCompletionAsync(messages, cancellationToken, maxTokens: 1536)
               ?? "Xin lỗi, tôi chưa thể tạo câu trả lời. Vui lòng thử lại.";
    }

    private static string Truncate(string text, int max) =>
        text.Length <= max ? text : text[..max] + "...";
}
