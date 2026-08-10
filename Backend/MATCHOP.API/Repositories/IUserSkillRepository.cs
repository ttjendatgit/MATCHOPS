using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Repositories
{
    public interface IUserSkillRepository
    {
        Task<UserSkill?> GetAsync(Guid userId, Guid sportId, CancellationToken cancellationToken = default);
        Task<List<UserSkill>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
        Task AddAsync(UserSkill skill, CancellationToken cancellationToken = default);
        Task UpdateAsync(UserSkill skill, CancellationToken cancellationToken = default);
    }
}
