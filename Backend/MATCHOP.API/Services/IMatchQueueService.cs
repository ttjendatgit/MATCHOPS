using MATCHOP.API.DTOs.Matching;

namespace MATCHOP.API.Services
{
    public interface IMatchQueueService
    {
        Task JoinQueueAsync(Guid userId, JoinQueueDto dto, CancellationToken cancellationToken = default);
        Task LeaveQueueAsync(Guid userId, Guid sportId, CancellationToken cancellationToken = default);
        Task<MatchQueueResponseDto?> GetUserQueueStatusAsync(Guid userId, Guid sportId, CancellationToken cancellationToken = default);
    }
}
