using MATCHOP.API.DTOs.Matching;

namespace MATCHOP.API.Services
{
    public interface IMatchRoomService
    {
        Task<MatchRoomResponseDto> GetRoomByIdAsync(Guid roomId, Guid requestingUserId, CancellationToken cancellationToken = default);
        Task<List<MatchRoomResponseDto>> GetUserRoomsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task AcceptMatchAsync(Guid userId, Guid roomId, CancellationToken cancellationToken = default);
        Task RejectMatchAsync(Guid userId, Guid roomId, CancellationToken cancellationToken = default);
    }
}
