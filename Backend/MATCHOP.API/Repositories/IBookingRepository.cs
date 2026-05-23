using MATCHOP.API.Entities;

namespace MATCHOP.API.Repositories.Interfaces;

public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(Guid id);
    Task<Booking?> GetByIdAndUserIdAsync(Guid id, Guid userId);
    Task<List<Booking>> GetByUserIdAsync(Guid userId);
    Task AddAsync(Booking booking);
    Task AddSlotsAsync(List<BookingSlot> slots);
    Task SaveChangesAsync();
}