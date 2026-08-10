using MATCHOP.API.DTOs.Courts;

namespace MATCHOP.API.Services.Interfaces;

public interface ICourtAvailabilityService
{
    Task<CourtAvailabilityResponseDto> GetAvailabilityAsync(Guid courtId, DateOnly date, CancellationToken cancellationToken = default);
}