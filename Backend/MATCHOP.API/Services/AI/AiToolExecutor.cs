using MATCHOP.API.DTOs.Bookings;
using MATCHOP.API.DTOs.Courts;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services.AI;

public interface IAiToolExecutor
{
    Task<AiToolResult> ExecuteAsync(
        AiPlan plan,
        AiExecutionContext context,
        CancellationToken cancellationToken = default);
}

public class AiToolExecutor : IAiToolExecutor
{
    private const int MaxVenuesToScan = 10;
    private const int MaxCourtsPerVenue = 3;

    private readonly IVenueService _venueService;
    private readonly ICourtService _courtService;
    private readonly ICourtAvailabilityService _availabilityService;
    private readonly IBookingService _bookingService;
    private readonly ISportService _sportService;
    private readonly IDashboardStatisticsService _dashboardStatisticsService;
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<AiToolExecutor> _logger;

    public AiToolExecutor(
        IVenueService venueService,
        ICourtService courtService,
        ICourtAvailabilityService availabilityService,
        IBookingService bookingService,
        ISportService sportService,
        IDashboardStatisticsService dashboardStatisticsService,
        ApplicationDbContext dbContext,
        ILogger<AiToolExecutor> logger)
    {
        _venueService = venueService;
        _courtService = courtService;
        _availabilityService = availabilityService;
        _bookingService = bookingService;
        _sportService = sportService;
        _dashboardStatisticsService = dashboardStatisticsService;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<AiToolResult> ExecuteAsync(
        AiPlan plan,
        AiExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        if (plan.NeedsClarification && !string.IsNullOrWhiteSpace(plan.ClarificationQuestion))
        {
            return new AiToolResult
            {
                Intent = plan.Intent,
                Success = true,
                Message = plan.ClarificationQuestion,
                Data = new { needsClarification = true }
            };
        }

        try
        {
            return plan.Intent switch
            {
                AiIntents.SearchVenue or AiIntents.LocationRecommendation or AiIntents.SportRecommendation
                    => await SearchVenuesAsync(plan, cancellationToken),
                AiIntents.SearchCourt => await SearchCourtsAsync(plan, cancellationToken),
                AiIntents.CheckAvailability or AiIntents.PriceInformation
                    => await CheckAvailabilityAsync(plan, cancellationToken),
                AiIntents.VenueInformation => await GetVenueDetailAsync(plan, cancellationToken),
                AiIntents.CourtInformation => await GetCourtDetailAsync(plan, cancellationToken),
                AiIntents.ViewBooking => await GetMyBookingsAsync(cancellationToken),
                AiIntents.CancelBooking => await CancelBookingAsync(plan, cancellationToken),
                AiIntents.BookCourt => await PrepareBookingAsync(plan, context, cancellationToken),
                AiIntents.ConfirmBooking => await ConfirmBookingAsync(context, cancellationToken),
                AiIntents.Payment => await GetMyBookingsAsync(cancellationToken),
                AiIntents.OwnerDashboard => await GetOwnerDashboardAsync(context, cancellationToken),
                AiIntents.AdminDashboard => await GetAdminDashboardAsync(context, cancellationToken),
                AiIntents.CoachDashboard => await GetCoachDashboardAsync(context, cancellationToken),
                AiIntents.GeneralChat or AiIntents.Faq or AiIntents.Unknown
                    => HandleGeneralOrRejectPending(plan, context),
                _ => new AiToolResult
                {
                    Intent = plan.Intent,
                    Success = false,
                    Message = "Tôi chưa hiểu yêu cầu. Bạn có thể thử: tìm sân cầu lông, kiểm tra lịch, xem booking, hoặc hỏi thông tin sân."
                }
            };
        }
        catch (AppException ex)
        {
            _logger.LogWarning("AI tool error: {Code} {Message}", ex.Code, ex.Message);
            return new AiToolResult
            {
                Intent = plan.Intent,
                Success = false,
                ErrorCode = ex.Code,
                Message = ex.Message
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI tool unexpected error for intent {Intent}", plan.Intent);
            return new AiToolResult
            {
                Intent = plan.Intent,
                Success = false,
                Message = "Không thể lấy dữ liệu. Vui lòng thử lại sau."
            };
        }
    }

    private static AiToolResult HandleGeneralOrRejectPending(AiPlan plan, AiExecutionContext context)
    {
        if (context.Metadata.PendingBooking != null &&
            plan.Intent == AiIntents.GeneralChat)
        {
            context.Metadata.PendingBooking = null;
            return new AiToolResult
            {
                Intent = plan.Intent,
                Success = true,
                Message = "Đã hủy yêu cầu đặt sân đang chờ xác nhận.",
                Data = new { pendingCancelled = true }
            };
        }

        return new AiToolResult
        {
            Intent = plan.Intent,
            Success = true,
            Data = new { generalChat = true }
        };
    }

    private async Task<AiToolResult> SearchVenuesAsync(AiPlan plan, CancellationToken cancellationToken)
    {
        var sportId = await ResolveSportIdAsync(plan.Parameters.Sport, cancellationToken);
        var venues = await _venueService.GetActiveVenuesAsync(
            plan.Parameters.City,
            plan.Parameters.District,
            sportId,
            plan.Parameters.Keyword,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(plan.Parameters.City))
        {
            venues = venues
                .Where(v => LocationHelper.CityMatches(v.City, plan.Parameters.City))
                .ToList();
        }

        if (!string.IsNullOrWhiteSpace(plan.Parameters.District))
        {
            venues = venues
                .Where(v => LocationHelper.DistrictMatches(v.District, plan.Parameters.District))
                .ToList();
        }

        var needsAvailability = !string.IsNullOrWhiteSpace(plan.Parameters.StartTime)
            && !string.IsNullOrWhiteSpace(plan.Parameters.Date);

        if (needsAvailability)
        {
            var available = await FindAvailableCourtsAsync(plan, sportId, venues.Select(v => v.Id).ToList(), cancellationToken);
            return new AiToolResult
            {
                Intent = plan.Intent,
                Success = true,
                Data = new
                {
                    venues = venues.Take(8).Select(v => new
                    {
                        v.Id,
                        v.Name,
                        v.Address,
                        v.District,
                        v.City,
                        v.OpeningTime,
                        v.ClosingTime
                    }),
                    availableSlots = available
                }
            };
        }

        return new AiToolResult
        {
            Intent = plan.Intent,
            Success = true,
            Data = new
            {
                count = venues.Count,
                venues = venues.Take(8).Select(v => new
                {
                    v.Id,
                    v.Name,
                    v.Address,
                    v.District,
                    v.City,
                    v.OpeningTime,
                    v.ClosingTime
                })
            }
        };
    }

    private async Task<AiToolResult> SearchCourtsAsync(AiPlan plan, CancellationToken cancellationToken)
    {
        if (!plan.Parameters.VenueId.HasValue && string.IsNullOrWhiteSpace(plan.Parameters.VenueName))
        {
            plan.Intent = AiIntents.SearchVenue;
            return await SearchVenuesAsync(plan, cancellationToken);
        }

        var venueId = plan.Parameters.VenueId;
        if (!venueId.HasValue)
        {
            venueId = await ResolveVenueIdByNameAsync(plan.Parameters.VenueName!, cancellationToken);
            if (!venueId.HasValue)
            {
                return new AiToolResult
                {
                    Intent = plan.Intent,
                    Success = true,
                    Data = new { courts = Array.Empty<object>(), message = "Không tìm thấy sân theo tên." }
                };
            }
        }

        var courts = await _courtService.GetPublicCourtsByVenueIdAsync(venueId.Value, cancellationToken);
        var sportId = await ResolveSportIdAsync(plan.Parameters.Sport, cancellationToken);
        if (sportId.HasValue)
            courts = courts.Where(c => c.SportId == sportId.Value).ToList();

        return new AiToolResult
        {
            Intent = plan.Intent,
            Success = true,
            Data = new
            {
                venueId,
                courts = courts.Select(c => new { c.Id, c.Name, c.SportName, c.VenueName }).Take(10)
            }
        };
    }

    private async Task<AiToolResult> GetVenueDetailAsync(AiPlan plan, CancellationToken cancellationToken)
    {
        var venueId = plan.Parameters.VenueId ?? await ResolveVenueIdByNameAsync(plan.Parameters.VenueName ?? plan.Parameters.Keyword ?? "", cancellationToken);
        if (!venueId.HasValue)
        {
            return new AiToolResult
            {
                Intent = plan.Intent,
                Success = false,
                Message = "Bạn muốn xem thông tin sân nào? Vui lòng cho tôi tên hoặc khu vực."
            };
        }

        var venue = await _venueService.GetActiveVenueByIdAsync(venueId.Value, cancellationToken);
        var courts = await _courtService.GetPublicCourtsByVenueIdAsync(venueId.Value, cancellationToken);

        return new AiToolResult
        {
            Intent = plan.Intent,
            Success = true,
            Data = new
            {
                venue,
                courts = courts.Select(c => new { c.Id, c.Name, c.SportName })
            }
        };
    }

    private async Task<AiToolResult> GetCourtDetailAsync(AiPlan plan, CancellationToken cancellationToken)
    {
        if (!plan.Parameters.CourtId.HasValue)
        {
            return new AiToolResult
            {
                Intent = plan.Intent,
                Success = false,
                Message = "Bạn muốn xem thông tin sân con (court) nào?"
            };
        }

        var availability = await GetAvailabilityForPlanAsync(plan, cancellationToken);
        return availability;
    }

    private async Task<AiToolResult> CheckAvailabilityAsync(AiPlan plan, CancellationToken cancellationToken)
    {
        if (plan.Parameters.CourtId.HasValue)
            return await GetAvailabilityForPlanAsync(plan, cancellationToken);

        var sportId = await ResolveSportIdAsync(plan.Parameters.Sport, cancellationToken);
        var venues = await _venueService.GetActiveVenuesAsync(
            plan.Parameters.City,
            plan.Parameters.District,
            sportId,
            plan.Parameters.Keyword,
            cancellationToken);

        var available = await FindAvailableCourtsAsync(plan, sportId, venues.Select(v => v.Id).ToList(), cancellationToken);

        return new AiToolResult
        {
            Intent = plan.Intent,
            Success = true,
            Data = new { availableSlots = available, scannedVenues = Math.Min(venues.Count, MaxVenuesToScan) }
        };
    }

    private async Task<AiToolResult> GetAvailabilityForPlanAsync(AiPlan plan, CancellationToken cancellationToken)
    {
        if (!plan.Parameters.CourtId.HasValue)
        {
            return new AiToolResult
            {
                Intent = plan.Intent,
                Success = false,
                Message = "Vui lòng cho tôi biết sân (court) cụ thể hoặc khu vực + môn thể thao để kiểm tra lịch."
            };
        }

        var date = ParseDate(plan.Parameters.Date) ?? VenueTimeHelper.GetToday();
        var availability = await _availabilityService.GetAvailabilityAsync(plan.Parameters.CourtId.Value, date, cancellationToken);

        var start = ParseTime(plan.Parameters.StartTime);
        var end = ParseTime(plan.Parameters.EndTime);

        object slotInfo;
        if (start.HasValue && end.HasValue)
        {
            var matching = FindMatchingSlots(availability, start.Value, end.Value);
            slotInfo = new
            {
                requested = $"{start:HH:mm}-{end:HH:mm}",
                isAvailable = matching.All(s => s.Status == "AVAILABLE"),
                slots = matching
            };
        }
        else
        {
            slotInfo = new
            {
                availableCount = availability.Slots.Count(s => s.Status == "AVAILABLE"),
                slots = availability.Slots.Where(s => s.Status == "AVAILABLE").Take(12)
            };
        }

        return new AiToolResult
        {
            Intent = plan.Intent,
            Success = true,
            Data = new
            {
                availability.CourtId,
                availability.CourtName,
                availability.VenueName,
                availability.Date,
                slotInfo
            }
        };
    }

    private async Task<AiToolResult> GetMyBookingsAsync(CancellationToken cancellationToken)
    {
        var bookings = await _bookingService.GetMyBookingsAsync(cancellationToken);
        return new AiToolResult
        {
            Intent = AiIntents.ViewBooking,
            Success = true,
            Data = new
            {
                count = bookings.Count,
                bookings = bookings.Take(10).Select(b => new
                {
                    b.Id,
                    b.VenueName,
                    b.CourtName,
                    b.BookingDate,
                    b.StartTime,
                    b.EndTime,
                    b.TotalPrice,
                    b.Status,
                    b.PaymentStatus
                })
            }
        };
    }

    private async Task<AiToolResult> CancelBookingAsync(AiPlan plan, CancellationToken cancellationToken)
    {
        if (!plan.Parameters.BookingId.HasValue)
        {
            var bookings = await _bookingService.GetMyBookingsAsync(cancellationToken);
            var cancellable = bookings
                .Where(b => b.Status is "PENDING_PAYMENT" or "CONFIRMED")
                .ToList();

            if (cancellable.Count == 0)
            {
                return new AiToolResult
                {
                    Intent = AiIntents.CancelBooking,
                    Success = false,
                    Message = "Không tìm thấy booking nào có thể hủy."
                };
            }

            if (cancellable.Count == 1)
            {
                plan.Parameters.BookingId = cancellable[0].Id;
            }
            else
            {
                return new AiToolResult
                {
                    Intent = AiIntents.CancelBooking,
                    Success = true,
                    Message = "Bạn muốn hủy booking nào?",
                    Data = new { bookings = cancellable.Select(b => new { b.Id, b.VenueName, b.BookingDate, b.StartTime }) }
                };
            }
        }

        var result = await _bookingService.CancelMyBookingAsync(
            plan.Parameters.BookingId!.Value,
            new CancelBookingDto { Reason = "Hủy qua AI Assistant" },
            cancellationToken);

        return new AiToolResult
        {
            Intent = AiIntents.CancelBooking,
            Success = true,
            Message = "Đã hủy booking thành công.",
            Data = result
        };
    }

    private async Task<AiToolResult> PrepareBookingAsync(
        AiPlan plan,
        AiExecutionContext context,
        CancellationToken cancellationToken)
    {
        var courtId = plan.Parameters.CourtId;
        if (!courtId.HasValue && plan.Parameters.VenueId.HasValue)
        {
            var courts = await _courtService.GetPublicCourtsByVenueIdAsync(plan.Parameters.VenueId.Value, cancellationToken);
            var sportId = await ResolveSportIdAsync(plan.Parameters.Sport, cancellationToken);
            var filtered = sportId.HasValue ? courts.Where(c => c.SportId == sportId.Value).ToList() : courts;
            courtId = filtered.FirstOrDefault()?.Id;
        }

        if (!courtId.HasValue)
        {
            var check = await CheckAvailabilityAsync(plan, cancellationToken);
            if (check.Data is null)
                return check;

            return new AiToolResult
            {
                Intent = AiIntents.BookCourt,
                Success = true,
                Message = "Tôi tìm thấy các khung giờ trống. Bạn muốn đặt sân nào? Hãy nói tên sân và giờ cụ thể.",
                Data = check.Data
            };
        }

        var date = ParseDate(plan.Parameters.Date) ?? VenueTimeHelper.GetToday();
        var start = ParseTime(plan.Parameters.StartTime);
        var end = ParseTime(plan.Parameters.EndTime);

        if (!start.HasValue || !end.HasValue)
        {
            return new AiToolResult
            {
                Intent = AiIntents.BookCourt,
                Success = false,
                Message = "Bạn muốn đặt sân vào ngày nào và khung giờ nào? (ví dụ: 16/08, 19:00-20:00)"
            };
        }

        var availability = await _availabilityService.GetAvailabilityAsync(courtId.Value, date, cancellationToken);
        var slots = FindMatchingSlots(availability, start.Value, end.Value);

        if (slots.Count == 0 || slots.Any(s => s.Status != "AVAILABLE"))
        {
            var alternatives = availability.Slots
                .Where(s => s.Status == "AVAILABLE")
                .Take(6)
                .Select(s => new { s.StartTime, s.EndTime, s.Price })
                .ToList();

            return new AiToolResult
            {
                Intent = AiIntents.BookCourt,
                Success = false,
                Message = "Rất tiếc, khung giờ này không còn trống.",
                Data = new { alternatives }
            };
        }

        var totalPrice = slots.Where(s => s.Price.HasValue).Sum(s => s.Price!.Value);
        var pending = new PendingBookingDraft
        {
            CourtId = courtId.Value,
            VenueName = availability.VenueName,
            CourtName = availability.CourtName,
            BookingDate = date.ToString("yyyy-MM-dd"),
            StartTime = start.Value.ToString("HH:mm"),
            EndTime = end.Value.ToString("HH:mm"),
            TotalPrice = totalPrice
        };

        context.Metadata.PendingBooking = pending;

        return new AiToolResult
        {
            Intent = AiIntents.BookCourt,
            Success = true,
            RequiresConfirmation = true,
            PendingBooking = pending,
            Data = new
            {
                pending,
                confirmationRequired = true,
                message = $"Xác nhận đặt: {pending.CourtName} - {pending.VenueName}, ngày {pending.BookingDate}, {pending.StartTime}-{pending.EndTime}, giá {pending.TotalPrice:N0}đ"
            }
        };
    }

    private async Task<AiToolResult> ConfirmBookingAsync(AiExecutionContext context, CancellationToken cancellationToken)
    {
        var pending = context.Metadata.PendingBooking;
        if (pending is null)
        {
            return new AiToolResult
            {
                Intent = AiIntents.ConfirmBooking,
                Success = false,
                Message = "Không có booking nào đang chờ xác nhận. Bạn muốn đặt sân mới không?"
            };
        }

        if (!DateOnly.TryParse(pending.BookingDate, out var bookingDate) ||
            !TimeOnly.TryParse(pending.StartTime, out var startTime) ||
            !TimeOnly.TryParse(pending.EndTime, out var endTime))
        {
            context.Metadata.PendingBooking = null;
            return new AiToolResult
            {
                Intent = AiIntents.ConfirmBooking,
                Success = false,
                Message = "Thông tin booking không hợp lệ. Vui lòng chọn lại khung giờ."
            };
        }

        var availability = await _availabilityService.GetAvailabilityAsync(pending.CourtId, bookingDate, cancellationToken);
        var slots = FindMatchingSlots(availability, startTime, endTime);
        if (slots.Count == 0 || slots.Any(s => s.Status != "AVAILABLE"))
        {
            context.Metadata.PendingBooking = null;
            return new AiToolResult
            {
                Intent = AiIntents.ConfirmBooking,
                Success = false,
                Message = "Rất tiếc, khung giờ này vừa được người khác đặt. Tôi có thể tìm khung giờ gần nhất cho bạn.",
                Data = new
                {
                    alternatives = availability.Slots
                        .Where(s => s.Status == "AVAILABLE")
                        .Take(6)
                        .Select(s => new { s.StartTime, s.EndTime, s.Price })
                }
            };
        }

        var booking = await _bookingService.CreateBookingAsync(new CreateBookingDto
        {
            CourtId = pending.CourtId,
            BookingDate = bookingDate,
            StartTime = startTime,
            EndTime = endTime,
            Note = "Đặt qua MATCHOP AI Assistant"
        }, cancellationToken);

        context.Metadata.PendingBooking = null;

        return new AiToolResult
        {
            Intent = AiIntents.ConfirmBooking,
            Success = true,
            Message = "Đặt sân thành công! Vui lòng thanh toán trong ứng dụng để giữ slot.",
            Data = new
            {
                booking.Id,
                booking.VenueName,
                booking.CourtName,
                booking.BookingDate,
                booking.StartTime,
                booking.EndTime,
                booking.TotalPrice,
                booking.Status,
                booking.PaymentStatus
            }
        };
    }

    private async Task<AiToolResult> GetOwnerDashboardAsync(AiExecutionContext context, CancellationToken cancellationToken)
    {
        if (!string.Equals(context.Role, "OWNER", StringComparison.OrdinalIgnoreCase))
        {
            return new AiToolResult
            {
                Intent = AiIntents.OwnerDashboard,
                Success = false,
                ErrorCode = ErrorCodes.PermissionDenied,
                Message = "Bạn không có quyền xem phân tích doanh thu chủ sân."
            };
        }

        var stats = await _dashboardStatisticsService.GetOwnerStatisticsAsync(context.UserId, cancellationToken);
        return new AiToolResult
        {
            Intent = AiIntents.OwnerDashboard,
            Success = true,
            Data = stats
        };
    }

    private async Task<AiToolResult> GetAdminDashboardAsync(AiExecutionContext context, CancellationToken cancellationToken)
    {
        if (!string.Equals(context.Role, "ADMIN", StringComparison.OrdinalIgnoreCase))
        {
            return new AiToolResult
            {
                Intent = AiIntents.AdminDashboard,
                Success = false,
                ErrorCode = ErrorCodes.PermissionDenied,
                Message = "Bạn không có quyền xem phân tích nền tảng."
            };
        }

        var stats = await _dashboardStatisticsService.GetAdminStatisticsAsync(cancellationToken);
        return new AiToolResult
        {
            Intent = AiIntents.AdminDashboard,
            Success = true,
            Data = stats
        };
    }

    private async Task<AiToolResult> GetCoachDashboardAsync(AiExecutionContext context, CancellationToken cancellationToken)
    {
        var hasProfile = await _dbContext.CoachProfiles
            .AsNoTracking()
            .AnyAsync(c => c.UserId == context.UserId, cancellationToken);

        if (!hasProfile)
        {
            return new AiToolResult
            {
                Intent = AiIntents.CoachDashboard,
                Success = false,
                ErrorCode = ErrorCodes.PermissionDenied,
                Message = "Bạn chưa có hồ sơ huấn luyện viên trên MATCHOP."
            };
        }

        var stats = await _dashboardStatisticsService.GetCoachStatisticsAsync(context.UserId, cancellationToken);
        return new AiToolResult
        {
            Intent = AiIntents.CoachDashboard,
            Success = true,
            Data = stats
        };
    }

    private async Task<List<object>> FindAvailableCourtsAsync(
        AiPlan plan,
        Guid? sportId,
        List<Guid> venueIds,
        CancellationToken cancellationToken)
    {
        var date = ParseDate(plan.Parameters.Date) ?? VenueTimeHelper.GetToday();
        var start = ParseTime(plan.Parameters.StartTime);
        var end = ParseTime(plan.Parameters.EndTime);
        var results = new List<object>();

        foreach (var venueId in venueIds.Take(MaxVenuesToScan))
        {
            var courts = await _courtService.GetPublicCourtsByVenueIdAsync(venueId, cancellationToken);
            if (sportId.HasValue)
                courts = courts.Where(c => c.SportId == sportId.Value).ToList();

            foreach (var court in courts.Take(MaxCourtsPerVenue))
            {
                var availability = await _availabilityService.GetAvailabilityAsync(court.Id, date, cancellationToken);

                IEnumerable<AvailabilitySlotDto> slots = availability.Slots.Where(s => s.Status == "AVAILABLE");
                if (start.HasValue && end.HasValue)
                {
                    var matching = FindMatchingSlots(availability, start.Value, end.Value);
                    if (matching.Count == 0 || matching.Any(s => s.Status != "AVAILABLE"))
                        continue;
                    slots = matching;
                }

                var price = slots.Where(s => s.Price.HasValue).Sum(s => s.Price!.Value);
                if (plan.Parameters.MaxPrice.HasValue && price > plan.Parameters.MaxPrice.Value)
                    continue;

                results.Add(new
                {
                    courtId = court.Id,
                    courtName = court.Name,
                    venueName = court.VenueName,
                    venueDistrict = court.VenueDistrict,
                    date = date.ToString("yyyy-MM-dd"),
                    startTime = start?.ToString("HH:mm"),
                    endTime = end?.ToString("HH:mm"),
                    estimatedPrice = price,
                    availableSlots = slots.Take(4).Select(s => new { s.StartTime, s.EndTime, s.Price })
                });

                if (results.Count >= 8)
                    return results;
            }
        }

        return results;
    }

    private async Task<Guid?> ResolveSportIdAsync(string? sportName, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sportName))
            return null;

        var sports = await _sportService.GetActiveSportsAsync(cancellationToken);
        var key = LocationHelper.NormalizeKey(sportName);

        foreach (var sport in sports)
        {
            var nameKey = LocationHelper.NormalizeKey(sport.Name);
            if (nameKey.Contains(key) || key.Contains(nameKey))
                return sport.Id;
        }

        if (key.Contains("cau long") || key.Contains("badminton"))
            return sports.FirstOrDefault(s => LocationHelper.NormalizeKey(s.Name).Contains("cau long"))?.Id;
        if (key.Contains("pickleball"))
            return sports.FirstOrDefault(s => LocationHelper.NormalizeKey(s.Name).Contains("pickleball"))?.Id;
        if (key.Contains("bong ban") || key.Contains("table tennis"))
            return sports.FirstOrDefault(s => LocationHelper.NormalizeKey(s.Name).Contains("bong ban"))?.Id;

        return null;
    }

    private async Task<Guid?> ResolveVenueIdByNameAsync(string name, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(name))
            return null;

        var venues = await _venueService.GetActiveVenuesAsync(null, null, null, name, cancellationToken);
        var match = venues.FirstOrDefault(v =>
            LocationHelper.NormalizeKey(v.Name).Contains(LocationHelper.NormalizeKey(name)) ||
            LocationHelper.NormalizeKey(name).Contains(LocationHelper.NormalizeKey(v.Name)));

        return match?.Id ?? venues.FirstOrDefault()?.Id;
    }

    private static List<AvailabilitySlotDto> FindMatchingSlots(
        CourtAvailabilityResponseDto availability,
        TimeOnly start,
        TimeOnly end)
    {
        var result = new List<AvailabilitySlotDto>();
        foreach (var slot in availability.Slots)
        {
            if (!TimeOnly.TryParse(slot.StartTime, out var slotStart))
                continue;
            if (slotStart >= start && slotStart < end)
                result.Add(slot);
        }

        return result;
    }

    private static DateOnly? ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (DateOnly.TryParse(value, out var iso))
            return iso;

        var formats = new[] { "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy" };
        foreach (var fmt in formats)
        {
            if (DateOnly.TryParseExact(value, fmt, out var parsed))
                return parsed;
        }

        return null;
    }

    private static TimeOnly? ParseTime(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (TimeOnly.TryParse(value, out var t))
            return t;

        if (value.Contains('h'))
        {
            var normalized = value.Replace('h', ':');
            if (TimeOnly.TryParse(normalized, out var t2))
                return t2;
        }

        return null;
    }
}
