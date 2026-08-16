using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories;

public class VenueRepository : IVenueRepository
{
    private readonly ApplicationDbContext _db;

    public VenueRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    private IQueryable<Venue> BaseQuery() =>
        _db.Venues
           .Include(v => v.Owner)
           .AsQueryable();

    public async Task<List<Venue>> GetActiveVenuesAsync(
        string? city,
        string? district,
        Guid? sportId,
        string? keyword,
        CancellationToken cancellationToken = default)
    {
        var query = BaseQuery()
            .Where(v => v.Status == VenueStatus.ACTIVE);

        if (!string.IsNullOrWhiteSpace(city))
        {
            var cityFilter = city.Trim();
            query = query.Where(v =>
                EF.Functions.ILike(v.City, $"%{cityFilter}%") ||
                (EF.Functions.ILike(cityFilter, "%hcm%") && EF.Functions.ILike(v.City, "%hcm%")) ||
                (EF.Functions.ILike(cityFilter, "%ho chi minh%") && EF.Functions.ILike(v.City, "%ho chi minh%")) ||
                (EF.Functions.ILike(cityFilter, "%binh duong%") && EF.Functions.ILike(v.City, "%binh duong%")) ||
                (EF.Functions.ILike(cityFilter, "%bình dương%") && EF.Functions.ILike(v.City, "%dương%")));
        }

        if (!string.IsNullOrWhiteSpace(district))
        {
            var districtFilter = district.Trim();
            var districtCore = districtFilter
                .Replace("Quận ", "", StringComparison.OrdinalIgnoreCase)
                .Replace("Huyện ", "", StringComparison.OrdinalIgnoreCase)
                .Replace("Thành phố ", "", StringComparison.OrdinalIgnoreCase)
                .Trim();

            query = query.Where(v =>
                EF.Functions.ILike(v.District, $"%{districtFilter}%") ||
                EF.Functions.ILike(v.District, $"%{districtCore}%") ||
                EF.Functions.ILike(districtFilter, $"%{v.District}%"));
        }

        if (!string.IsNullOrWhiteSpace(keyword))
            query = query.Where(v =>
                v.Name.ToLower().Contains(keyword.ToLower()) ||
                v.Address.ToLower().Contains(keyword.ToLower()));

        if (sportId.HasValue)
            query = query.Where(v =>
                v.Courts.Any(c =>
                    c.SportId == sportId.Value &&
                    c.Status == CourtStatus.ACTIVE));

        return await query
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Venue?> GetActiveByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await BaseQuery()
            .FirstOrDefaultAsync(v =>
                v.Id == id && v.Status == VenueStatus.ACTIVE, cancellationToken);

    public async Task<Venue?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await BaseQuery()
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

    public async Task<List<Venue>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await BaseQuery()
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<List<Venue>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default) =>
        await BaseQuery()
            .Where(v => v.OwnerId == ownerId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<int> CountByOwnerIdAsync(Guid ownerId) =>
        await _db.Venues.CountAsync(v => v.OwnerId == ownerId);

    public async Task<Venue> CreateAsync(Venue venue, CancellationToken cancellationToken = default)
    {
        _db.Venues.Add(venue);
        await _db.SaveChangesAsync(cancellationToken);

        // Reload để có Owner navigation
        await _db.Entry(venue).Reference(v => v.Owner).LoadAsync(cancellationToken);
        return venue;
    }

    public async Task<Venue> UpdateAsync(Venue venue, CancellationToken cancellationToken = default)
    {
        venue.UpdatedAt = DateTime.UtcNow;
        _db.Venues.Update(venue);
        await _db.SaveChangesAsync(cancellationToken);
        return venue;
    }
}