using MATCHOP.API.DTOs.PriceRules;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api")]
public class PriceRulesController : ControllerBase
{
    private readonly IPriceRuleService _priceRuleService;

    public PriceRulesController(IPriceRuleService priceRuleService)
    {
        _priceRuleService = priceRuleService;
    }

    [Authorize(Roles = "OWNER")]
    [HttpPost("owner/price-rules")]
    public async Task<IActionResult> Create(CreatePriceRuleDto dto)
    {
        var result = await _priceRuleService.CreateAsync(dto);

        return Ok(ApiResponse<PriceRuleResponseDto>.Ok(result, "Tạo bảng giá thành công."));
    }

    [Authorize(Roles = "OWNER")]
    [HttpGet("owner/courts/{courtId:guid}/price-rules")]
    public async Task<IActionResult> GetOwnerCourtPriceRules(Guid courtId)
    {
        var result = await _priceRuleService.GetOwnerCourtPriceRulesAsync(courtId);

        return Ok(ApiResponse<List<PriceRuleResponseDto>>.Ok(result));
    }

    [HttpGet("courts/{courtId:guid}/price-rules")]
    public async Task<IActionResult> GetPublicCourtPriceRules(Guid courtId)
    {
        var result = await _priceRuleService.GetPublicCourtPriceRulesAsync(courtId);

        return Ok(ApiResponse<List<PriceRuleResponseDto>>.Ok(result));
    }

    [Authorize(Roles = "OWNER")]
    [HttpPatch("owner/price-rules/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdatePriceRuleDto dto)
    {
        var result = await _priceRuleService.UpdateAsync(id, dto);

        return Ok(ApiResponse<PriceRuleResponseDto>.Ok(result, "Cập nhật bảng giá thành công."));
    }

    [Authorize(Roles = "OWNER")]
    [HttpPatch("owner/price-rules/{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdatePriceRuleStatusDto dto)
    {
        var result = await _priceRuleService.UpdateStatusAsync(id, dto);

        return Ok(ApiResponse<PriceRuleResponseDto>.Ok(result, "Cập nhật trạng thái bảng giá thành công."));
    }
}