using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Repositories
{
    public interface IMatchQueueRepository
    {
        Task<MatchQueue?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<MatchQueue?> GetByUserAndSportAsync(Guid userId, Guid sportId, CancellationToken cancellationToken = default);
        Task<List<MatchQueue>> FindMatchesAsync(MatchQueue item, CancellationToken cancellationToken = default);
        Task AddAsync(MatchQueue item, CancellationToken cancellationToken = default);
        Task RemoveAsync(MatchQueue item, CancellationToken cancellationToken = default);
    }
}
