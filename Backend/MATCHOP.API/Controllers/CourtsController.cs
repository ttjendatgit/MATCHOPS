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
    public async Task<IActionResult> GetPublicCourtsByVenueId(Guid venueId, CancellationToken cancellationToken = default)
    {
        var result = await _courtService.GetPublicCourtsByVenueIdAsync(venueId, cancellationToken);

        return Ok(ApiResponse<List<CourtResponseDto>>.Ok(result));
    }

    [HttpGet("courts/{id:guid}")]
    public async Task<IActionResult> GetPublicCourtById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _courtService.GetPublicCourtByIdAsync(id, cancellationToken);

        return Ok(ApiResponse<CourtResponseDto>.Ok(result));
    }

    [Authorize(Roles = "OWNER")]
    [HttpGet("owner/courts")]
    public async Task<IActionResult> GetMyCourts(CancellationToken cancellationToken = default)
    {
        var result = await _courtService.GetMyCourtsAsync(cancellationToken);

        return Ok(ApiResponse<List<CourtResponseDto>>.Ok(result));
    }

    [Authorize(Roles = "OWNER")]
    [HttpGet("owner/courts/{id:guid}")]
    public async Task<IActionResult> GetMyCourtById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _courtService.GetMyCourtByIdAsync(id, cancellationToken);

        return Ok(ApiResponse<CourtResponseDto>.Ok(result));
    }

    [Authorize(Roles = "OWNER")]
    [HttpPost("owner/courts")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateMyCourt([FromForm] CreateCourtDto dto, CancellationToken cancellationToken = default)
    {
        var result = await _courtService.CreateMyCourtAsync(dto, cancellationToken);

        return Ok(ApiResponse<CourtResponseDto>.Ok(result, "Tạo sân thành công."));
    }

    [Authorize(Roles = "OWNER")]
    [HttpPatch("owner/courts/{id:guid}")]
    public async Task<IActionResult> UpdateMyCourt(Guid id, UpdateCourtDto dto, CancellationToken cancellationToken = default)
    {
        var result = await _courtService.UpdateMyCourtAsync(id, dto, cancellationToken);

        return Ok(ApiResponse<CourtResponseDto>.Ok(result, "Cập nhật sân thành công."));
    }

    [Authorize(Roles = "OWNER")]
    [HttpPatch("owner/courts/{id:guid}/status")]
    public async Task<IActionResult> UpdateMyCourtStatus(Guid id, UpdateCourtStatusDto dto, CancellationToken cancellationToken = default)
    {
        var result = await _courtService.UpdateMyCourtStatusAsync(id, dto, cancellationToken);

        return Ok(ApiResponse<CourtResponseDto>.Ok(result, "Cập nhật trạng thái sân thành công."));
    }

    /// <summary>GET /api/courts/{id}/availability?date=yyyy-MM-dd</summary>
    [HttpGet("courts/{id:guid}/availability")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailability(
        Guid id,
        [FromQuery] string date,
        CancellationToken cancellationToken = default)
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

        var result = await _availabilityService.GetAvailabilityAsync(id, parsedDate, cancellationToken);
        return Ok(ApiResponse<CourtAvailabilityResponseDto>.Ok(result));
    }

    // Admin endpoints
    [Authorize(Roles = "ADMIN")]
    [HttpGet("admin/courts")]
    public async Task<IActionResult> GetAllCourtsForAdmin(CancellationToken cancellationToken = default)
    {
        var result = await _courtService.GetAllCourtsForAdminAsync(cancellationToken);
        return Ok(ApiResponse<List<CourtResponseDto>>.Ok(result));
    }

    [Authorize(Roles = "ADMIN")]
    [HttpGet("admin/courts/{id:guid}")]
    public async Task<IActionResult> GetCourtByIdForAdmin(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _courtService.GetCourtByIdForAdminAsync(id, cancellationToken);
        return Ok(ApiResponse<CourtResponseDto>.Ok(result));
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPatch("admin/courts/{id:guid}/status")]
    public async Task<IActionResult> UpdateCourtStatusForAdmin(Guid id, UpdateCourtStatusDto dto, CancellationToken cancellationToken = default)
    {
        var result = await _courtService.UpdateCourtStatusForAdminAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<CourtResponseDto>.Ok(result, "Cập nhật trạng thái sân thành công."));
    }
}
