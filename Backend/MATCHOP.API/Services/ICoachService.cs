using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Services;

public interface ICoachService
{
    Task<CoachProfileMeResponseDto> ApplyAsync(Guid userId, CoachApplyRequestDto dto);
    Task<CoachProfileMeResponseDto> GetMyProfileAsync(Guid userId);
    Task<CoachProfileMeResponseDto> UpdateMyProfileAsync(Guid userId, CoachUpdateMyProfileRequestDto dto);

    // Admin
    Task<AdminCoachProfileListResponseDto> GetCoachProfilesForAdminAsync(
        CoachProfileStatus? status,
        string? city,
        string? district,
        Guid? sportId,
        string? search,
        int page,
        int pageSize);

    Task<AdminCoachProfileDetailDto> GetCoachProfileForAdminAsync(Guid id);
    Task<AdminCoachProfileDetailDto> ApproveCoachProfileAsync(Guid id);
    Task<AdminCoachProfileDetailDto> RejectCoachProfileAsync(Guid id, RejectCoachProfileRequestDto dto);
    Task<AdminCoachProfileDetailDto> SuspendCoachProfileAsync(Guid id, SuspendCoachProfileRequestDto dto);
    Task<AdminCoachProfileDetailDto> ReactivateCoachProfileAsync(Guid id);

    // Public
    Task<PublicCoachListResponseDto> GetPublicCoachProfilesAsync(
        string? city,
        string? district,
        Guid? sportId,
        string? search,
        decimal? minHourlyRate,
        decimal? maxHourlyRate,
        int page,
        int pageSize);

    Task<PublicCoachDetailDto> GetPublicCoachProfileByIdAsync(Guid id);
}
