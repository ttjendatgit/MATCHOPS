using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Entities;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services
{
    public class UserSkillService : IUserSkillService
    {
        private readonly IUserSkillRepository _userSkillRepository;
        private readonly ApplicationDbContext _context;

        public UserSkillService(IUserSkillRepository userSkillRepository, ApplicationDbContext context)
        {
            _userSkillRepository = userSkillRepository;
            _context = context;
        }

        public async Task<List<UserSkillResponseDto>> GetUserSkillsAsync(Guid userId)
        {
            var skills = await _userSkillRepository.GetByUserIdAsync(userId);
            return skills.Select(MapToResponse).ToList();
        }

        public async Task<UserSkillResponseDto> UpdateUserSkillAsync(Guid userId, UpdateUserSkillDto dto)
        {
            var sport = await _context.Sports.FindAsync(dto.SportId);
            if (sport == null)
            {
                throw new AppException(ErrorCodes.SportNotFound, "Môn thể thao không tồn tại.");
            }

            var skill = await _userSkillRepository.GetAsync(userId, dto.SportId);

            if (skill == null)
            {
                skill = new UserSkill
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    SportId = dto.SportId,
                    Level = dto.Level,
                    UpdatedAt = DateTime.UtcNow
                };
                await _userSkillRepository.AddAsync(skill);
            }
            else
            {
                skill.Level = dto.Level;
                await _userSkillRepository.UpdateAsync(skill);
            }

            // Need to reload to get Sport name
            skill = await _userSkillRepository.GetAsync(userId, dto.SportId);
            _context.Entry(skill!).Reference(s => s.Sport).Load();

            return MapToResponse(skill!);
        }

        private static UserSkillResponseDto MapToResponse(UserSkill skill)
        {
            return new UserSkillResponseDto
            {
                SportId = skill.SportId,
                SportName = skill.Sport?.Name ?? "Unknown",
                Level = skill.Level.ToString(),
                UpdatedAt = skill.UpdatedAt
            };
        }
    }
}
