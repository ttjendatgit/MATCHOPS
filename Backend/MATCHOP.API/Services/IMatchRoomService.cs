using MATCHOP.API.DTOs.Matching;

namespace MATCHOP.API.Services
{
    public interface IMatchRoomService
    {
        Task<MatchRoomResponseDto> GetRoomByIdAsync(Guid roomId);
        Task<List<MatchRoomResponseDto>> GetUserRoomsAsync(Guid userId);
        Task AcceptMatchAsync(Guid userId, Guid roomId);
        Task RejectMatchAsync(Guid userId, Guid roomId);
    }
}
