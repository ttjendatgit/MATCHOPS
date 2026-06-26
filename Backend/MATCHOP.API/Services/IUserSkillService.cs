using MATCHOP.API.DTOs.Matching;

namespace MATCHOP.API.Services
{
    public interface IUserSkillService
    {
        Task<List<UserSkillResponseDto>> GetUserSkillsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<UserSkillResponseDto> UpdateUserSkillAsync(Guid userId, UpdateUserSkillDto dto, CancellationToken cancellationToken = default);
    }
}
