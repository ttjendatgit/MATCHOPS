using MATCHOP.API.Entities;
using MATCHOP.API.DTOs.Matching;

namespace MATCHOP.API.Repositories
{
    public interface IMatchPostRepository
    {
        Task<MatchPost?> GetByIdAsync(Guid id);
        Task<List<MatchPost>> GetFilteredAsync(MatchPostFilterDto filter);
        Task<int> GetCountAsync(MatchPostFilterDto filter);
        Task AddAsync(MatchPost post);
        Task UpdateAsync(MatchPost post);
        Task DeleteAsync(MatchPost post);
    }
}
