using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories
{
    public class MatchQueueRepository : IMatchQueueRepository
    {
        private readonly ApplicationDbContext _context;

        public MatchQueueRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<MatchQueue?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.MatchQueues
                .Include(q => q.User)
                .Include(q => q.Sport)
                .FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
        }

        public async Task<MatchQueue?> GetByUserAndSportAsync(Guid userId, Guid sportId, CancellationToken cancellationToken = default)
        {
            return await _context.MatchQueues
                .FirstOrDefaultAsync(q => q.UserId == userId && q.SportId == sportId, cancellationToken);
        }

        public async Task<List<MatchQueue>> FindMatchesAsync(MatchQueue item, CancellationToken cancellationToken = default)
        {
            // Logic auto matching:
            // 1. Cùng Sport
            // 2. Không phải chính mình
            // 3. Level chênh lệch tối đa 1 (trừ khi là Competitive thì phải cùng level?) -> Giả sử abs(diff) <= 1
            // 4. Cùng khu vực (City)
            // 5. Thời gian giao nhau
            
            return await _context.MatchQueues
                .Include(q => q.User)
                .Where(q => q.Id != item.Id &&
                            q.SportId == item.SportId &&
                            q.City == item.City &&
                            Math.Abs((int)q.SkillLevel - (int)item.SkillLevel) <= 1 &&
                            q.PreferredTimeStart < item.PreferredTimeEnd &&
                            q.PreferredTimeEnd > item.PreferredTimeStart)
                .ToListAsync(cancellationToken);
        }

        public async Task AddAsync(MatchQueue item, CancellationToken cancellationToken = default)
        {
            await _context.MatchQueues.AddAsync(item, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task RemoveAsync(MatchQueue item, CancellationToken cancellationToken = default)
        {
            _context.MatchQueues.Remove(item);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
