using MATCHOP.API.DTOs.Courts;

namespace MATCHOP.API.Services.Interfaces;

public interface ICourtService
{
    Task<List<CourtResponseDto>> GetPublicCourtsByVenueIdAsync(Guid venueId);

    Task<CourtResponseDto> GetPublicCourtByIdAsync(Guid id);

    Task<List<CourtResponseDto>> GetMyCourtsAsync();

    Task<CourtResponseDto> GetMyCourtByIdAsync(Guid id);

    Task<CourtResponseDto> CreateMyCourtAsync(CreateCourtDto dto);

    Task<CourtResponseDto> UpdateMyCourtAsync(Guid id, UpdateCourtDto dto);

    Task<CourtResponseDto> UpdateMyCourtStatusAsync(Guid id, UpdateCourtStatusDto dto);
}