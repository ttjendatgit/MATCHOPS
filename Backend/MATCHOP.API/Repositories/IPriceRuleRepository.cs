using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Repositories.Interfaces;

public interface IPriceRuleRepository
{
    Task<PriceRule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<PriceRule?> GetOwnerPriceRuleByIdAsync(Guid id, Guid ownerId, CancellationToken cancellationToken = default);

    Task<List<PriceRule>> GetOwnerCourtPriceRulesAsync(Guid courtId, Guid ownerId, CancellationToken cancellationToken = default);

    Task<List<PriceRule>> GetPublicCourtPriceRulesAsync(Guid courtId, CancellationToken cancellationToken = default);

    Task<bool> HasOverlapAsync(
        Guid courtId,
        DayType dayType,
        TimeOnly startTime,
        TimeOnly endTime,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(PriceRule priceRule, CancellationToken cancellationToken = default);

    void Update(PriceRule priceRule);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}