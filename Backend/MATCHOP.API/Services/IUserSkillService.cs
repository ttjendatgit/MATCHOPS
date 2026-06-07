using MATCHOP.API.DTOs.Matching;

namespace MATCHOP.API.Services
{
    public interface IUserSkillService
    {
        Task<List<UserSkillResponseDto>> GetUserSkillsAsync(Guid userId);
        Task<UserSkillResponseDto> UpdateUserSkillAsync(Guid userId, UpdateUserSkillDto dto);
    }
}
