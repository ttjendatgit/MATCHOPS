using MATCHOP.API.Entities;

namespace MATCHOP.API.Repositories.Interfaces;

public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(Guid id);
    Task<Booking?> GetByIdAndUserIdAsync(Guid id, Guid userId);
    Task<List<Booking>> GetByUserIdAsync(Guid userId);
    Task<Booking?> GetByIdAndOwnerIdAsync(Guid id, Guid ownerId);
    Task<List<Booking>> GetByOwnerIdAsync(Guid ownerId, DateOnly? date, Guid? venueId, Guid? courtId);
    Task<List<Booking>> GetPendingExpiredByUserIdAsync(Guid userId, DateTime utcNow);
    Task<List<Booking>> GetPendingExpiredByOwnerIdAsync(Guid ownerId, DateTime utcNow);
    Task<List<Booking>> GetExpiredPendingBookingsAsync(DateTime utcNow, int batchSize);
    Task AddAsync(Booking booking);
    Task AddSlotsAsync(List<BookingSlot> slots);
    Task SaveChangesAsync();
}