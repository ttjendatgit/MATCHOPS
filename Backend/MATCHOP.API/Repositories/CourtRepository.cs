using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories;

public class CourtRepository : ICourtRepository
{
    private readonly ApplicationDbContext _context;

    public CourtRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Court?> GetByIdAsync(Guid id)
    {
        return await _context.Courts
            .Include(x => x.Venue)
            .Include(x => x.Sport)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<Court?> GetPublicCourtByIdAsync(Guid id)
    {
        return await _context.Courts
            .AsNoTracking()
            .Include(x => x.Venue)
            .Include(x => x.Sport)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                x.Status == CourtStatus.ACTIVE &&
                x.Venue.Status == VenueStatus.ACTIVE &&
                x.Sport.Status == SportStatus.ACTIVE);
    }

    public async Task<List<Court>> GetPublicCourtsByVenueIdAsync(Guid venueId)
    {
        return await _context.Courts
            .AsNoTracking()
            .Include(x => x.Venue)
            .Include(x => x.Sport)
            .Include(x => x.Images)
            .Where(x =>
                x.VenueId == venueId &&
                x.Status == CourtStatus.ACTIVE &&
                x.Venue.Status == VenueStatus.ACTIVE &&
                x.Sport.Status == SportStatus.ACTIVE)
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    public async Task<List<Court>> GetOwnerCourtsAsync(Guid ownerId)
    {
        return await _context.Courts
            .AsNoTracking()
            .Include(x => x.Venue)
            .Include(x => x.Sport)
            .Include(x => x.Images)
            .Where(x => x.Venue.OwnerId == ownerId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<Court?> GetOwnerCourtByIdAsync(Guid courtId, Guid ownerId)
    {
        return await _context.Courts
            .Include(x => x.Venue)
            .Include(x => x.Sport)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x =>
                x.Id == courtId &&
                x.Venue.OwnerId == ownerId);
    }

    public async Task<bool> ExistsByNameInVenueAsync(Guid venueId, string name)
    {
        var normalizedName = name.Trim().ToLower();

        return await _context.Courts.AnyAsync(x =>
            x.VenueId == venueId &&
            x.Name.ToLower() == normalizedName);
    }

    public async Task<bool> ExistsByNameInVenueExceptAsync(
        Guid venueId,
        Guid courtId,
        string name)
    {
        var normalizedName = name.Trim().ToLower();

        return await _context.Courts.AnyAsync(x =>
            x.VenueId == venueId &&
            x.Id != courtId &&
            x.Name.ToLower() == normalizedName);
    }

    public async Task AddAsync(Court court)
    {
        await _context.Courts.AddAsync(court);
    }

    public void Update(Court court)
    {
        _context.Courts.Update(court);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}