using MATCHOP.API.DTOs.PriceRules;

namespace MATCHOP.API.Services.Interfaces;

public interface IPriceRuleService
{
    Task<PriceRuleResponseDto> CreateAsync(CreatePriceRuleDto dto);

    Task<List<PriceRuleResponseDto>> GetOwnerCourtPriceRulesAsync(Guid courtId);

    Task<List<PriceRuleResponseDto>> GetPublicCourtPriceRulesAsync(Guid courtId);

    Task<PriceRuleResponseDto> UpdateAsync(Guid id, UpdatePriceRuleDto dto);

    Task<PriceRuleResponseDto> UpdateStatusAsync(Guid id, UpdatePriceRuleStatusDto dto);
}