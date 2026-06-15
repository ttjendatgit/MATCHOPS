using MATCHOP.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories
{
    public interface IMatchRequestRepository
    {
        Task AddAsync(MatchRequest request);
        Task<MatchRequest?> GetByIdAsync(Guid id);
        Task<List<MatchRequest>> GetPendingRequestsForUserAsync(Guid userId);
        Task<List<MatchRequest>> GetSentRequestsAsync(Guid senderUserId);
        Task UpdateAsync(MatchRequest request);
        Task AcceptWithPostUpdateAsync(MatchRequest request, MatchPost post);
        Task<bool> ExistsAsync(Guid postId, Guid senderUserId);
    }

    public class MatchRequestRepository : IMatchRequestRepository
    {
        private readonly ApplicationDbContext _context;

        public MatchRequestRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(MatchRequest request)
        {
            await _context.MatchRequests.AddAsync(request);
            await _context.SaveChangesAsync();
        }

        public async Task<MatchRequest?> GetByIdAsync(Guid id)
        {
            return await _context.MatchRequests
                .Include(r => r.Post)
                    .ThenInclude(p => p.Sport)
                .Include(r => r.SenderUser)
                .Include(r => r.ReceiverUser)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<List<MatchRequest>> GetPendingRequestsForUserAsync(Guid userId)
        {
            return await _context.MatchRequests
                .Include(r => r.Post)
                    .ThenInclude(p => p.Sport)
                .Include(r => r.SenderUser)
                .Where(r => r.ReceiverUserId == userId && r.Status == MatchRequestStatus.PENDING)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<MatchRequest>> GetSentRequestsAsync(Guid senderUserId)
        {
            return await _context.MatchRequests
                .Include(r => r.Post)
                    .ThenInclude(p => p.Sport)
                .Include(r => r.ReceiverUser)
                .Where(r => r.SenderUserId == senderUserId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task UpdateAsync(MatchRequest request)
        {
            _context.MatchRequests.Update(request);
            await _context.SaveChangesAsync();
        }

        public async Task AcceptWithPostUpdateAsync(MatchRequest request, MatchPost post)
        {
            _context.MatchRequests.Update(request);
            _context.MatchPosts.Update(post);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistsAsync(Guid postId, Guid senderUserId)
        {
            // Block if any active (PENDING or ACCEPTED) request already exists for this post/user pair.
            return await _context.MatchRequests
                .AnyAsync(r => r.PostId == postId && r.SenderUserId == senderUserId
                    && (r.Status == MatchRequestStatus.PENDING || r.Status == MatchRequestStatus.ACCEPTED));
        }
    }
}
