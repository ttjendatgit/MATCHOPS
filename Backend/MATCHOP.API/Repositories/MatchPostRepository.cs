using MATCHOP.API.Entities;
using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories
{
    public class MatchPostRepository : IMatchPostRepository
    {
        private readonly ApplicationDbContext _context;

        public MatchPostRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<MatchPost?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.MatchPosts
                .Include(p => p.Creator)
                .Include(p => p.Sport)
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        }

        public async Task<List<MatchPost>> GetFilteredAsync(MatchPostFilterDto filter, CancellationToken cancellationToken = default)
        {
            var query = _context.MatchPosts
                .Include(p => p.Creator)
                .Include(p => p.Sport)
                .AsQueryable();

            query = ApplyFilter(query, filter);

            return await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync(cancellationToken);
        }

        public async Task<int> GetCountAsync(MatchPostFilterDto filter, CancellationToken cancellationToken = default)
        {
            var query = _context.MatchPosts.AsQueryable();
            query = ApplyFilter(query, filter);
            return await query.CountAsync(cancellationToken);
        }

        public async Task<int> CountByCreatorInMonthAsync(Guid creatorId, DateTime monthStart, DateTime nextMonthStart)
        {
            return await _context.MatchPosts
                .CountAsync(p =>
                    p.CreatorId == creatorId &&
                    p.CreatedAt >= monthStart &&
                    p.CreatedAt < nextMonthStart);
        }

        public async Task AddAsync(MatchPost post, CancellationToken cancellationToken = default)
        {
            await _context.MatchPosts.AddAsync(post, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task UpdateAsync(MatchPost post, CancellationToken cancellationToken = default)
        {
            post.UpdatedAt = DateTime.UtcNow;
            _context.MatchPosts.Update(post);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteAsync(MatchPost post, CancellationToken cancellationToken = default)
        {
            post.Status = MatchPostStatus.CANCELLED;
            post.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<(List<MatchPost> Posts, int TotalCount)> GetAllForAdminAsync(MatchPostFilterDto filter, CancellationToken cancellationToken = default)
        {
            var query = _context.MatchPosts
                .Include(p => p.Creator)
                .Include(p => p.Sport)
                .AsQueryable();

            // Apply sport filter
            if (filter.SportId.HasValue)
                query = query.Where(p => p.SportId == filter.SportId.Value);

            // Apply city filter
            if (!string.IsNullOrWhiteSpace(filter.City))
                query = query.Where(p => p.City.ToLower().Contains(filter.City.ToLower()));

            // Apply status filter if provided
            if (!string.IsNullOrEmpty(filter.StatusFilter) && Enum.TryParse<MatchPostStatus>(filter.StatusFilter, true, out var statusEnum))
                query = query.Where(p => p.Status == statusEnum);

            var totalCount = await query.CountAsync(cancellationToken);

            var posts = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync(cancellationToken);

            return (posts, totalCount);
        }

        public async Task<int> GetTotalCountAsync(CancellationToken cancellationToken = default)
        {
            return await _context.MatchPosts.CountAsync(cancellationToken);
        }

        public async Task<int> GetCountByStatusAsync(string status, CancellationToken cancellationToken = default)
        {
            if (Enum.TryParse<MatchPostStatus>(status, true, out var statusEnum))
            {
                return await _context.MatchPosts.CountAsync(p => p.Status == statusEnum, cancellationToken);
            }
            return 0;
        }

        private static IQueryable<MatchPost> ApplyFilter(IQueryable<MatchPost> query, MatchPostFilterDto filter)
        {
            if (filter.SportId.HasValue)
                query = query.Where(p => p.SportId == filter.SportId.Value);

            if (filter.CreatorId.HasValue)
                query = query.Where(p => p.CreatorId == filter.CreatorId.Value);

            if (filter.Level.HasValue)
                query = query.Where(p => p.MinSkillLevel <= filter.Level.Value && p.MaxSkillLevel >= filter.Level.Value);

            if (!string.IsNullOrWhiteSpace(filter.City))
                query = query.Where(p => p.City.ToLower().Contains(filter.City.ToLower()));

            if (!string.IsNullOrWhiteSpace(filter.District))
                query = query.Where(p => p.District.ToLower().Contains(filter.District.ToLower()));

            if (filter.Date.HasValue)
                query = query.Where(p => p.PreferredTime.Date == filter.Date.Value.Date);

            // If searching for own posts, show all statuses. Otherwise show only future OPEN posts.
            if (!filter.CreatorId.HasValue)
            {
                query = query.Where(p => p.Status == MatchPostStatus.OPEN && p.PreferredTime > DateTime.UtcNow);
            }

            return query;
        }
    }
}
