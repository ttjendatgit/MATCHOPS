using MATCHOP.API.DTOs.AI;
using MATCHOP.API.Entities;
using MATCHOP.API.Repositories;
using MATCHOP.API.Services;
using MATCHOP.API.Services.Interfaces;
using System.Text;
using System.Text.Json;

namespace MATCHOP.API.Services
{
    public interface IAIService
    {
        Task<ChatResponseDto> ProcessMessageAsync(Guid userId, string userMessage);
    }

    public class AIService : IAIService
    {
        private readonly IGroqService _groqService;
        private readonly IAIChatRepository _aiChatRepository;
        private readonly IVenueService _venueService;
        private readonly IBookingService _bookingService;
        private readonly ISportService _sportService;
        private readonly IUserSkillService _userSkillService;
        private readonly IMatchPostService _matchPostService;

        public AIService(
            IGroqService groqService,
            IAIChatRepository aiChatRepository,
            IVenueService venueService,
            IBookingService bookingService,
            ISportService sportService,
            IUserSkillService userSkillService,
            IMatchPostService matchPostService)
        {
            _groqService = groqService;
            _aiChatRepository = aiChatRepository;
            _venueService = venueService;
            _bookingService = bookingService;
            _sportService = sportService;
            _userSkillService = userSkillService;
            _matchPostService = matchPostService;
        }

        public async Task<ChatResponseDto> ProcessMessageAsync(Guid userId, string userMessage)
        {
            // 1. Get Context from Database
            var context = await GetSystemContextAsync(userId);

            // 2. Get Chat History
            var history = await _aiChatRepository.GetHistoryAsync(userId);
            
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
4. Gợi ý đối thủ hoặc bài đăng ghép trận dựa trên trình độ kỹ năng và khu vực (thành phố, quận).
5. Trả lời lịch sự, ngắn gọn và hữu ích bằng tiếng Việt.

Nếu người dùng hỏi về thông tin không có trong dữ liệu trên, hãy trả lời rằng bạn không có thông tin chính xác và khuyên họ kiểm tra lại trên ứng dụng."
            });

            // History
            foreach (var msg in history)
            {
                messages.Add(new GroqMessage { role = msg.Role, content = msg.Content });
            }

            // Current User Message
            messages.Add(new GroqMessage { role = "user", content = userMessage });

            // 4. Call Groq API
            var aiResponse = await _groqService.GetChatCompletionAsync(messages);

            // 5. Save History
            await _aiChatRepository.AddMessageAsync(new AIChatMessage { UserId = userId, Role = "user", Content = userMessage });
            await _aiChatRepository.AddMessageAsync(new AIChatMessage { UserId = userId, Role = "assistant", Content = aiResponse });

            // 6. Return Result
            var updatedHistory = await _aiChatRepository.GetHistoryAsync(userId);
            return new ChatResponseDto
            {
                Response = aiResponse,
                History = updatedHistory.Select(m => new ChatMessageDto
                {
                    Role = m.Role,
                    Content = m.Content,
                    CreatedAt = m.CreatedAt
                }).ToList()
            };
        }

        private async Task<string> GetSystemContextAsync(Guid userId)
        {
            var sb = new StringBuilder();

            // Sports
            var sports = await _sportService.GetActiveSportsAsync();
            sb.AppendLine("Môn thể thao:");
            foreach (var s in sports) sb.AppendLine($"- {s.Name} (ID: {s.Id})");

            // Venues
            var venues = await _venueService.GetActiveVenuesAsync(null, null, null, null);
            sb.AppendLine("\nĐịa điểm (Venues):");
            foreach (var v in venues.Take(10)) sb.AppendLine($"- {v.Name}: {v.Address}, {v.District}, {v.City}. Mở cửa: {v.OpeningTime}-{v.ClosingTime}");

            // User Skills
            var skills = await _userSkillService.GetUserSkillsAsync(userId);
            sb.AppendLine("\nTrình độ của bạn:");
            if (skills.Any())
            {
                foreach (var sk in skills) sb.AppendLine($"- {sk.SportName}: {sk.Level}");
            }
            else sb.AppendLine("- Bạn chưa cập nhật trình độ.");

            // User Bookings
            var bookings = await _bookingService.GetMyBookingsAsync();
            sb.AppendLine("\nĐơn đặt sân của bạn:");
            if (bookings.Any())
            {
                foreach (var b in bookings.Take(5)) sb.AppendLine($"- Đơn {b.Id}: {b.VenueName}, Sân {b.CourtName}, Ngày {b.BookingDate}, Tổng {b.TotalPrice} VNĐ, Trạng thái: {b.Status}");
            }
            else sb.AppendLine("- Bạn chưa có đơn đặt sân nào.");

            // Matching Posts
             var matchPosts = await _matchPostService.GetPostsAsync(new MATCHOP.API.DTOs.Matching.MatchPostFilterDto());
             sb.AppendLine("\nCác bài đăng tìm đối thủ/ghép trận đang mở:");
             if (matchPosts.Any())
             {
                 foreach (var p in matchPosts.Where(x => x.Status == "OPEN").Take(10))
                 {
                     sb.AppendLine($"- [{p.SportName}] {p.CreatorName} tìm đối thủ tại {p.District}, {p.City}. Trình độ: {p.MinSkillLevel}-{p.MaxSkillLevel}. Thời gian: {p.PreferredTime}. Ghi chú: {p.Note}");
                 }
             }
             else sb.AppendLine("- Hiện không có bài đăng ghép trận nào.");

            return sb.ToString();
        }
    }
}
