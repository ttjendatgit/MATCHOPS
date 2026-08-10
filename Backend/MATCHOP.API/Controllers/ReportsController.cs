using MATCHOP.API.DTOs.Bookings;
using MATCHOP.API.DTOs.Membership;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers;

[ApiController]
[Route("api/admin/reports")]
[Authorize(Roles = "ADMIN")]
public class ReportsController : ControllerBase
{
    private readonly IMembershipService _membershipService;
    private readonly IBookingService _bookingService;

    public ReportsController(IMembershipService membershipService, IBookingService bookingService)
    {
        _membershipService = membershipService;
        _bookingService = bookingService;
    }

    /// <summary>
    /// GET /api/admin/reports/membership
    /// Generate membership report data for export.
    /// </summary>
    [HttpGet("membership")]
    public async Task<IActionResult> GetMembershipReport(CancellationToken cancellationToken = default)
    {
        var subscriptions = await _membershipService.GetAllSubscriptionsAsync(cancellationToken);
        var plans = await _membershipService.GetAllPlansAsync(cancellationToken);
        var stats = await _membershipService.GetStatisticsAsync(cancellationToken);

        return Ok(ApiResponse<MembershipReportDto>.Ok(new MembershipReportDto
        {
            GeneratedAt = DateTime.UtcNow.AddHours(7),
            Statistics = stats,
            Subscriptions = subscriptions,
            Plans = plans
        }));
    }

    /// <summary>
    /// GET /api/admin/reports/bookings
    /// Generate bookings report data for export.
    /// </summary>
    [HttpGet("bookings")]
    public async Task<IActionResult> GetBookingsReport(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken cancellationToken = default)
    {
        var result = await _bookingService.GetBookingsReportAsync(fromDate, toDate, cancellationToken);
        return Ok(ApiResponse<BookingReportDto>.Ok(result));
    }

    public class MembershipReportDto
    {
        public DateTime GeneratedAt { get; set; }
        public MembershipStatisticsDto Statistics { get; set; } = null!;
        public List<AdminSubscriptionDto> Subscriptions { get; set; } = new();
        public List<MembershipPlanResponseDto> Plans { get; set; } = new();
    }
}

