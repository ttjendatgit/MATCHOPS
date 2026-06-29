using MATCHOP.API.DTOs.Venues;

namespace MATCHOP.API.Services;

public interface IVenueService
{
    // Public
    Task<List<VenueResponseDto>> GetActiveVenuesAsync(
        string? city,
        string? district,
        Guid? sportId,
        string? keyword,
        CancellationToken cancellationToken = default);

    Task<VenueResponseDto> GetActiveVenueByIdAsync(Guid id, CancellationToken cancellationToken = default);

    // Owner
    Task<VenueResponseDto> CreateVenueAsync(CreateVenueDto dto, CancellationToken cancellationToken = default);
    Task<List<VenueResponseDto>> GetOwnerVenuesAsync(CancellationToken cancellationToken = default);
    Task<VenueResponseDto> GetOwnerVenueByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<VenueResponseDto> UpdateVenueAsync(Guid id, UpdateVenueDto dto, CancellationToken cancellationToken = default);

    // Admin
    Task<List<VenueResponseDto>> GetAllVenuesForAdminAsync(CancellationToken cancellationToken = default);
    Task<VenueResponseDto> ApproveVenueAsync(Guid id, CancellationToken cancellationToken = default);
    Task<VenueResponseDto> RejectVenueAsync(Guid id, CancellationToken cancellationToken = default);
    Task<VenueResponseDto> SuspendVenueAsync(Guid id, CancellationToken cancellationToken = default);
    Task<VenueResponseDto> ActivateVenueAsync(Guid id, CancellationToken cancellationToken = default);
}