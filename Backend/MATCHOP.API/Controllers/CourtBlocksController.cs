using MATCHOP.API.DTOs.Courts;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/owner/court-blocks")]
[Authorize(Roles = "OWNER")]
public class CourtBlocksController : ControllerBase
{
    private readonly ICourtBlockService _courtBlockService;

    public CourtBlocksController(ICourtBlockService courtBlockService)
    {
        _courtBlockService = courtBlockService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateCourtBlockDto dto, CancellationToken cancellationToken = default)
    {
        var result = await _courtBlockService.CreateAsync(dto, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<CourtBlockResponseDto>.Ok(result, "Khóa sân thành công."));
    }

    [HttpGet]
    public async Task<IActionResult> GetOwnerBlocks(
        [FromQuery] DateOnly? date,
        [FromQuery] Guid? venueId,
        [FromQuery] Guid? courtId,
        CancellationToken cancellationToken = default)
    {
        var result = await _courtBlockService.GetOwnerBlocksAsync(date, venueId, courtId, cancellationToken);
        return Ok(ApiResponse<List<CourtBlockResponseDto>>.Ok(result));
    }

    [HttpPatch("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancelCourtBlockDto dto, CancellationToken cancellationToken = default)
    {
        var result = await _courtBlockService.CancelAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<CourtBlockResponseDto>.Ok(result, "Hủy khóa sân thành công."));
    }
}
