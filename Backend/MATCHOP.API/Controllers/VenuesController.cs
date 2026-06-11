using MATCHOP.API.DTOs.Venues;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
public class VenuesController : ControllerBase
{
    private readonly IVenueService _venueService;

    public VenuesController(IVenueService venueService)
    {
        _venueService = venueService;
    }

    // ── Public ────────────────────────────────────────────────────────────────

    [HttpGet("api/venues")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveVenues(
        [FromQuery] string? city,
        [FromQuery] string? district,
        [FromQuery] Guid? sportId,
        [FromQuery] string? keyword)
    {
        var result = await _venueService.GetActiveVenuesAsync(city, district, sportId, keyword);
        return Ok(ApiResponse<List<VenueResponseDto>>.Ok(result));
    }

    [HttpGet("api/venues/{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveVenueById(Guid id)
    {
        var result = await _venueService.GetActiveVenueByIdAsync(id);
        return Ok(ApiResponse<VenueResponseDto>.Ok(result));
    }

    // ── Owner ─────────────────────────────────────────────────────────────────

    [HttpPost("api/owner/venues")]
    [Authorize(Roles = "OWNER")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateVenue([FromForm] CreateVenueDto dto)
    {
        var result = await _venueService.CreateVenueAsync(dto);
        return StatusCode(201, ApiResponse<VenueResponseDto>.Ok(
            result, "Tạo venue thành công. Chờ admin duyệt."));
    }

    [HttpGet("api/owner/venues")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> GetMyVenues()
    {
        var result = await _venueService.GetOwnerVenuesAsync();
        return Ok(ApiResponse<List<VenueResponseDto>>.Ok(result));
    }

    [HttpGet("api/owner/venues/{id:guid}")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> GetMyVenueById(Guid id)
    {
        var result = await _venueService.GetOwnerVenueByIdAsync(id);
        return Ok(ApiResponse<VenueResponseDto>.Ok(result));
    }

    [HttpPatch("api/owner/venues/{id:guid}")]
    [Authorize(Roles = "OWNER")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateVenue(Guid id, [FromForm] UpdateVenueDto dto)
    {
        var result = await _venueService.UpdateVenueAsync(id, dto);
        return Ok(ApiResponse<VenueResponseDto>.Ok(result, "Cập nhật venue thành công."));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    [HttpGet("api/admin/venues")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAllVenues()
    {
        var result = await _venueService.GetAllVenuesForAdminAsync();
        return Ok(ApiResponse<List<VenueResponseDto>>.Ok(result));
    }

    [HttpPatch("api/admin/venues/{id:guid}/approve")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> ApproveVenue(Guid id)
    {
        var result = await _venueService.ApproveVenueAsync(id);
        return Ok(ApiResponse<VenueResponseDto>.Ok(result, "Venue đã được duyệt."));
    }

    [HttpPatch("api/admin/venues/{id:guid}/reject")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> RejectVenue(Guid id)
    {
        var result = await _venueService.RejectVenueAsync(id);
        return Ok(ApiResponse<VenueResponseDto>.Ok(result, "Venue đã bị từ chối."));
    }

    [HttpPatch("api/admin/venues/{id:guid}/suspend")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> SuspendVenue(Guid id)
    {
        var result = await _venueService.SuspendVenueAsync(id);
        return Ok(ApiResponse<VenueResponseDto>.Ok(result, "Venue đã bị tạm khóa."));
    }
}