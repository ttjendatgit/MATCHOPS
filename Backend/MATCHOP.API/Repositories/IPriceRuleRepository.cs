using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Repositories.Interfaces;

public interface IPriceRuleRepository
{
    Task<PriceRule?> GetByIdAsync(Guid id);

    Task<PriceRule?> GetOwnerPriceRuleByIdAsync(Guid id, Guid ownerId);

    Task<List<PriceRule>> GetOwnerCourtPriceRulesAsync(Guid courtId, Guid ownerId);

    Task<List<PriceRule>> GetPublicCourtPriceRulesAsync(Guid courtId);

    Task<bool> HasOverlapAsync(
        Guid courtId,
        DayType dayType,
        TimeOnly startTime,
        TimeOnly endTime,
        Guid? excludeId = null);

    Task AddAsync(PriceRule priceRule);

    void Update(PriceRule priceRule);

    Task SaveChangesAsync();
}