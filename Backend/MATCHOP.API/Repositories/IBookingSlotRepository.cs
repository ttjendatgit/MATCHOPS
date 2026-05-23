using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Repositories.Interfaces;

public interface IBookingSlotRepository
{
    Task<List<BookingSlot>> GetSlotsByCourtAndDateAsync(Guid courtId, DateOnly date);

    Task<bool> HasConflictAsync(
        Guid courtId,
        DateOnly date,
        List<TimeOnly> slotStartTimes);
}