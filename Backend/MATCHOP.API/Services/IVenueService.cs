using MATCHOP.API.DTOs.Venues;

namespace MATCHOP.API.Services;

public interface IVenueService
{
    // Public
    Task<List<VenueResponseDto>> GetActiveVenuesAsync(
        string? city,
        string? district,
        Guid? sportId,
        string? keyword);

    Task<VenueResponseDto> GetActiveVenueByIdAsync(Guid id);

    // Owner
    Task<VenueResponseDto> CreateVenueAsync(CreateVenueDto dto);
    Task<List<VenueResponseDto>> GetOwnerVenuesAsync();
    Task<VenueResponseDto> GetOwnerVenueByIdAsync(Guid id);
    Task<VenueResponseDto> UpdateVenueAsync(Guid id, UpdateVenueDto dto);

    // Admin
    Task<List<VenueResponseDto>> GetAllVenuesForAdminAsync();
    Task<VenueResponseDto> ApproveVenueAsync(Guid id);
    Task<VenueResponseDto> RejectVenueAsync(Guid id);
    Task<VenueResponseDto> SuspendVenueAsync(Guid id);
}