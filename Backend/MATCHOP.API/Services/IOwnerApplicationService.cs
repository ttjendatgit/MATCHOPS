using MATCHOP.API.DTOs.OwnerApplications;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Services;

public interface IOwnerApplicationService
{
    Task<OwnerApplicationMeResponseDto> ApplyAsync(Guid userId, OwnerApplyRequestDto dto);
    Task<OwnerApplicationMeResponseDto> GetMyApplicationAsync(Guid userId);
    Task<OwnerApplicationMeResponseDto> UpdateMyApplicationAsync(Guid userId, OwnerUpdateApplicationRequestDto dto);

    Task<AdminOwnerApplicationListResponseDto> GetApplicationsForAdminAsync(
        OwnerApplicationStatus? status,
        string? city,
        string? search,
        int page,
        int pageSize);

    Task<AdminOwnerApplicationDetailDto> GetApplicationForAdminAsync(Guid id);
    Task<AdminOwnerApplicationDetailDto> ApproveApplicationAsync(Guid id);
    Task<AdminOwnerApplicationDetailDto> RejectApplicationAsync(Guid id, RejectOwnerApplicationRequestDto dto);
}
