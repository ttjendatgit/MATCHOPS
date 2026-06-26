using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
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
            query = query.Where(v =>
                v.City.ToLower().Contains(city.ToLower()));

        if (!string.IsNullOrWhiteSpace(district))
            query = query.Where(v =>
                v.District.ToLower().Contains(district.ToLower()));

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