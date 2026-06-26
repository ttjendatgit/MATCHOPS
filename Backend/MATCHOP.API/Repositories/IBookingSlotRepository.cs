using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Repositories.Interfaces;

public interface IBookingSlotRepository
{
    Task<List<BookingSlot>> GetSlotsByCourtAndDateAsync(Guid courtId, DateOnly date, CancellationToken cancellationToken = default);

    Task<bool> HasConflictAsync(
        Guid courtId,
        DateOnly date,
        List<TimeOnly> slotStartTimes,
        CancellationToken cancellationToken = default);

    Task<List<BookingSlot>> GetActiveSlotsAsync(
        Guid courtId,
        DateOnly date,
        List<TimeOnly> slotStartTimes,
        CancellationToken cancellationToken = default);
}
