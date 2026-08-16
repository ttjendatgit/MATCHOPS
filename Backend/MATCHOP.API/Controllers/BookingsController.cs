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
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.CreateBookingAsync(dto, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<BookingResponseDto>.Ok(
                result,
                "Đặt sân thành công. Vui lòng thanh toán trong 10 phút."));
    }

    /// <summary>GET /api/my/bookings — USER xem danh sách booking</summary>
    [HttpGet("api/my/bookings")]
    [Authorize(Roles = "USER")]
    public async Task<IActionResult> GetMyBookings(CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.GetMyBookingsAsync(cancellationToken);
        return Ok(ApiResponse<List<BookingResponseDto>>.Ok(result));
    }

    /// <summary>GET /api/my/bookings/{id} — USER xem chi tiết booking</summary>
    [HttpGet("api/my/bookings/{id:guid}")]
    [Authorize(Roles = "USER")]
    public async Task<IActionResult> GetMyBookingById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.GetMyBookingByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result));
    }

    /// <summary>POST /api/my/bookings/{id}/pay/mock — USER thanh toán mock</summary>
    [HttpPost("api/my/bookings/{id:guid}/pay/mock")]
    [Authorize(Roles = "USER")]
    public async Task<IActionResult> PayMyBookingMock(Guid id, MockPaymentRequestDto dto, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.PayMyBookingMockAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Thanh toán mock thành công."));
    }

    /// <summary>POST /api/my/bookings/{id}/pay/cash — USER xác nhận thanh toán tiền mặt tại sân</summary>
    [HttpPost("api/my/bookings/{id:guid}/pay/cash")]
    [Authorize(Roles = "USER")]
    public async Task<IActionResult> PayMyBookingCash(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.PayMyBookingCashAsync(id, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Đặt sân thành công. Vui lòng thanh toán tiền mặt tại sân."));
    }

    /// <summary>PATCH /api/my/bookings/{id}/cancel — USER hủy booking</summary>
    [HttpPatch("api/my/bookings/{id:guid}/cancel")]
    [Authorize(Roles = "USER")]
    public async Task<IActionResult> CancelMyBooking(Guid id, CancelBookingDto dto, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.CancelMyBookingAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Hủy booking thành công."));
    }

    /// <summary>GET /api/owner/bookings — OWNER xem booking theo sân</summary>
    [HttpGet("api/owner/bookings")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> GetOwnerBookings(
        [FromQuery] DateOnly? date,
        [FromQuery] Guid? venueId,
        [FromQuery] Guid? courtId,
        CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.GetOwnerBookingsAsync(date, venueId, courtId, cancellationToken);
        return Ok(ApiResponse<List<BookingResponseDto>>.Ok(result));
    }

    /// <summary>GET /api/owner/bookings/{id} — OWNER xem chi tiết booking</summary>
    [HttpGet("api/owner/bookings/{id:guid}")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> GetOwnerBookingById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.GetOwnerBookingByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result));
    }

    /// <summary>POST /api/owner/bookings/offline — OWNER tạo booking offline</summary>
    [HttpPost("api/owner/bookings/offline")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> CreateOfflineBooking(CreateOfflineBookingDto dto, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.CreateOfflineBookingAsync(dto, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<BookingResponseDto>.Ok(result, "Tạo booking offline thành công."));
    }

    /// <summary>POST /api/owner/bookings/external — OWNER tạo lịch ngoài hệ thống</summary>
    [HttpPost("api/owner/bookings/external")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> CreateExternalBooking(
        [FromBody] CreateExternalBookingDto dto,
        CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.CreateExternalBookingAsync(dto, cancellationToken);
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<BookingResponseDto>.Ok(
                result,
                "Đã thêm lịch thành công. Khung giờ này hiện không thể được đặt bởi người dùng MATCHOP."));
    }

    /// <summary>PATCH /api/owner/bookings/{id}/external — OWNER cập nhật lịch ngoài hệ thống</summary>
    [HttpPatch("api/owner/bookings/{id:guid}/external")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> UpdateExternalBooking(
        Guid id,
        [FromBody] UpdateExternalBookingDto dto,
        CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.UpdateExternalBookingAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Cập nhật lịch ngoài hệ thống thành công."));
    }

    /// <summary>GET /api/owner/courts/{courtId}/calendar — OWNER xem lịch thống nhất</summary>
    [HttpGet("api/owner/courts/{courtId:guid}/calendar")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> GetOwnerCourtCalendar(
        Guid courtId,
        [FromQuery] DateOnly date,
        CancellationToken cancellationToken = default)
    {
        if (date == default)
            date = DateOnly.FromDateTime(DateTime.UtcNow);

        var result = await _bookingService.GetOwnerCourtCalendarAsync(courtId, date, cancellationToken);
        return Ok(ApiResponse<OwnerCourtCalendarResponseDto>.Ok(result));
    }

    /// <summary>PATCH /api/owner/bookings/{id}/cancel — OWNER hủy booking</summary>
    [HttpPatch("api/owner/bookings/{id:guid}/cancel")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> CancelOwnerBooking(Guid id, CancelBookingDto dto, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.CancelOwnerBookingAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Hủy booking thành công."));
    }

    /// <summary>PATCH /api/owner/bookings/{id}/confirm — OWNER xác nhận booking</summary>
    [HttpPatch("api/owner/bookings/{id:guid}/confirm")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> ConfirmOwnerBooking(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.ConfirmOwnerBookingAsync(id, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Xác nhận booking thành công."));
    }

    /// <summary>PATCH /api/owner/bookings/{id}/complete — OWNER hoàn tất booking</summary>
    [HttpPatch("api/owner/bookings/{id:guid}/complete")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> CompleteOwnerBooking(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.CompleteOwnerBookingAsync(id, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Hoàn tất booking thành công."));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /// <summary>GET /api/admin/bookings — ADMIN get all bookings</summary>
    [HttpGet("api/admin/bookings")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAllBookings(CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.GetAllBookingsAsync(cancellationToken);
        return Ok(ApiResponse<List<BookingResponseDto>>.Ok(result));
    }

    /// <summary>GET /api/admin/bookings/{id} — ADMIN get booking by id</summary>
    [HttpGet("api/admin/bookings/{id:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetBookingById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.GetBookingByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result));
    }

    /// <summary>PATCH /api/admin/bookings/{id}/cancel — ADMIN cancel booking</summary>
    [HttpPatch("api/admin/bookings/{id:guid}/cancel")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> CancelBooking(Guid id, [FromBody] CancelBookingDto dto, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.CancelBookingAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Hủy booking thành công."));
    }

    /// <summary>PATCH /api/admin/bookings/{id}/confirm — ADMIN confirm booking</summary>
    [HttpPatch("api/admin/bookings/{id:guid}/confirm")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> ConfirmBooking(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.ConfirmBookingAsync(id, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Xác nhận booking thành công."));
    }

    /// <summary>PATCH /api/admin/bookings/{id}/complete — ADMIN complete booking</summary>
    [HttpPatch("api/admin/bookings/{id:guid}/complete")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> CompleteBooking(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.CompleteBookingAsync(id, cancellationToken);
        return Ok(ApiResponse<BookingResponseDto>.Ok(result, "Hoàn tất booking thành công."));
    }
}
