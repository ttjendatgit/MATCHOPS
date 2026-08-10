using MATCHOP.API.DTOs.Courts;

namespace MATCHOP.API.Services.Interfaces;

public interface ICourtBlockService
{
    Task<CourtBlockResponseDto> CreateAsync(CreateCourtBlockDto dto, CancellationToken cancellationToken = default);
    Task<List<CourtBlockResponseDto>> GetOwnerBlocksAsync(DateOnly? date, Guid? venueId, Guid? courtId, CancellationToken cancellationToken = default);
    Task<CourtBlockResponseDto> CancelAsync(Guid id, CancelCourtBlockDto dto, CancellationToken cancellationToken = default);
}
