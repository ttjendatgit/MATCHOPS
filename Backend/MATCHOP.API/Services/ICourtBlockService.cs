using MATCHOP.API.DTOs.Courts;

namespace MATCHOP.API.Services.Interfaces;

public interface ICourtBlockService
{
    Task<CourtBlockResponseDto> CreateAsync(CreateCourtBlockDto dto);
    Task<List<CourtBlockResponseDto>> GetOwnerBlocksAsync(DateOnly? date, Guid? venueId, Guid? courtId);
    Task<CourtBlockResponseDto> CancelAsync(Guid id, CancelCourtBlockDto dto);
}
