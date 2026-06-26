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

    public async Task<Court?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Courts
            .Include(x => x.Venue)
            .Include(x => x.Sport)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<Court?> GetPublicCourtByIdAsync(Guid id, CancellationToken cancellationToken = default)
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
                x.Sport.Status == SportStatus.ACTIVE, cancellationToken);
    }

    public async Task<List<Court>> GetPublicCourtsByVenueIdAsync(Guid venueId, CancellationToken cancellationToken = default)
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
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Court>> GetOwnerCourtsAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await _context.Courts
            .AsNoTracking()
            .Include(x => x.Venue)
            .Include(x => x.Sport)
            .Include(x => x.Images)
            .Where(x => x.Venue.OwnerId == ownerId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Court?> GetOwnerCourtByIdAsync(Guid courtId, Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await _context.Courts
            .Include(x => x.Venue)
            .Include(x => x.Sport)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x =>
                x.Id == courtId &&
                x.Venue.OwnerId == ownerId, cancellationToken);
    }

    public async Task<bool> ExistsByNameInVenueAsync(Guid venueId, string name, CancellationToken cancellationToken = default)
    {
        var normalizedName = name.Trim().ToLower();

        return await _context.Courts.AnyAsync(x =>
            x.VenueId == venueId &&
            x.Name.ToLower() == normalizedName, cancellationToken);
    }

    public async Task<bool> ExistsByNameInVenueExceptAsync(
        Guid venueId,
        Guid courtId,
        string name,
        CancellationToken cancellationToken = default)
    {
        var normalizedName = name.Trim().ToLower();

        return await _context.Courts.AnyAsync(x =>
            x.VenueId == venueId &&
            x.Id != courtId &&
            x.Name.ToLower() == normalizedName, cancellationToken);
    }

    public async Task AddAsync(Court court, CancellationToken cancellationToken = default)
    {
        await _context.Courts.AddAsync(court, cancellationToken);
    }

    public void Update(Court court)
    {
        _context.Courts.Update(court);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<Court>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Courts
            .AsNoTracking()
            .Include(x => x.Venue)
            .Include(x => x.Sport)
            .Include(x => x.Images)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}