using MATCHOP.API.Entities;

namespace MATCHOP.API.Repositories.Interfaces;

public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Booking?> GetByIdAndUserIdAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Booking?> GetByIdAndOwnerIdAsync(Guid id, Guid ownerId, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetByOwnerIdAsync(Guid ownerId, DateOnly? date, Guid? venueId, Guid? courtId, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetPendingExpiredByUserIdAsync(Guid userId, DateTime utcNow, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetPendingExpiredByOwnerIdAsync(Guid ownerId, DateTime utcNow, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetExpiredPendingBookingsAsync(DateTime utcNow, int batchSize, CancellationToken cancellationToken = default);
    Task AddAsync(Booking booking, CancellationToken cancellationToken = default);
    Task AddSlotsAsync(List<BookingSlot> slots, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<List<Booking>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>Lấy tất cả booking đang PENDING_PAYMENT (chưa hết hạn) – dùng cho SePay webhook matching.</summary>
    Task<List<Booking>> GetPendingPaymentBookingsAsync(CancellationToken cancellationToken = default);

    Task<List<Booking>> GetCalendarBookingsByCourtAndDateAsync(
        Guid courtId,
        DateOnly date,
        CancellationToken cancellationToken = default);
}