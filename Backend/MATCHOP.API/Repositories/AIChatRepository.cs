using MATCHOP.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories
{
    public interface IAIChatRepository
    {
        Task<List<AIConversation>> GetConversationsAsync(Guid userId);
        Task<AIConversation?> GetConversationAsync(Guid conversationId, Guid userId);
        Task<List<AIChatMessage>> GetMessagesByConversationAsync(Guid conversationId);
        Task<List<AIChatMessage>> GetHistoryAsync(Guid userId, int limit = 20);
        Task AddMessageAsync(AIChatMessage message);
        Task ClearHistoryAsync(Guid userId);
        Task AddConversationAsync(AIConversation conversation);
        Task UpdateConversationAsync(AIConversation conversation);
        Task DeleteConversationAsync(Guid conversationId, Guid userId);
    }

    public class AIChatRepository : IAIChatRepository
    {
        private readonly ApplicationDbContext _context;

        public AIChatRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<AIConversation>> GetConversationsAsync(Guid userId)
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
                .ToListAsync();
        }

        public async Task<AIConversation?> GetConversationAsync(Guid conversationId, Guid userId)
        {
            return await _context.AIConversations
                .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId);
        }

        public async Task<List<AIChatMessage>> GetMessagesByConversationAsync(Guid conversationId)
        {
            return await _context.AIChatMessages
                .Where(m => m.ConversationId == conversationId)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<AIChatMessage>> GetHistoryAsync(Guid userId, int limit = 20)
        {
            return await _context.AIChatMessages
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(limit)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task AddMessageAsync(AIChatMessage message)
        {
            await _context.AIChatMessages.AddAsync(message);
            await _context.SaveChangesAsync();
        }

        public async Task ClearHistoryAsync(Guid userId)
        {
            var conversations = await _context.AIConversations.Where(c => c.UserId == userId).ToListAsync();
            _context.AIConversations.RemoveRange(conversations);
            await _context.SaveChangesAsync();
        }

        public async Task AddConversationAsync(AIConversation conversation)
        {
            await _context.AIConversations.AddAsync(conversation);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateConversationAsync(AIConversation conversation)
        {
            _context.AIConversations.Update(conversation);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteConversationAsync(Guid conversationId, Guid userId)
        {
            var conversation = await _context.AIConversations
                .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId);
            if (conversation != null)
            {
                _context.AIConversations.Remove(conversation);
                await _context.SaveChangesAsync();
            }
        }
    }
}
