using MATCHOP.API.DTOs.Bookings;

namespace MATCHOP.API.Services.Interfaces;

public interface IBookingService
{
    Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto);
    Task<List<BookingResponseDto>> GetMyBookingsAsync();
    Task<BookingResponseDto> GetMyBookingByIdAsync(Guid id);
    Task<BookingResponseDto> PayMyBookingMockAsync(Guid id, MockPaymentRequestDto dto);
    Task<BookingResponseDto> CancelMyBookingAsync(Guid id, CancelBookingDto dto);
    Task<List<BookingResponseDto>> GetOwnerBookingsAsync(DateOnly? date, Guid? venueId, Guid? courtId);
    Task<BookingResponseDto> GetOwnerBookingByIdAsync(Guid id);
    Task<BookingResponseDto> CreateOfflineBookingAsync(CreateOfflineBookingDto dto);
    Task<BookingResponseDto> CancelOwnerBookingAsync(Guid id, CancelBookingDto dto);
    Task<BookingResponseDto> CompleteOwnerBookingAsync(Guid id);
    Task<int> ExpirePendingBookingsAsync(DateTime utcNow);

    
}
