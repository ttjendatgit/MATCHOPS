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

    public async Task<List<BookingSlot>> GetSlotsByCourtAndDateAsync(Guid courtId, DateOnly date, CancellationToken cancellationToken = default)
    {
        return await _context.BookingSlots
            .AsNoTracking()
            .Where(s =>
                s.CourtId == courtId &&
                s.SlotDate == date &&
                (s.Status == BookingSlotStatus.HOLDING ||
                 s.Status == BookingSlotStatus.BOOKED ||
                 s.Status == BookingSlotStatus.BLOCKED))
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasConflictAsync(
        Guid courtId,
        DateOnly date,
        List<TimeOnly> slotStartTimes,
        Guid? excludeBookingId = null,
        CancellationToken cancellationToken = default)
    {
        return await _context.BookingSlots.AnyAsync(s =>
            s.CourtId == courtId &&
            s.SlotDate == date &&
            slotStartTimes.Contains(s.SlotStartTime) &&
            (excludeBookingId == null || s.BookingId != excludeBookingId) &&
            (s.Status == BookingSlotStatus.HOLDING ||
             s.Status == BookingSlotStatus.BOOKED ||
             s.Status == BookingSlotStatus.BLOCKED), cancellationToken);
    }

    public async Task<List<BookingSlot>> GetActiveSlotsAsync(
        Guid courtId,
        DateOnly date,
        List<TimeOnly> slotStartTimes,
        CancellationToken cancellationToken = default)
    {
        return await _context.BookingSlots
            .Where(s =>
                s.CourtId == courtId &&
                s.SlotDate == date &&
                slotStartTimes.Contains(s.SlotStartTime) &&
                (s.Status == BookingSlotStatus.HOLDING ||
                 s.Status == BookingSlotStatus.BOOKED ||
                 s.Status == BookingSlotStatus.BLOCKED))
            .ToListAsync(cancellationToken);
    }
}
