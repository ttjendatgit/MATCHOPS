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
        public async Task<IActionResult> GetSports()
        {
            var result = await _sportService.GetActiveSportsAsync();

            return Ok(ApiResponse<List<SportResponseDto>>.Ok(result));
        }

        [HttpGet("sports/{id:guid}")]
        public async Task<IActionResult> GetSportById(Guid id)
        {
            var result = await _sportService.GetActiveSportByIdAsync(id);

            return Ok(ApiResponse<SportResponseDto>.Ok(result));
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPost("admin/sports")]
        public async Task<IActionResult> CreateSport(CreateSportDto dto)
        {
            var result = await _sportService.CreateSportAsync(dto);

            return Ok(ApiResponse<SportResponseDto>.Ok(result, "Tạo môn thể thao thành công."));
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPatch("admin/sports/{id:guid}")]
        public async Task<IActionResult> UpdateSport(Guid id, UpdateSportDto dto)
        {
            var result = await _sportService.UpdateSportAsync(id, dto);

            return Ok(ApiResponse<SportResponseDto>.Ok(result, "Cập nhật môn thể thao thành công."));
        }

        [Authorize(Roles = "ADMIN")]
        [HttpDelete("admin/sports/{id:guid}")]
        public async Task<IActionResult> DeleteSport(Guid id)
        {
            await _sportService.DeleteSportAsync(id);

            return Ok(ApiResponse<object>.Ok("Xóa môn thể thao thành công."));
        }
    }
}