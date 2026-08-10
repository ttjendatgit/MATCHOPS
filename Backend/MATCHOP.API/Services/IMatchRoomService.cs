using MATCHOP.API.DTOs.Matching;

namespace MATCHOP.API.Services
{
    public interface IMatchRoomService
    {
        Task<MatchRoomResponseDto> GetRoomByIdAsync(Guid roomId, Guid requestingUserId, CancellationToken cancellationToken = default);
        Task<List<MatchRoomResponseDto>> GetUserRoomsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task AcceptMatchAsync(Guid userId, Guid roomId, CancellationToken cancellationToken = default);
        Task RejectMatchAsync(Guid userId, Guid roomId, CancellationToken cancellationToken = default);
        Task<MatchRoomAdminListDto> GetAllRoomsAsync(string? status, int page, int pageSize, CancellationToken cancellationToken = default);
    }

    public class MatchRoomAdminListDto
    {
        public List<MatchRoomResponseDto> Rooms { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
