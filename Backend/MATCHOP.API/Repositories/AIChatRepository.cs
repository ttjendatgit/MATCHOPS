using MATCHOP.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories
{
    public interface IAIChatRepository
    {
        Task<List<AIChatMessage>> GetHistoryAsync(Guid userId, int limit = 20);
        Task AddMessageAsync(AIChatMessage message);
        Task ClearHistoryAsync(Guid userId);
    }

    public class AIChatRepository : IAIChatRepository
    {
        private readonly ApplicationDbContext _context;

        public AIChatRepository(ApplicationDbContext context)
        {
            _context = context;
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
            var messages = await _context.AIChatMessages.Where(m => m.UserId == userId).ToListAsync();
            _context.AIChatMessages.RemoveRange(messages);
            await _context.SaveChangesAsync();
        }
    }
}
