using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Repositories
{
    public interface IMatchQueueRepository
    {
        Task<MatchQueue?> GetByIdAsync(Guid id);
        Task<MatchQueue?> GetByUserAndSportAsync(Guid userId, Guid sportId);
        Task<List<MatchQueue>> FindMatchesAsync(MatchQueue item);
        Task AddAsync(MatchQueue item);
        Task RemoveAsync(MatchQueue item);
    }
}
