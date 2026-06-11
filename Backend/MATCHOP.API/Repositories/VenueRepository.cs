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
        string? keyword)
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
            .ToListAsync();
    }

    public async Task<Venue?> GetActiveByIdAsync(Guid id) =>
        await BaseQuery()
            .FirstOrDefaultAsync(v =>
                v.Id == id && v.Status == VenueStatus.ACTIVE);

    public async Task<Venue?> GetByIdAsync(Guid id) =>
        await BaseQuery()
            .FirstOrDefaultAsync(v => v.Id == id);

    public async Task<List<Venue>> GetAllAsync() =>
        await BaseQuery()
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync();

    public async Task<List<Venue>> GetByOwnerIdAsync(Guid ownerId) =>
        await BaseQuery()
            .Where(v => v.OwnerId == ownerId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync();

    public async Task<Venue> CreateAsync(Venue venue)
    {
        _db.Venues.Add(venue);
        await _db.SaveChangesAsync();

        // Reload để có Owner navigation
        await _db.Entry(venue).Reference(v => v.Owner).LoadAsync();
        return venue;
    }

    public async Task<Venue> UpdateAsync(Venue venue)
    {
        venue.UpdatedAt = DateTime.UtcNow;
        _db.Venues.Update(venue);
        await _db.SaveChangesAsync();
        return venue;
    }
}