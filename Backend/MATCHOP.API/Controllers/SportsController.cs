using MATCHOP.API.DTOs.Sports;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers
{
    [ApiController]
    [Route("api")]
    public class SportsController : ControllerBase
    {
        private readonly ISportService _sportService;

        public SportsController(ISportService sportService)
        {
            _sportService = sportService;
        }

        [HttpGet("sports")]
        public async Task<IActionResult> GetSports(CancellationToken cancellationToken = default)
        {
            var result = await _sportService.GetActiveSportsAsync(cancellationToken);

            return Ok(ApiResponse<List<SportResponseDto>>.Ok(result));
        }

        [HttpGet("sports/{id:guid}")]
        public async Task<IActionResult> GetSportById(Guid id, CancellationToken cancellationToken = default)
        {
            var result = await _sportService.GetActiveSportByIdAsync(id, cancellationToken);

            return Ok(ApiResponse<SportResponseDto>.Ok(result));
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPost("admin/sports")]
        public async Task<IActionResult> CreateSport(CreateSportDto dto, CancellationToken cancellationToken = default)
        {
            var result = await _sportService.CreateSportAsync(dto, cancellationToken);

            return Ok(ApiResponse<SportResponseDto>.Ok(result, "Tạo môn thể thao thành công."));
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPatch("admin/sports/{id:guid}")]
        public async Task<IActionResult> UpdateSport(Guid id, UpdateSportDto dto, CancellationToken cancellationToken = default)
        {
            var result = await _sportService.UpdateSportAsync(id, dto, cancellationToken);

            return Ok(ApiResponse<SportResponseDto>.Ok(result, "Cập nhật môn thể thao thành công."));
        }

        [Authorize(Roles = "ADMIN")]
        [HttpDelete("admin/sports/{id:guid}")]
        public async Task<IActionResult> DeleteSport(Guid id, CancellationToken cancellationToken = default)
        {
            await _sportService.DeleteSportAsync(id, cancellationToken);

            return Ok(ApiResponse<object>.Ok("Xóa môn thể thao thành công."));
        }

        /// <summary>GET /api/admin/sports — Admin get all sports (including inactive)</summary>
        [Authorize(Roles = "ADMIN")]
        [HttpGet("admin/sports")]
        public async Task<IActionResult> GetAllSports(CancellationToken cancellationToken = default)
        {
            var result = await _sportService.GetAllSportsAsync(cancellationToken);
            return Ok(ApiResponse<List<SportResponseDto>>.Ok(result));
        }
    }
}