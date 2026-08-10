using MATCHOP.API.DTOs.PriceRules;

namespace MATCHOP.API.Services.Interfaces;

public interface IPriceRuleService
{
    Task<PriceRuleResponseDto> CreateAsync(CreatePriceRuleDto dto, CancellationToken cancellationToken = default);

    Task<List<PriceRuleResponseDto>> GetOwnerCourtPriceRulesAsync(Guid courtId, CancellationToken cancellationToken = default);

    Task<List<PriceRuleResponseDto>> GetPublicCourtPriceRulesAsync(Guid courtId, CancellationToken cancellationToken = default);

    Task<PriceRuleResponseDto> UpdateAsync(Guid id, UpdatePriceRuleDto dto, CancellationToken cancellationToken = default);

    Task<PriceRuleResponseDto> UpdateStatusAsync(Guid id, UpdatePriceRuleStatusDto dto, CancellationToken cancellationToken = default);
}