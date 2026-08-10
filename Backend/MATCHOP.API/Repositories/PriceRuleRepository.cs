using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories;

public class PriceRuleRepository : IPriceRuleRepository
{
    private readonly ApplicationDbContext _context;

    public PriceRuleRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PriceRule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.PriceRules
            .Include(x => x.Court)
            .ThenInclude(x => x.Venue)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<PriceRule?> GetOwnerPriceRuleByIdAsync(Guid id, Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await _context.PriceRules
            .Include(x => x.Court)
            .ThenInclude(x => x.Venue)
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.Court.Venue.OwnerId == ownerId, cancellationToken);
    }

    public async Task<List<PriceRule>> GetOwnerCourtPriceRulesAsync(Guid courtId, Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await _context.PriceRules
            .AsNoTracking()
            .Include(x => x.Court)
            .ThenInclude(x => x.Venue)
            .Where(x =>
                x.CourtId == courtId &&
                x.Court.Venue.OwnerId == ownerId)
            .OrderBy(x => x.DayType)
            .ThenBy(x => x.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<PriceRule>> GetPublicCourtPriceRulesAsync(Guid courtId, CancellationToken cancellationToken = default)
    {
        return await _context.PriceRules
            .AsNoTracking()
            .Include(x => x.Court)
            .ThenInclude(x => x.Venue)
            .Where(x =>
                x.CourtId == courtId &&
                x.Status == PriceRuleStatus.ACTIVE &&
                x.Court.Status == CourtStatus.ACTIVE &&
                x.Court.Venue.Status == VenueStatus.ACTIVE)
            .OrderBy(x => x.DayType)
            .ThenBy(x => x.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasOverlapAsync(
        Guid courtId,
        DayType dayType,
        TimeOnly startTime,
        TimeOnly endTime,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        return await _context.PriceRules.AnyAsync(x =>
            x.CourtId == courtId &&
            x.Status == PriceRuleStatus.ACTIVE &&
            (!excludeId.HasValue || x.Id != excludeId.Value) &&

            // DayType overlap logic:
            // ALL đụng với mọi loại
            // WEEKDAY chỉ đụng WEEKDAY hoặc ALL
            // WEEKEND chỉ đụng WEEKEND hoặc ALL
            (
                x.DayType == dayType ||
                x.DayType == DayType.ALL ||
                dayType == DayType.ALL
            ) &&

            // Time overlap logic:
            // newStart < existingEnd && newEnd > existingStart
            startTime < x.EndTime &&
            endTime > x.StartTime, cancellationToken);
    }

    public async Task AddAsync(PriceRule priceRule, CancellationToken cancellationToken = default)
    {
        await _context.PriceRules.AddAsync(priceRule, cancellationToken);
    }

    public void Update(PriceRule priceRule)
    {
        _context.PriceRules.Update(priceRule);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}