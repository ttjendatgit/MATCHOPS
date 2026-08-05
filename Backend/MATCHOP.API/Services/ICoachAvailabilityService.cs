using MATCHOP.API.DTOs.Coaches;

namespace MATCHOP.API.Services;

public interface ICoachAvailabilityService
{
    Task<List<CoachAvailabilitySlotResponseDto>> GetMyAvailabilityAsync(Guid userId);
    Task<List<CoachAvailabilitySlotResponseDto>> ReplaceMyAvailabilityAsync(Guid userId, UpdateCoachAvailabilityRequestDto dto);
}
