using MATCHOP.API.Entities;

namespace MATCHOP.API.Repositories
{
    public interface IMatchRoomRepository
    {
        Task<MatchRoom?> GetByIdAsync(Guid id);
        Task<List<MatchRoom>> GetUserRoomsAsync(Guid userId);
        Task AddAsync(MatchRoom room);
        Task UpdateAsync(MatchRoom room);
        Task AddPlayerAsync(MatchRoomPlayer player);
        Task UpdatePlayerAsync(MatchRoomPlayer player);
        Task<MatchRoomPlayer?> GetPlayerAsync(Guid roomId, Guid userId);
    }
}
