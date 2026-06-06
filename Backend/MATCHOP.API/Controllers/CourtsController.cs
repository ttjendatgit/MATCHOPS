using MATCHOP.API.DTOs.Courts;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api")]
public class CourtsController : ControllerBase
{
    private readonly ICourtService _courtService;
    private readonly ICourtAvailabilityService _availabilityService;


    public CourtsController(ICourtService courtService,
    ICourtAvailabilityService availabilityService)
        {
            _courtService = courtService;
        _availabilityService = availabilityService;
    }

    [HttpGet("venues/{venueId:guid}/courts")]
    public async Task<IActionResult> GetPublicCourtsByVenueId(Guid venueId)
    {
        var result = await _courtService.GetPublicCourtsByVenueIdAsync(venueId);

        return Ok(ApiResponse<List<CourtResponseDto>>.Ok(result));
    }

    [HttpGet("courts/{id:guid}")]
    public async Task<IActionResult> GetPublicCourtById(Guid id)
    {
        var result = await _courtService.GetPublicCourtByIdAsync(id);

        return Ok(ApiResponse<CourtResponseDto>.Ok(result));
    }

    [Authorize(Roles = "OWNER")]
    [HttpGet("owner/courts")]
    public async Task<IActionResult> GetMyCourts()
    {
        var result = await _courtService.GetMyCourtsAsync();

        return Ok(ApiResponse<List<CourtResponseDto>>.Ok(result));
    }

    [Authorize(Roles = "OWNER")]
    [HttpGet("owner/courts/{id:guid}")]
    public async Task<IActionResult> GetMyCourtById(Guid id)
    {
        var result = await _courtService.GetMyCourtByIdAsync(id);

        return Ok(ApiResponse<CourtResponseDto>.Ok(result));
    }

    [Authorize(Roles = "OWNER")]
    [HttpPost("owner/courts")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateMyCourt([FromForm] CreateCourtDto dto)
    {
        var result = await _courtService.CreateMyCourtAsync(dto);

        return Ok(ApiResponse<CourtResponseDto>.Ok(result, "Tạo sân thành công."));
    }

    [Authorize(Roles = "OWNER")]
    [HttpPatch("owner/courts/{id:guid}")]
    public async Task<IActionResult> UpdateMyCourt(Guid id, UpdateCourtDto dto)
    {
        var result = await _courtService.UpdateMyCourtAsync(id, dto);

        return Ok(ApiResponse<CourtResponseDto>.Ok(result, "Cập nhật sân thành công."));
    }

    [Authorize(Roles = "OWNER")]
    [HttpPatch("owner/courts/{id:guid}/status")]
    public async Task<IActionResult> UpdateMyCourtStatus(Guid id, UpdateCourtStatusDto dto)
    {
        var result = await _courtService.UpdateMyCourtStatusAsync(id, dto);

        return Ok(ApiResponse<CourtResponseDto>.Ok(result, "Cập nhật trạng thái sân thành công."));
    }

    /// <summary>GET /api/courts/{id}/availability?date=yyyy-MM-dd</summary>
    [HttpGet("courts/{id:guid}/availability")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailability(
        Guid id,
        [FromQuery] string date)
    {
        if (!DateOnly.TryParseExact(
                date, "yyyy-MM-dd",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None,
                out var parsedDate))
        {
            return BadRequest(ApiResponse<object>.Fail(
                "Định dạng ngày không hợp lệ. Vui lòng dùng yyyy-MM-dd."));
        }

        var result = await _availabilityService.GetAvailabilityAsync(id, parsedDate);
        return Ok(ApiResponse<CourtAvailabilityResponseDto>.Ok(result));
    }
}
