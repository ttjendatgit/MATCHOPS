using MATCHOP.API.DTOs.Courts;

namespace MATCHOP.API.Services.Interfaces;

public interface ICourtService
{
    Task<List<CourtResponseDto>> GetPublicCourtsByVenueIdAsync(Guid venueId, CancellationToken cancellationToken = default);

    Task<CourtResponseDto> GetPublicCourtByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<List<CourtResponseDto>> GetMyCourtsAsync(CancellationToken cancellationToken = default);

    Task<CourtResponseDto> GetMyCourtByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<CourtResponseDto> CreateMyCourtAsync(CreateCourtDto dto, CancellationToken cancellationToken = default);

    Task<CourtResponseDto> UpdateMyCourtAsync(Guid id, UpdateCourtDto dto, CancellationToken cancellationToken = default);

    Task<CourtResponseDto> UpdateMyCourtStatusAsync(Guid id, UpdateCourtStatusDto dto, CancellationToken cancellationToken = default);

    // Admin methods
    Task<List<CourtResponseDto>> GetAllCourtsForAdminAsync(CancellationToken cancellationToken = default);
    Task<CourtResponseDto> GetCourtByIdForAdminAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CourtResponseDto> UpdateCourtStatusForAdminAsync(Guid id, UpdateCourtStatusDto dto, CancellationToken cancellationToken = default);
}