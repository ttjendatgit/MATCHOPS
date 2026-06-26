using MATCHOP.API.Entities;
using MATCHOP.API.DTOs.Matching;

namespace MATCHOP.API.Repositories
{
    public interface IMatchPostRepository
    {
        Task<MatchPost?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<MatchPost>> GetFilteredAsync(MatchPostFilterDto filter, CancellationToken cancellationToken = default);
        Task<int> GetCountAsync(MatchPostFilterDto filter, CancellationToken cancellationToken = default);
        Task AddAsync(MatchPost post, CancellationToken cancellationToken = default);
        Task UpdateAsync(MatchPost post, CancellationToken cancellationToken = default);
        Task DeleteAsync(MatchPost post, CancellationToken cancellationToken = default);
    }
}
