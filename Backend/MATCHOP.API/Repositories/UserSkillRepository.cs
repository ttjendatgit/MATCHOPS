using MATCHOP.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories
{
    public class UserSkillRepository : IUserSkillRepository
    {
        private readonly ApplicationDbContext _context;

        public UserSkillRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UserSkill?> GetAsync(Guid userId, Guid sportId)
        {
            return await _context.UserSkills
                .FirstOrDefaultAsync(s => s.UserId == userId && s.SportId == sportId);
        }

        public async Task<List<UserSkill>> GetByUserIdAsync(Guid userId)
        {
            return await _context.UserSkills
                .Include(s => s.Sport)
                .Where(s => s.UserId == userId)
                .ToListAsync();
        }

        public async Task AddAsync(UserSkill skill)
        {
            await _context.UserSkills.AddAsync(skill);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(UserSkill skill)
        {
            skill.UpdatedAt = DateTime.UtcNow;
            _context.UserSkills.Update(skill);
            await _context.SaveChangesAsync();
        }
    }
}
