using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories;

public class BookingSlotRepository : IBookingSlotRepository
{
    private readonly ApplicationDbContext _context;

    public BookingSlotRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<BookingSlot>> GetSlotsByCourtAndDateAsync(Guid courtId, DateOnly date)
    {
        return await _context.BookingSlots
            .AsNoTracking()
            .Where(s => s.CourtId == courtId && s.SlotDate == date)
            .ToListAsync();
    }

    public async Task<bool> HasConflictAsync(
        Guid courtId,
        DateOnly date,
        List<TimeOnly> slotStartTimes)
    {
        return await _context.BookingSlots.AnyAsync(s =>
            s.CourtId == courtId &&
            s.SlotDate == date &&
            slotStartTimes.Contains(s.SlotStartTime) &&
            (s.Status == BookingSlotStatus.HOLDING ||
             s.Status == BookingSlotStatus.BOOKED ||
             s.Status == BookingSlotStatus.BLOCKED));
    }
}