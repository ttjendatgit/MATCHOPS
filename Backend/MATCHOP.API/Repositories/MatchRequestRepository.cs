using MATCHOP.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories
{
    public interface IMatchRequestRepository
    {
        Task AddAsync(MatchRequest request, CancellationToken cancellationToken = default);
        Task<MatchRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<MatchRequest>> GetPendingRequestsForUserAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<List<MatchRequest>> GetSentRequestsAsync(Guid senderUserId, CancellationToken cancellationToken = default);
        Task UpdateAsync(MatchRequest request, CancellationToken cancellationToken = default);
        Task AcceptWithPostUpdateAsync(MatchRequest request, MatchPost post, CancellationToken cancellationToken = default);
        Task<bool> ExistsAsync(Guid postId, Guid senderUserId, CancellationToken cancellationToken = default);
        Task<(List<MatchRequest> Requests, int TotalCount)> GetAllForAdminAsync(Guid? postId, string? status, int page, int pageSize, CancellationToken cancellationToken = default);
    }

    public class MatchRequestRepository : IMatchRequestRepository
    {
        private readonly ApplicationDbContext _context;

        public MatchRequestRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(MatchRequest request, CancellationToken cancellationToken = default)
        {
            await _context.MatchRequests.AddAsync(request, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<MatchRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.MatchRequests
                .Include(r => r.Post)
                    .ThenInclude(p => p.Sport)
                .Include(r => r.SenderUser)
                .Include(r => r.ReceiverUser)
                .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        }

        public async Task<List<MatchRequest>> GetPendingRequestsForUserAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.MatchRequests
                .Include(r => r.Post)
                    .ThenInclude(p => p.Sport)
                .Include(r => r.SenderUser)
                .Where(r => r.ReceiverUserId == userId && r.Status == MatchRequestStatus.PENDING)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<MatchRequest>> GetSentRequestsAsync(Guid senderUserId, CancellationToken cancellationToken = default)
        {
            return await _context.MatchRequests
                .Include(r => r.Post)
                    .ThenInclude(p => p.Sport)
                .Include(r => r.ReceiverUser)
                .Where(r => r.SenderUserId == senderUserId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task UpdateAsync(MatchRequest request, CancellationToken cancellationToken = default)
        {
            _context.MatchRequests.Update(request);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task AcceptWithPostUpdateAsync(MatchRequest request, MatchPost post, CancellationToken cancellationToken = default)
        {
            _context.MatchRequests.Update(request);
            _context.MatchPosts.Update(post);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<bool> ExistsAsync(Guid postId, Guid senderUserId, CancellationToken cancellationToken = default)
        {
            // Block if any active (PENDING or ACCEPTED) request already exists for this post/user pair.
            return await _context.MatchRequests
                .AnyAsync(r => r.PostId == postId && r.SenderUserId == senderUserId
                    && (r.Status == MatchRequestStatus.PENDING || r.Status == MatchRequestStatus.ACCEPTED), cancellationToken);
        }

        public async Task<(List<MatchRequest> Requests, int TotalCount)> GetAllForAdminAsync(
            Guid? postId, string? status, int page, int pageSize, CancellationToken cancellationToken = default)
        {
            var query = _context.MatchRequests
                .Include(r => r.Post).ThenInclude(p => p!.Sport)
                .Include(r => r.SenderUser)
                .Include(r => r.ReceiverUser)
                .AsQueryable();

            if (postId.HasValue)
                query = query.Where(r => r.PostId == postId.Value);

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<MatchRequestStatus>(status, true, out var statusEnum))
                query = query.Where(r => r.Status == statusEnum);

            var totalCount = await query.CountAsync(cancellationToken);

            var requests = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (requests, totalCount);
        }
    }
}
