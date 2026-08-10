using MATCHOP.API.DTOs.Sports;

namespace MATCHOP.API.Services
{
    public interface ISportService
    {
        Task<List<SportResponseDto>> GetActiveSportsAsync(CancellationToken cancellationToken = default);
        Task<List<SportResponseDto>> GetAllSportsAsync(CancellationToken cancellationToken = default);
        Task<SportResponseDto> GetActiveSportByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<SportResponseDto> CreateSportAsync(CreateSportDto dto, CancellationToken cancellationToken = default);
        Task<SportResponseDto> UpdateSportAsync(Guid id, UpdateSportDto dto, CancellationToken cancellationToken = default);
        Task DeleteSportAsync(Guid id, CancellationToken cancellationToken = default);
    }
}