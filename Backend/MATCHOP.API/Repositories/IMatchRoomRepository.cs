using MATCHOP.API.Entities;

namespace MATCHOP.API.Repositories
{
    public interface IMatchRoomRepository
    {
        Task<MatchRoom?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<MatchRoom?> GetByMatchPostIdAsync(Guid matchPostId, CancellationToken cancellationToken = default);
        Task<List<MatchRoom>> GetUserRoomsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<(List<MatchRoom> Rooms, int TotalCount)> GetAllForAdminAsync(string? status, int page, int pageSize, CancellationToken cancellationToken = default);
        Task AddAsync(MatchRoom room, CancellationToken cancellationToken = default);
        Task UpdateAsync(MatchRoom room, CancellationToken cancellationToken = default);
        Task AddPlayerAsync(MatchRoomPlayer player, CancellationToken cancellationToken = default);
        Task UpdatePlayerAsync(MatchRoomPlayer player, CancellationToken cancellationToken = default);
        Task<MatchRoomPlayer?> GetPlayerAsync(Guid roomId, Guid userId, CancellationToken cancellationToken = default);
    }
}
