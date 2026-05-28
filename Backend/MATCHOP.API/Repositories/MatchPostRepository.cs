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

        public async Task<MatchPost?> GetByIdAsync(Guid id)
        {
            return await _context.MatchPosts
                .Include(p => p.Creator)
                .Include(p => p.Sport)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<List<MatchPost>> GetFilteredAsync(MatchPostFilterDto filter)
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
                .ToListAsync();
        }

        public async Task<int> GetCountAsync(MatchPostFilterDto filter)
        {
            var query = _context.MatchPosts.AsQueryable();
            query = ApplyFilter(query, filter);
            return await query.CountAsync();
        }

        public async Task AddAsync(MatchPost post)
        {
            await _context.MatchPosts.AddAsync(post);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(MatchPost post)
        {
            post.UpdatedAt = DateTime.UtcNow;
            _context.MatchPosts.Update(post);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(MatchPost post)
        {
            post.Status = MatchPostStatus.CANCELLED;
            post.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        private static IQueryable<MatchPost> ApplyFilter(IQueryable<MatchPost> query, MatchPostFilterDto filter)
        {
            if (filter.SportId.HasValue)
                query = query.Where(p => p.SportId == filter.SportId.Value);

            if (filter.Level.HasValue)
                query = query.Where(p => p.MinSkillLevel <= filter.Level.Value && p.MaxSkillLevel >= filter.Level.Value);

            if (!string.IsNullOrWhiteSpace(filter.City))
                query = query.Where(p => p.City.ToLower().Contains(filter.City.ToLower()));

            if (!string.IsNullOrWhiteSpace(filter.District))
                query = query.Where(p => p.District.ToLower().Contains(filter.District.ToLower()));

            if (filter.Date.HasValue)
                query = query.Where(p => p.PreferredTime.Date == filter.Date.Value.Date);

            query = query.Where(p => p.Status == MatchPostStatus.OPEN);

            return query;
        }
    }
}
