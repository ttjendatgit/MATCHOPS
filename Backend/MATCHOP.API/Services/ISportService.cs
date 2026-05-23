using MATCHOP.API.DTOs.Sports;

namespace MATCHOP.API.Services
{
    public interface ISportService
    {
        Task<List<SportResponseDto>> GetActiveSportsAsync();

        Task<SportResponseDto> GetActiveSportByIdAsync(Guid id);

        Task<SportResponseDto> CreateSportAsync(CreateSportDto dto);

        Task<SportResponseDto> UpdateSportAsync(Guid id, UpdateSportDto dto);

        Task DeleteSportAsync(Guid id);
    }
}