using MATCHOP.API.DTOs.Coaches;

namespace MATCHOP.API.Services;

public interface ICoachService
{
    Task<CoachProfileMeResponseDto> ApplyAsync(Guid userId, CoachApplyRequestDto dto);
    Task<CoachProfileMeResponseDto> GetMyProfileAsync(Guid userId);
    Task<CoachProfileMeResponseDto> UpdateMyProfileAsync(Guid userId, CoachUpdateMyProfileRequestDto dto);
}
