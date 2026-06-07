using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Repositories
{
    public interface IUserSkillRepository
    {
        Task<UserSkill?> GetAsync(Guid userId, Guid sportId);
        Task<List<UserSkill>> GetByUserIdAsync(Guid userId);
        Task AddAsync(UserSkill skill);
        Task UpdateAsync(UserSkill skill);
    }
}
