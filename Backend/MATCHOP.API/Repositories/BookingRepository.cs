using MATCHOP.API.Entities;
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
            .Include(b => b.BookingSlots.OrderBy(s => s.SlotStartTime));

    public async Task<Booking?> GetByIdAsync(Guid id)
    {
        return await BaseQuery()
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Booking?> GetByIdAndUserIdAsync(Guid id, Guid userId)
    {
        return await BaseQuery()
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
    }

    public async Task<List<Booking>> GetByUserIdAsync(Guid userId)
    {
        return await BaseQuery()
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(Booking booking)
    {
        await _context.Bookings.AddAsync(booking);
    }

    public async Task AddSlotsAsync(List<BookingSlot> slots)
    {
        await _context.BookingSlots.AddRangeAsync(slots);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}