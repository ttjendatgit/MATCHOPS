using MATCHOP.API.DTOs.Bookings;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    /// <summary>POST /api/bookings — USER tạo booking online</summary>
    [HttpPost("api/bookings")]
    [Authorize(Roles = "USER")]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
    {
        var result = await _bookingService.CreateBookingAsync(dto);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<BookingResponseDto>.Ok(
                result,
                "Đặt sân thành công. Vui lòng thanh toán trong 10 phút."));
    }

    /// <summary>GET /api/my/bookings — USER xem danh sách booking</summary>
    [HttpGet("api/my/bookings")]
    [Authorize(Roles = "USER")]
    public async Task<IActionResult> GetMyBookings()
    {
        var result = await _bookingService.GetMyBookingsAsync();
        return Ok(ApiResponse<List<BookingResponseDto>>.Ok(result));
    }

    /// <summary>GET /api/my/bookings/{id} — USER xem chi tiết booking</summary>
    [HttpGet("api/my/bookings/{id:guid}")]
    [Authorize(Roles = "USER")]
    public async Task<IActionResult> GetMyBookingById(Guid id)
    {
        var result = await _bookingService.GetMyBookingByIdAsync(id);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result));
    }
}