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

        public async Task<UserSkill?> GetAsync(Guid userId, Guid sportId, CancellationToken cancellationToken = default)
        {
            return await _context.UserSkills
                .FirstOrDefaultAsync(s => s.UserId == userId && s.SportId == sportId, cancellationToken);
        }

        public async Task<List<UserSkill>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.UserSkills
                .Include(s => s.Sport)
                .Where(s => s.UserId == userId)
                .ToListAsync(cancellationToken);
        }

        public async Task AddAsync(UserSkill skill, CancellationToken cancellationToken = default)
        {
            await _context.UserSkills.AddAsync(skill, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task UpdateAsync(UserSkill skill, CancellationToken cancellationToken = default)
        {
            skill.UpdatedAt = DateTime.UtcNow;
            _context.UserSkills.Update(skill);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
