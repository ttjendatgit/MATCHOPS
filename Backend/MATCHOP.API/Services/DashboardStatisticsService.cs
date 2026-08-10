using MATCHOP.API.DTOs.Dashboard;
using MATCHOP.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public interface IDashboardStatisticsService
{
    Task<DashboardAdminStatisticsDto> GetAdminStatisticsAsync(CancellationToken cancellationToken = default);
    Task<DashboardOwnerStatisticsDto> GetOwnerStatisticsAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task<DashboardUserStatisticsDto> GetUserStatisticsAsync(Guid userId, CancellationToken cancellationToken = default);
}

public class DashboardStatisticsService : IDashboardStatisticsService
{
    private readonly ApplicationDbContext _dbContext;

    public DashboardStatisticsService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DashboardAdminStatisticsDto> GetAdminStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentMonthStart = new DateOnly(today.Year, today.Month, 1);
        var previousMonthStart = currentMonthStart.AddMonths(-1);
        var previousMonthEnd = currentMonthStart.AddDays(-1);
        var monthBuckets = GetMonthBuckets(today, 6);

        var totalUsers = await _dbContext.Users.AsNoTracking().CountAsync(cancellationToken);
        var totalVenues = await _dbContext.Venues.AsNoTracking().CountAsync(cancellationToken);
        var totalReviews = await _dbContext.Reviews.AsNoTracking().CountAsync(cancellationToken);
        var totalNotifications = await _dbContext.Notifications.AsNoTracking().CountAsync(cancellationToken);
        var bookings = await _dbContext.Bookings
            .AsNoTracking()
            .Select(b => new
            {
                b.Id,
                b.UserId,
                b.BookingDate,
                b.StartTime,
                b.TotalPrice,
                b.Status,
                SportName = b.Sport.Name,
                VenueId = b.VenueId,
                VenueName = b.Venue.Name
            })
            .ToListAsync(cancellationToken);
        var reviewsByVenue = await _dbContext.Reviews
            .AsNoTracking()
            .Select(r => new { r.VenueId, r.Rating })
            .ToListAsync(cancellationToken);

        var completedBookings = bookings.Where(IsRevenueBooking).ToList();
        var totalRevenue = completedBookings.Sum(x => x.TotalPrice);
        var cancelledBookings = bookings.Count(IsCancelledBooking);
        var totalBookings = bookings.Count;
        var currentMonthBookings = bookings.Count(b => b.BookingDate >= currentMonthStart);
        var previousMonthBookings = bookings.Count(b => b.BookingDate >= previousMonthStart && b.BookingDate <= previousMonthEnd);

        var reviewLookup = reviewsByVenue
            .GroupBy(x => x.VenueId)
            .ToDictionary(
                g => g.Key,
                g => g.Any() ? (decimal)Math.Round(g.Average(x => x.Rating), 2) : 0m);

        return new DashboardAdminStatisticsDto
        {
            TotalUsers = totalUsers,
            TotalVenues = totalVenues,
            TotalBookings = totalBookings,
            TotalRevenue = totalRevenue,
            MonthlyRevenue = monthBuckets
                .Select(bucket => new DashboardSeriesPointDto
                {
                    Label = bucket.ToString("MM/yyyy"),
                    Value = completedBookings
                        .Where(b => b.BookingDate.Year == bucket.Year && b.BookingDate.Month == bucket.Month)
                        .Sum(b => b.TotalPrice)
                })
                .ToList(),
            BookingTrend = monthBuckets
                .Select(bucket => new DashboardSeriesPointDto
                {
                    Label = bucket.ToString("MM/yyyy"),
                    Value = bookings.Count(b => b.BookingDate.Year == bucket.Year && b.BookingDate.Month == bucket.Month)
                })
                .ToList(),
            MostPopularSports = bookings
                .GroupBy(b => b.SportName)
                .Select(g => new DashboardBreakdownItemDto
                {
                    Label = g.Key,
                    Count = g.Count(),
                    Value = g.Sum(x => x.TotalPrice)
                })
                .OrderByDescending(x => x.Count)
                .ThenByDescending(x => x.Value)
                .Take(5)
                .ToList(),
            PeakBookingHours = Enumerable.Range(0, 24)
                .Select(hour => new DashboardCountPointDto
                {
                    Label = $"{hour:00}:00",
                    Count = bookings.Count(b => b.StartTime.Hour == hour)
                })
                .Where(x => x.Count > 0)
                .OrderByDescending(x => x.Count)
                .Take(6)
                .OrderBy(x => x.Label)
                .ToList(),
            BookingGrowthRate = CalculateGrowthRate(currentMonthBookings, previousMonthBookings),
            TopPerformingVenues = bookings
                .GroupBy(b => new { b.VenueId, b.VenueName })
                .Select(g => new VenuePerformanceDto
                {
                    VenueId = g.Key.VenueId,
                    VenueName = g.Key.VenueName,
                    BookingCount = g.Count(),
                    Revenue = g.Where(IsRevenueBooking).Sum(x => x.TotalPrice),
                    CancellationRate = SafePercentage(g.Count(IsCancelledBooking), g.Count()),
                    AverageRating = reviewLookup.TryGetValue(g.Key.VenueId, out var rating) ? rating : 0m
                })
                .OrderByDescending(x => x.Revenue)
                .ThenByDescending(x => x.BookingCount)
                .Take(5)
                .ToList(),
            CancellationRate = SafePercentage(cancelledBookings, totalBookings),
            UserRetentionRate = CalculateUserRetentionRate(bookings.Select(b => b.UserId).Where(x => x.HasValue).Select(x => x!.Value)),
            TotalReviews = totalReviews,
            TotalNotifications = totalNotifications
        };
    }

    public async Task<DashboardOwnerStatisticsDto> GetOwnerStatisticsAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        var todayUtc = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(todayUtc);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var chartDates = Enumerable.Range(0, 14).Select(offset => today.AddDays(-(13 - offset))).ToList();

        var venues = await _dbContext.Venues
            .AsNoTracking()
            .Where(v => v.OwnerId == ownerId)
            .Select(v => new
            {
                v.Id,
                v.Name,
                v.Status,
                v.OpeningTime,
                v.ClosingTime
            })
            .ToListAsync(cancellationToken);
        var courts = await _dbContext.Courts
            .AsNoTracking()
            .Where(c => c.Venue.OwnerId == ownerId)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Status,
                c.VenueId,
                VenueName = c.Venue.Name
            })
            .ToListAsync(cancellationToken);
        var bookings = await _dbContext.Bookings
            .AsNoTracking()
            .Where(b => b.Venue.OwnerId == ownerId)
            .Select(b => new
            {
                b.Id,
                b.UserId,
                b.BookingDate,
                b.StartTime,
                b.EndTime,
                b.TotalPrice,
                b.Status,
                b.VenueId,
                VenueName = b.Venue.Name,
                b.CourtId,
                CourtName = b.Court.Name,
                SportName = b.Sport.Name
            })
            .ToListAsync(cancellationToken);
        var reviews = await _dbContext.Reviews
            .AsNoTracking()
            .Where(r => r.Venue.OwnerId == ownerId)
            .Select(r => new
            {
                r.VenueId,
                VenueName = r.Venue.Name,
                r.Rating
            })
            .ToListAsync(cancellationToken);

        var revenueBookings = bookings.Where(IsRevenueBooking).ToList();

        var elapsedDays = Math.Max(1, today.Day);
        var totalAvailableHours = venues
            .Where(v => v.Status == VenueStatus.ACTIVE)
            .Sum(venue =>
            {
                var venueCourtCount = courts.Count(c => c.VenueId == venue.Id && c.Status == CourtStatus.ACTIVE);
                var openHours = Math.Max(0, (decimal)(venue.ClosingTime - venue.OpeningTime).TotalHours);
                return venueCourtCount * openHours * elapsedDays;
            });
        var bookedHoursThisMonth = revenueBookings
            .Where(b => b.BookingDate >= monthStart)
            .Sum(b => Math.Max(0, (decimal)(b.EndTime - b.StartTime).TotalHours));

        var cancellationCount = bookings.Count(IsCancelledBooking);
        var nextMonthDate = today.AddMonths(1);
        var nextMonthName = nextMonthDate.ToString("MM/yyyy");
        var currentMonthRevenue = revenueBookings.Where(b => b.BookingDate >= monthStart).Sum(b => b.TotalPrice);
        var currentMonthBookings = bookings.Count(b => b.BookingDate >= monthStart);
        var dailyRevenueAverage = elapsedDays == 0 ? 0 : currentMonthRevenue / elapsedDays;
        var dailyBookingAverage = elapsedDays == 0 ? 0 : (decimal)currentMonthBookings / elapsedDays;
        var daysInNextMonth = DateTime.DaysInMonth(nextMonthDate.Year, nextMonthDate.Month);

        var reviewLookup = reviews
            .GroupBy(x => x.VenueId)
            .ToDictionary(
                g => g.Key,
                g => g.Any() ? (decimal)Math.Round(g.Average(x => x.Rating), 2) : 0m);

        return new DashboardOwnerStatisticsDto
        {
            RevenueToday = revenueBookings.Where(b => b.BookingDate == today).Sum(b => b.TotalPrice),
            RevenueThisMonth = currentMonthRevenue,
            TotalBookings = bookings.Count,
            CourtUtilizationRate = SafePercentage(bookedHoursThisMonth, totalAvailableHours),
            MostPopularCourts = bookings
                .GroupBy(b => new { b.CourtId, b.CourtName })
                .Select(g => new CourtPerformanceDto
                {
                    CourtId = g.Key.CourtId,
                    CourtName = g.Key.CourtName,
                    BookingCount = g.Count(),
                    Revenue = g.Where(IsRevenueBooking).Sum(x => x.TotalPrice)
                })
                .OrderByDescending(x => x.BookingCount)
                .ThenByDescending(x => x.Revenue)
                .Take(5)
                .ToList(),
            PeakHours = Enumerable.Range(0, 24)
                .Select(hour => new DashboardCountPointDto
                {
                    Label = $"{hour:00}:00",
                    Count = bookings.Count(b => b.StartTime.Hour == hour)
                })
                .Where(x => x.Count > 0)
                .OrderByDescending(x => x.Count)
                .Take(6)
                .OrderBy(x => x.Label)
                .ToList(),
            CancellationStatistics = new DashboardCancellationStatsDto
            {
                CancelledBookings = cancellationCount,
                TotalBookings = bookings.Count,
                CancellationRate = SafePercentage(cancellationCount, bookings.Count)
            },
            ReturningCustomers = bookings
                .Where(b => b.UserId.HasValue)
                .GroupBy(b => b.UserId!.Value)
                .Count(g => g.Count() >= 2),
            RevenueForecast =
            [
                new ForecastMetricDto { Label = "Expected Revenue Next Month", Value = Math.Round(dailyRevenueAverage * daysInNextMonth, 0).ToString("0") },
                new ForecastMetricDto { Label = "Expected Bookings Next Month", Value = Math.Round(dailyBookingAverage * daysInNextMonth, 0).ToString("0") },
                new ForecastMetricDto { Label = "Forecast Period", Value = nextMonthName }
            ],
            RevenueTrend = chartDates
                .Select(date => new DashboardSeriesPointDto
                {
                    Label = date.ToString("dd/MM"),
                    Value = revenueBookings.Where(b => b.BookingDate == date).Sum(b => b.TotalPrice)
                })
                .ToList(),
            BookingTrend = chartDates
                .Select(date => new DashboardSeriesPointDto
                {
                    Label = date.ToString("dd/MM"),
                    Value = bookings.Count(b => b.BookingDate == date)
                })
                .ToList(),
            SportDistribution = bookings
                .GroupBy(b => b.SportName)
                .Select(g => new DashboardBreakdownItemDto
                {
                    Label = g.Key,
                    Count = g.Count(),
                    Value = g.Where(IsRevenueBooking).Sum(x => x.TotalPrice)
                })
                .OrderByDescending(x => x.Count)
                .Take(5)
                .ToList(),
            VenuePerformance = bookings
                .GroupBy(b => new { b.VenueId, b.VenueName })
                .Select(g => new VenuePerformanceDto
                {
                    VenueId = g.Key.VenueId,
                    VenueName = g.Key.VenueName,
                    BookingCount = g.Count(),
                    Revenue = g.Where(IsRevenueBooking).Sum(x => x.TotalPrice),
                    CancellationRate = SafePercentage(g.Count(IsCancelledBooking), g.Count()),
                    AverageRating = reviewLookup.TryGetValue(g.Key.VenueId, out var rating) ? rating : 0m
                })
                .OrderByDescending(x => x.Revenue)
                .ThenByDescending(x => x.BookingCount)
                .Take(5)
                .ToList(),
            TotalReviews = reviews.Count,
            AverageRating = reviews.Count == 0 ? 0 : (decimal)Math.Round(reviews.Average(r => r.Rating), 2)
        };
    }

    public async Task<DashboardUserStatisticsDto> GetUserStatisticsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthBuckets = GetMonthBuckets(today, 6);
        var monthStart = new DateOnly(today.Year, today.Month, 1);

        var bookings = await _dbContext.Bookings
            .AsNoTracking()
            .Where(b => b.UserId == userId)
            .Select(b => new
            {
                b.Id,
                b.BookingDate,
                b.StartTime,
                b.TotalPrice,
                b.Status,
                SportName = b.Sport.Name,
                VenueName = b.Venue.Name
            })
            .ToListAsync(cancellationToken);
        var matchPosts = await _dbContext.MatchPosts
            .AsNoTracking()
            .Where(p => p.CreatorId == userId)
            .Select(p => new { p.Status })
            .ToListAsync(cancellationToken);
        var joinedRoomsCount = await _dbContext.MatchRoomPlayers
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .CountAsync(cancellationToken);
        var notifications = await _dbContext.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .Select(n => new { n.IsRead, n.Type })
            .ToListAsync(cancellationToken);
        var reviews = await _dbContext.Reviews
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .Select(r => r.Rating)
            .ToListAsync(cancellationToken);

        var paidBookings = bookings.Where(IsRevenueBooking).ToList();
        var activeMonths = Math.Max(1, bookings
            .Select(b => $"{b.BookingDate.Year}-{b.BookingDate.Month}")
            .Distinct()
            .Count());

        return new DashboardUserStatisticsDto
        {
            TotalBookings = bookings.Count,
            FavoriteSports = bookings
                .GroupBy(b => b.SportName)
                .Select(g => new DashboardBreakdownItemDto
                {
                    Label = g.Key,
                    Count = g.Count(),
                    Value = g.Where(IsRevenueBooking).Sum(x => x.TotalPrice)
                })
                .OrderByDescending(x => x.Count)
                .Take(5)
                .ToList(),
            FavoriteVenues = bookings
                .GroupBy(b => b.VenueName)
                .Select(g => new DashboardBreakdownItemDto
                {
                    Label = g.Key,
                    Count = g.Count(),
                    Value = g.Where(IsRevenueBooking).Sum(x => x.TotalPrice)
                })
                .OrderByDescending(x => x.Count)
                .Take(5)
                .ToList(),
            MonthlyActivity = monthBuckets
                .Select(bucket => new DashboardSeriesPointDto
                {
                    Label = bucket.ToString("MM/yyyy"),
                    Value = bookings.Count(b => b.BookingDate.Year == bucket.Year && b.BookingDate.Month == bucket.Month)
                })
                .ToList(),
            PreferredHours = Enumerable.Range(0, 24)
                .Select(hour => new DashboardCountPointDto
                {
                    Label = $"{hour:00}:00",
                    Count = bookings.Count(b => b.StartTime.Hour == hour)
                })
                .Where(x => x.Count > 0)
                .OrderByDescending(x => x.Count)
                .Take(6)
                .OrderBy(x => x.Label)
                .ToList(),
            PlayingFrequencyPerMonth = Math.Round((decimal)bookings.Count / activeMonths, 2),
            SpendingStatistics = new SpendingStatisticsDto
            {
                TotalSpent = paidBookings.Sum(b => b.TotalPrice),
                AverageSpend = paidBookings.Count == 0 ? 0 : Math.Round(paidBookings.Average(b => b.TotalPrice), 2),
                ThisMonthSpent = paidBookings.Where(b => b.BookingDate >= monthStart).Sum(b => b.TotalPrice)
            },
            MatchmakingStatistics = new MatchmakingStatisticsDto
            {
                TotalMatchPosts = matchPosts.Count,
                OpenMatchPosts = matchPosts.Count(p => p.Status == MatchPostStatus.OPEN),
                JoinedMatchRooms = joinedRoomsCount,
                MatchNotifications = notifications.Count(n => n.Type == NotificationType.MATCH_INVITATION || n.Type == NotificationType.MATCH_JOINED)
            },
            SpendingTrend = monthBuckets
                .Select(bucket => new DashboardSeriesPointDto
                {
                    Label = bucket.ToString("MM/yyyy"),
                    Value = paidBookings
                        .Where(b => b.BookingDate.Year == bucket.Year && b.BookingDate.Month == bucket.Month)
                        .Sum(b => b.TotalPrice)
                })
                .ToList(),
            UnreadNotifications = notifications.Count(n => !n.IsRead),
            AverageReviewRating = reviews.Count == 0 ? 0 : Math.Round((decimal)reviews.Average(), 2)
        };
    }

    private static bool IsRevenueBooking(dynamic booking) =>
        booking.Status == BookingStatus.CONFIRMED || booking.Status == BookingStatus.COMPLETED;

    private static bool IsCancelledBooking(dynamic booking) =>
        booking.Status == BookingStatus.CANCELLED_BY_OWNER || booking.Status == BookingStatus.CANCELLED_BY_USER;

    private static List<DateOnly> GetMonthBuckets(DateOnly anchorDate, int months)
    {
        var list = new List<DateOnly>(months);
        var start = new DateOnly(anchorDate.Year, anchorDate.Month, 1).AddMonths(-(months - 1));
        for (var i = 0; i < months; i++)
        {
            list.Add(start.AddMonths(i));
        }

        return list;
    }

    private static decimal SafePercentage(decimal numerator, decimal denominator)
    {
        if (denominator <= 0)
        {
            return 0;
        }

        return Math.Round((numerator / denominator) * 100m, 2);
    }

    private static decimal CalculateGrowthRate(int current, int previous)
    {
        if (previous <= 0)
        {
            return current > 0 ? 100 : 0;
        }

        return Math.Round(((current - previous) / (decimal)previous) * 100m, 2);
    }

    private static decimal CalculateUserRetentionRate(IEnumerable<Guid> userIds)
    {
        var grouped = userIds.GroupBy(x => x).ToList();
        if (grouped.Count == 0)
        {
            return 0;
        }

        return SafePercentage(grouped.Count(g => g.Count() >= 2), grouped.Count);
    }
}
