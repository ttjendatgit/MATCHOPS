using MATCHOP.API.Entities;
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

        public async Task<MatchRoom?> GetByIdAsync(Guid id)
        {
            return await _context.MatchRooms
                .Include(r => r.Sport)
                .Include(r => r.Players)
                    .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<List<MatchRoom>> GetUserRoomsAsync(Guid userId)
        {
            return await _context.MatchRooms
                .Include(r => r.Sport)
                .Include(r => r.Players)
                .Where(r => r.Players.Any(p => p.UserId == userId))
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(MatchRoom room)
        {
            await _context.MatchRooms.AddAsync(room);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(MatchRoom room)
        {
            room.UpdatedAt = DateTime.UtcNow;
            _context.MatchRooms.Update(room);
            await _context.SaveChangesAsync();
        }

        public async Task AddPlayerAsync(MatchRoomPlayer player)
        {
            await _context.MatchRoomPlayers.AddAsync(player);
            await _context.SaveChangesAsync();
        }

        public async Task UpdatePlayerAsync(MatchRoomPlayer player)
        {
            _context.MatchRoomPlayers.Update(player);
            await _context.SaveChangesAsync();
        }

        public async Task<MatchRoomPlayer?> GetPlayerAsync(Guid roomId, Guid userId)
        {
            return await _context.MatchRoomPlayers
                .FirstOrDefaultAsync(p => p.RoomId == roomId && p.UserId == userId);
        }
    }
}
