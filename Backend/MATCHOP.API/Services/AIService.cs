using MATCHOP.API.DTOs.AI;
using MATCHOP.API.Entities;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories;
using MATCHOP.API.Services;
using MATCHOP.API.Services.Interfaces;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace MATCHOP.API.Services
{
    public interface IAIService
    {
        Task<ChatResponseDto> ProcessMessageAsync(Guid userId, string userMessage, Guid? conversationId = null, CancellationToken cancellationToken = default);
    }

    public class AIService : IAIService
    {
        private readonly IGroqService _groqService;
        private readonly IAIChatRepository _aiChatRepository;
        private readonly IVenueService _venueService;
        private readonly IBookingService _bookingService;
        private readonly ISportService _sportService;
        private readonly IUserSkillService _userSkillService;

        public AIService(
            IGroqService groqService,
            IAIChatRepository aiChatRepository,
            IVenueService venueService,
            IBookingService bookingService,
            ISportService sportService,
            IUserSkillService userSkillService)
        {
            _groqService = groqService;
            _aiChatRepository = aiChatRepository;
            _venueService = venueService;
            _bookingService = bookingService;
            _sportService = sportService;
            _userSkillService = userSkillService;
        }

        public async Task<ChatResponseDto> ProcessMessageAsync(Guid userId, string userMessage, Guid? conversationId = null, CancellationToken cancellationToken = default)
        {
            var normalizedUserMessage = string.IsNullOrWhiteSpace(userMessage) ? string.Empty : userMessage.Trim();
            AIConversation conversation;
            List<AIChatMessage> history;
            // #region debug-point F:service-process-start
            _ = ReportAiDebugAsync("F", "AIService.ProcessMessageAsync started", new
            {
                userId,
                messageLength = normalizedUserMessage.Length,
                conversationId
            });
            // #endregion
            
            // 1. Check if conversation exists or create new
            if (conversationId.HasValue)
            {
                // Try to load existing conversation
                conversation = await _aiChatRepository.GetConversationAsync(conversationId.Value, userId, cancellationToken)
                    ?? throw new AppException(ErrorCodes.ConversationNotFound, "Conversation not found");
                
                history = await _aiChatRepository.GetMessagesByConversationAsync(conversationId.Value, cancellationToken);
                // #region debug-point F:service-existing-conversation
                _ = ReportAiDebugAsync("F", "AIService loaded existing conversation", new
                {
                    userId,
                    conversationId = conversation.Id,
                    title = conversation.Title,
                    historyCount = history.Count
                });
                // #endregion
            }
            else
            {
                // Create new conversation
                conversation = new AIConversation
                {
                    UserId = userId,
                    Title = normalizedUserMessage.Length > 50 ? normalizedUserMessage.Substring(0, 50) + "..." : normalizedUserMessage
                };
                await _aiChatRepository.AddConversationAsync(conversation, cancellationToken);
                history = new List<AIChatMessage>();
                // #region debug-point F:service-new-conversation
                _ = ReportAiDebugAsync("F", "AIService created new conversation", new
                {
                    userId,
                    conversationId = conversation.Id,
                    title = conversation.Title
                });
                // #endregion
            }

            // 2. Get Context from Database
            var context = await GetSystemContextAsync(userId, cancellationToken);

            // 3. Prepare Messages for Groq
            var messages = new List<GroqMessage>();
            
            // System Prompt with Database Context
            messages.Add(new GroqMessage 
            { 
                role = "system", 
                content = $@"Bạn là trợ lý AI thông minh của hệ thống MATCHOP - ứng dụng đặt sân và ghép trận thể thao (Cầu lông, Pickleball, Bóng bàn).

Dữ liệu hiện tại của hệ thống:
{context}

Nhiệm vụ của bạn:
1. Trả lời câu hỏi về đặt sân, địa điểm (venue), sân (court) còn trống.
2. Trả lời câu hỏi về lịch sử đặt sân của người dùng.
3. Gợi ý địa điểm chơi phù hợp.
4. Gợi ý đối thủ dựa trên trình độ kỹ năng.
5. Trả lời lịch sự, ngắn gọn và hữu ích bằng tiếng Việt.

Nếu người dùng hỏi về thông tin không có trong dữ liệu trên, hãy trả lời rằng bạn không có thông tin chính xác và khuyên họ kiểm tra lại trên ứng dụng."
            });

            // History
            foreach (var msg in history)
            {
                messages.Add(new GroqMessage { role = msg.Role, content = msg.Content });
            }

            // Current User Message
            messages.Add(new GroqMessage { role = "user", content = normalizedUserMessage });

            // 4. Call Groq API
            var aiResponse = await _groqService.GetChatCompletionAsync(messages, cancellationToken) ?? string.Empty;

            // 5. Save History
            var userMessageEntity = new AIChatMessage { UserId = userId, Role = "user", Content = normalizedUserMessage, ConversationId = conversation.Id };
            await _aiChatRepository.AddMessageAsync(userMessageEntity, cancellationToken);
            
            var assistantMessageEntity = new AIChatMessage { UserId = userId, Role = "assistant", Content = aiResponse, ConversationId = conversation.Id };
            await _aiChatRepository.AddMessageAsync(assistantMessageEntity, cancellationToken);

            // Update conversation
            conversation.UpdatedAt = DateTime.UtcNow;
            await _aiChatRepository.UpdateConversationAsync(conversation, cancellationToken);

            // 6. Return Result
            var updatedHistory = await _aiChatRepository.GetMessagesByConversationAsync(conversation.Id, cancellationToken);
            // #region debug-point F:service-process-success
            _ = ReportAiDebugAsync("F", "AIService.ProcessMessageAsync succeeded", new
            {
                userId,
                conversationId = conversation.Id,
                updatedHistoryCount = updatedHistory.Count,
                assistantMessageId = assistantMessageEntity.Id
            });
            // #endregion
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

        // #region debug-point F:service-report-helper
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
                    location = "Backend/MATCHOP.API/Services/AIService.cs",
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

        private async Task<string> GetSystemContextAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var sb = new StringBuilder();

            // Sports
            var sports = await _sportService.GetActiveSportsAsync(cancellationToken);
            sb.AppendLine("Môn thể thao:");
            foreach (var s in sports) sb.AppendLine($"- {s.Name} (ID: {s.Id})");

            // Venues
            var venues = await _venueService.GetActiveVenuesAsync(null, null, null, null, cancellationToken);
            sb.AppendLine("\nĐịa điểm (Venues):");
            foreach (var v in venues.Take(10)) sb.AppendLine($"- {v.Name}: {v.Address}, {v.District}, {v.City}. Mở cửa: {v.OpeningTime}-{v.ClosingTime}");

            // User Skills
            var skills = await _userSkillService.GetUserSkillsAsync(userId, cancellationToken);
            sb.AppendLine("\nTrình độ của bạn:");
            if (skills.Any())
            {
                foreach (var sk in skills) sb.AppendLine($"- {sk.SportName}: {sk.Level}");
            }
            else sb.AppendLine("- Bạn chưa cập nhật trình độ.");

            // User Bookings
            var bookings = await _bookingService.GetMyBookingsAsync(cancellationToken);
            sb.AppendLine("\nĐơn đặt sân của bạn:");
            if (bookings.Any())
            {
                foreach (var b in bookings.Take(5)) sb.AppendLine($"- Đơn {b.Id}: {b.VenueName}, Sân {b.CourtName}, Ngày {b.BookingDate}, Tổng {b.TotalPrice} VNĐ, Trạng thái: {b.Status}");
            }
            else sb.AppendLine("- Bạn chưa có đơn đặt sân nào.");

            return sb.ToString();
        }
    }
}
