using MATCHOP.API.DTOs.Bookings;

namespace MATCHOP.API.Services.Interfaces;

public interface IBookingService
{
    Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto);
    Task<List<BookingResponseDto>> GetMyBookingsAsync();
    Task<BookingResponseDto> GetMyBookingByIdAsync(Guid id);
}