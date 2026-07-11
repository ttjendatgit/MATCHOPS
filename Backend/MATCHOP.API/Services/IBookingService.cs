using MATCHOP.API.DTOs.Bookings;

namespace MATCHOP.API.Services.Interfaces;

public interface IBookingService
{
    Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto, CancellationToken cancellationToken = default);
    Task<List<BookingResponseDto>> GetMyBookingsAsync(CancellationToken cancellationToken = default);
    Task<BookingResponseDto> GetMyBookingByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> PayMyBookingMockAsync(Guid id, MockPaymentRequestDto dto, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> CancelMyBookingAsync(Guid id, CancelBookingDto dto, CancellationToken cancellationToken = default);
    Task<List<BookingResponseDto>> GetOwnerBookingsAsync(DateOnly? date, Guid? venueId, Guid? courtId, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> GetOwnerBookingByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> CreateOfflineBookingAsync(CreateOfflineBookingDto dto, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> CancelOwnerBookingAsync(Guid id, CancelBookingDto dto, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> ConfirmOwnerBookingAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> CompleteOwnerBookingAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> ExpirePendingBookingsAsync(DateTime utcNow, CancellationToken cancellationToken = default);
    // Admin methods
    Task<List<BookingResponseDto>> GetAllBookingsAsync(CancellationToken cancellationToken = default);
    Task<BookingResponseDto> GetBookingByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> CancelBookingAsync(Guid id, CancelBookingDto dto, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> ConfirmBookingAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> CompleteBookingAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BookingReportDto> GetBookingsReportAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
}
