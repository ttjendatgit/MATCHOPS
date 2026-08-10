using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories
{
    public class MatchRoomRepository : IMatchRoomRepository
    {
        private readonly ApplicationDbContext _context;

        public MatchRoomRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<MatchRoom?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.MatchRooms
                .Include(r => r.Sport)
                .Include(r => r.MatchPost)
                    .ThenInclude(p => p!.Creator)
                .Include(r => r.MatchPost)
                    .ThenInclude(p => p!.Sport)
                .Include(r => r.Players)
                    .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        }

        public async Task<MatchRoom?> GetByMatchPostIdAsync(Guid matchPostId, CancellationToken cancellationToken = default)
        {
            return await _context.MatchRooms
                .Include(r => r.Sport)
                .Include(r => r.MatchPost)
                    .ThenInclude(p => p!.Creator)
                .Include(r => r.MatchPost)
                    .ThenInclude(p => p!.Sport)
                .Include(r => r.Players)
                    .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(r => r.MatchPostId == matchPostId, cancellationToken);
        }

        public async Task<List<MatchRoom>> GetUserRoomsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.MatchRooms
                .Include(r => r.Sport)
                .Include(r => r.MatchPost)
                    .ThenInclude(p => p!.Creator)
                .Include(r => r.MatchPost)
                    .ThenInclude(p => p!.Sport)
                .Include(r => r.Players)
                    .ThenInclude(p => p.User)
                .Where(r => r.Players.Any(p => p.UserId == userId))
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task AddAsync(MatchRoom room, CancellationToken cancellationToken = default)
        {
            await _context.MatchRooms.AddAsync(room, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task UpdateAsync(MatchRoom room, CancellationToken cancellationToken = default)
        {
            room.UpdatedAt = DateTime.UtcNow;
            _context.MatchRooms.Update(room);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task AddPlayerAsync(MatchRoomPlayer player, CancellationToken cancellationToken = default)
        {
            await _context.MatchRoomPlayers.AddAsync(player, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task UpdatePlayerAsync(MatchRoomPlayer player, CancellationToken cancellationToken = default)
        {
            _context.MatchRoomPlayers.Update(player);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<MatchRoomPlayer?> GetPlayerAsync(Guid roomId, Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.MatchRoomPlayers
                .FirstOrDefaultAsync(p => p.RoomId == roomId && p.UserId == userId, cancellationToken);
        }

        public async Task<(List<MatchRoom> Rooms, int TotalCount)> GetAllForAdminAsync(
            string? status, int page, int pageSize, CancellationToken cancellationToken = default)
        {
            var query = _context.MatchRooms
                .Include(r => r.Sport)
                .Include(r => r.MatchPost).ThenInclude(p => p!.Creator)
                .Include(r => r.MatchPost).ThenInclude(p => p!.Sport)
                .Include(r => r.Players).ThenInclude(p => p.User)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<MatchRoomStatus>(status, true, out var statusEnum))
                query = query.Where(r => r.Status == statusEnum);

            var totalCount = await query.CountAsync(cancellationToken);

            var rooms = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (rooms, totalCount);
        }
    }
}
