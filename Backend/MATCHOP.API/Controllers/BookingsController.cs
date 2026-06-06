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

    /// <summary>POST /api/my/bookings/{id}/pay/mock — USER thanh toán mock</summary>
    [HttpPost("api/my/bookings/{id:guid}/pay/mock")]
    [Authorize(Roles = "USER")]
    public async Task<IActionResult> PayMyBookingMock(Guid id, MockPaymentRequestDto dto)
    {
        var result = await _bookingService.PayMyBookingMockAsync(id, dto);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Thanh toán mock thành công."));
    }

    /// <summary>PATCH /api/my/bookings/{id}/cancel — USER hủy booking</summary>
    [HttpPatch("api/my/bookings/{id:guid}/cancel")]
    [Authorize(Roles = "USER")]
    public async Task<IActionResult> CancelMyBooking(Guid id, CancelBookingDto dto)
    {
        var result = await _bookingService.CancelMyBookingAsync(id, dto);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Hủy booking thành công."));
    }

    /// <summary>GET /api/owner/bookings — OWNER xem booking theo sân</summary>
    [HttpGet("api/owner/bookings")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> GetOwnerBookings(
        [FromQuery] DateOnly? date,
        [FromQuery] Guid? venueId,
        [FromQuery] Guid? courtId)
    {
        var result = await _bookingService.GetOwnerBookingsAsync(date, venueId, courtId);
        return Ok(ApiResponse<List<BookingResponseDto>>.Ok(result));
    }

    /// <summary>GET /api/owner/bookings/{id} — OWNER xem chi tiết booking</summary>
    [HttpGet("api/owner/bookings/{id:guid}")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> GetOwnerBookingById(Guid id)
    {
        var result = await _bookingService.GetOwnerBookingByIdAsync(id);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result));
    }

    /// <summary>POST /api/owner/bookings/offline — OWNER tạo booking offline</summary>
    [HttpPost("api/owner/bookings/offline")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> CreateOfflineBooking(CreateOfflineBookingDto dto)
    {
        var result = await _bookingService.CreateOfflineBookingAsync(dto);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<BookingResponseDto>.Ok(result, "Tạo booking offline thành công."));
    }

    /// <summary>PATCH /api/owner/bookings/{id}/cancel — OWNER hủy booking</summary>
    [HttpPatch("api/owner/bookings/{id:guid}/cancel")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> CancelOwnerBooking(Guid id, CancelBookingDto dto)
    {
        var result = await _bookingService.CancelOwnerBookingAsync(id, dto);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Hủy booking thành công."));
    }

    /// <summary>PATCH /api/owner/bookings/{id}/complete — OWNER hoàn tất booking</summary>
    [HttpPatch("api/owner/bookings/{id:guid}/complete")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> CompleteOwnerBooking(Guid id)
    {
        var result = await _bookingService.CompleteOwnerBookingAsync(id);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Hoàn tất booking thành công."));
    }
}
