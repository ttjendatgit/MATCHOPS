using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly ApplicationDbContext _context;

    public BookingRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    private IQueryable<Booking> BaseQuery() =>
        _context.Bookings
            .Include(b => b.Court)
                .ThenInclude(c => c.Venue)
            .Include(b => b.Court)
                .ThenInclude(c => c.Sport)
            .Include(b => b.Payments.OrderByDescending(p => p.CreatedAt))
            .Include(b => b.BookingSlots.OrderBy(s => s.SlotStartTime));

    public async Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await BaseQuery()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<Booking?> GetByIdAndUserIdAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        return await BaseQuery()
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId, cancellationToken);
    }

    public async Task<List<Booking>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await BaseQuery()
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Booking?> GetByIdAndOwnerIdAsync(Guid id, Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await BaseQuery()
            .FirstOrDefaultAsync(b =>
                b.Id == id &&
                b.Court.Venue.OwnerId == ownerId, cancellationToken);
    }

    public async Task<List<Booking>> GetByOwnerIdAsync(
        Guid ownerId,
        DateOnly? date,
        Guid? venueId,
        Guid? courtId,
        CancellationToken cancellationToken = default)
    {
        var query = BaseQuery()
            .Where(b => b.Court.Venue.OwnerId == ownerId);

        if (date.HasValue)
            query = query.Where(b => b.BookingDate == date.Value);

        if (venueId.HasValue)
            query = query.Where(b => b.VenueId == venueId.Value);

        if (courtId.HasValue)
            query = query.Where(b => b.CourtId == courtId.Value);

        return await query
            .OrderByDescending(b => b.BookingDate)
            .ThenBy(b => b.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Booking>> GetPendingExpiredByUserIdAsync(Guid userId, DateTime utcNow, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .Include(b => b.BookingSlots)
            .Where(b =>
                b.UserId == userId &&
                b.Status == BookingStatus.PENDING_PAYMENT &&
                b.ExpireAt != null &&
                b.ExpireAt <= utcNow)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Booking>> GetPendingExpiredByOwnerIdAsync(Guid ownerId, DateTime utcNow, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .Include(b => b.BookingSlots)
            .Where(b =>
                b.Court.Venue.OwnerId == ownerId &&
                b.Status == BookingStatus.PENDING_PAYMENT &&
                b.ExpireAt != null &&
                b.ExpireAt <= utcNow)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Booking>> GetExpiredPendingBookingsAsync(DateTime utcNow, int batchSize, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .Include(b => b.BookingSlots)
            .Include(b => b.Payments)
            .Where(b =>
                b.Status == BookingStatus.PENDING_PAYMENT &&
                b.ExpireAt != null &&
                b.ExpireAt <= utcNow)
            .OrderBy(b => b.ExpireAt)
            .Take(batchSize)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        await _context.Bookings.AddAsync(booking, cancellationToken);
    }

    public async Task AddSlotsAsync(List<BookingSlot> slots, CancellationToken cancellationToken = default)
    {
        await _context.BookingSlots.AddRangeAsync(slots, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<Booking>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await BaseQuery()
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Booking>> GetPendingPaymentBookingsAsync(CancellationToken cancellationToken = default)
    {
        return await BaseQuery()
            .Where(b => b.Status == BookingStatus.PENDING_PAYMENT
                     && (b.ExpireAt == null || b.ExpireAt > DateTime.UtcNow))
            .ToListAsync(cancellationToken);
    }
}