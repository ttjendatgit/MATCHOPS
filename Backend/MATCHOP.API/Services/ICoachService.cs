using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Services;

public interface ICoachService
{
    Task<CoachProfileMeResponseDto> ApplyAsync(Guid userId, CoachApplyRequestDto dto);
    Task<CoachProfileMeResponseDto> GetMyProfileAsync(Guid userId);
    Task<CoachProfileMeResponseDto> UpdateMyProfileAsync(Guid userId, CoachUpdateMyProfileRequestDto dto);

    // Own-profile proofs
    Task<List<CoachProofResponseDto>> UploadMyCoachProofsAsync(Guid userId, List<IFormFile> files, CoachProofType proofType);
    Task<List<CoachProofResponseDto>> GetMyCoachProofsAsync(Guid userId);
    Task DeleteMyCoachProofAsync(Guid userId, Guid proofId);

    // Own-profile verification documents
    Task<List<CoachVerificationDocumentResponseDto>> UploadMyVerificationDocumentsAsync(
        Guid userId,
        List<IFormFile> files,
        CoachVerificationDocumentType documentType);
    Task<List<CoachVerificationDocumentResponseDto>> GetMyVerificationDocumentsAsync(Guid userId);
    Task DeleteMyVerificationDocumentAsync(Guid userId, Guid documentId);

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
