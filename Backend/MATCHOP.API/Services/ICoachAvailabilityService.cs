using MATCHOP.API.DTOs.Coaches;

namespace MATCHOP.API.Services;

public interface ICoachAvailabilityService
{
    Task<List<CoachAvailabilitySlotResponseDto>> GetMyAvailabilityAsync(Guid userId);
    Task<List<CoachAvailabilitySlotResponseDto>> ReplaceMyAvailabilityAsync(Guid userId, UpdateCoachAvailabilityRequestDto dto);

    /// <summary>Public, read-only. Only returns enabled slots for ACTIVE coach profiles.</summary>
    Task<List<CoachAvailabilitySlotResponseDto>> GetPublicAvailabilityAsync(Guid coachProfileId);
}
