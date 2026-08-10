using MATCHOP.API.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace MATCHOP.API.Repositories
{
    public interface IAIChatRepository
    {
        Task<List<AIConversation>> GetConversationsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<AIConversation?> GetConversationAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default);
        Task<AIConversation?> GetConversationWithMessagesAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default);
        Task<List<AIChatMessage>> GetMessagesByConversationAsync(Guid conversationId, CancellationToken cancellationToken = default);
        Task<List<AIChatMessage>> GetHistoryAsync(Guid userId, int limit = 20, CancellationToken cancellationToken = default);
        Task AddMessageAsync(AIChatMessage message, CancellationToken cancellationToken = default);
        Task ClearHistoryAsync(Guid userId, CancellationToken cancellationToken = default);
        Task AddConversationAsync(AIConversation conversation, CancellationToken cancellationToken = default);
        Task UpdateConversationAsync(AIConversation conversation, CancellationToken cancellationToken = default);
        Task DeleteConversationAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default);
    }

    public class AIChatRepository : IAIChatRepository
    {
        private readonly ApplicationDbContext _context;

        public AIChatRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<AIConversation>> GetConversationsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.AIConversations
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.UpdatedAt)
                .Select(c => new AIConversation
                {
                    Id = c.Id,
                    Title = c.Title,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    UserId = c.UserId,
                    Messages = c.Messages.OrderByDescending(m => m.CreatedAt).Take(1).ToList()
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<AIConversation?> GetConversationAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default)
        {
            // #region debug-point G:repo-get-conversation
            _ = ReportAiDebugAsync("G", "AIChatRepository.GetConversationAsync started", new
            {
                conversationId,
                userId
            });
            // #endregion
            var conversation = await _context.AIConversations
                .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, cancellationToken);
            // #region debug-point G:repo-get-conversation-result
            _ = ReportAiDebugAsync("G", "AIChatRepository.GetConversationAsync finished", new
            {
                conversationId,
                userId,
                found = conversation != null,
                title = conversation?.Title
            });
            // #endregion
            return conversation;
        }

        public async Task<AIConversation?> GetConversationWithMessagesAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default)
        {
            var conversation = await _context.AIConversations
                .Include(c => c.Messages.OrderBy(m => m.CreatedAt))
                .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, cancellationToken);
            // #region debug-point G:repo-get-conversation-with-messages
            _ = ReportAiDebugAsync("G", "AIChatRepository.GetConversationWithMessagesAsync finished", new
            {
                conversationId,
                userId,
                found = conversation != null,
                messageCount = conversation?.Messages.Count ?? 0
            });
            // #endregion
            return conversation;
        }

        public async Task<List<AIChatMessage>> GetMessagesByConversationAsync(Guid conversationId, CancellationToken cancellationToken = default)
        {
            var messages = await _context.AIChatMessages
                .Where(m => m.ConversationId == conversationId)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync(cancellationToken);
            // #region debug-point G:repo-get-messages-result
            _ = ReportAiDebugAsync("G", "AIChatRepository.GetMessagesByConversationAsync finished", new
            {
                conversationId,
                count = messages.Count
            });
            // #endregion
            return messages;
        }

        public async Task<List<AIChatMessage>> GetHistoryAsync(Guid userId, int limit = 20, CancellationToken cancellationToken = default)
        {
            return await _context.AIChatMessages
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(limit)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task AddMessageAsync(AIChatMessage message, CancellationToken cancellationToken = default)
        {
            await _context.AIChatMessages.AddAsync(message, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task ClearHistoryAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var conversations = await _context.AIConversations.Where(c => c.UserId == userId).ToListAsync(cancellationToken);
            _context.AIConversations.RemoveRange(conversations);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task AddConversationAsync(AIConversation conversation, CancellationToken cancellationToken = default)
        {
            await _context.AIConversations.AddAsync(conversation, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task UpdateConversationAsync(AIConversation conversation, CancellationToken cancellationToken = default)
        {
            _context.AIConversations.Update(conversation);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteConversationAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default)
        {
            var conversation = await _context.AIConversations
                .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, cancellationToken);
            if (conversation != null)
            {
                _context.AIConversations.Remove(conversation);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        // #region debug-point G:repo-report-helper
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
                    location = "Backend/MATCHOP.API/Repositories/AIChatRepository.cs",
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
