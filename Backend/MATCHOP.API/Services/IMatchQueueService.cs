using MATCHOP.API.DTOs.Matching;

namespace MATCHOP.API.Services
{
    public interface IMatchQueueService
    {
        Task JoinQueueAsync(Guid userId, JoinQueueDto dto);
        Task LeaveQueueAsync(Guid userId, Guid sportId);
        Task<MatchQueueResponseDto?> GetUserQueueStatusAsync(Guid userId, Guid sportId);
    }
}
