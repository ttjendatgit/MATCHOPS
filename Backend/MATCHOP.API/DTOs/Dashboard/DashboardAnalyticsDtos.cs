using System.Text.Json;
using System.Text.Json.Serialization;

namespace MATCHOP.API.DTOs.Dashboard;

public class DashboardSeriesPointDto
{
    public string Label { get; set; } = string.Empty;
    public decimal Value { get; set; }
}

public class DashboardCountPointDto
{
    public string Label { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class DashboardBreakdownItemDto
{
    public string Label { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Value { get; set; }
}

public class ForecastMetricDto
{
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class DashboardAiSummaryDto
{
    public string Summary { get; set; } = string.Empty;
    public List<string> Insights { get; set; } = [];
    public List<string> Recommendations { get; set; } = [];
    public List<string> Risks { get; set; } = [];
    public List<string> Opportunities { get; set; } = [];
    public List<ForecastMetricDto> Forecast { get; set; } = [];
    public bool IsFallback { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class VenuePerformanceDto
{
    public Guid VenueId { get; set; }
    public string VenueName { get; set; } = string.Empty;
    public int BookingCount { get; set; }
    public decimal Revenue { get; set; }
    public decimal CancellationRate { get; set; }
    public decimal AverageRating { get; set; }
}

public class CourtPerformanceDto
{
    public Guid CourtId { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public int BookingCount { get; set; }
    public decimal Revenue { get; set; }
}

public class DashboardCancellationStatsDto
{
    public int CancelledBookings { get; set; }
    public int TotalBookings { get; set; }
    public decimal CancellationRate { get; set; }
}

public class SpendingStatisticsDto
{
    public decimal TotalSpent { get; set; }
    public decimal AverageSpend { get; set; }
    public decimal ThisMonthSpent { get; set; }
}

public class MatchmakingStatisticsDto
{
    public int TotalMatchPosts { get; set; }
    public int OpenMatchPosts { get; set; }
    public int JoinedMatchRooms { get; set; }
    public int MatchNotifications { get; set; }
}

public class DashboardAdminStatisticsDto
{
    public int TotalUsers { get; set; }
    public int TotalVenues { get; set; }
    public int TotalBookings { get; set; }
    public decimal TotalRevenue { get; set; }
    public List<DashboardSeriesPointDto> MonthlyRevenue { get; set; } = [];
    public List<DashboardSeriesPointDto> BookingTrend { get; set; } = [];
    public List<DashboardBreakdownItemDto> MostPopularSports { get; set; } = [];
    public List<DashboardCountPointDto> PeakBookingHours { get; set; } = [];
    public decimal BookingGrowthRate { get; set; }
    public List<VenuePerformanceDto> TopPerformingVenues { get; set; } = [];
    public decimal CancellationRate { get; set; }
    public decimal UserRetentionRate { get; set; }
    public int TotalReviews { get; set; }
    public int TotalNotifications { get; set; }
}

public class DashboardOwnerStatisticsDto
{
    public decimal RevenueToday { get; set; }
    public decimal RevenueThisMonth { get; set; }
    public int TotalBookings { get; set; }
    public decimal CourtUtilizationRate { get; set; }
    public List<CourtPerformanceDto> MostPopularCourts { get; set; } = [];
    public List<DashboardCountPointDto> PeakHours { get; set; } = [];
    public DashboardCancellationStatsDto CancellationStatistics { get; set; } = new();
    public int ReturningCustomers { get; set; }
    public List<ForecastMetricDto> RevenueForecast { get; set; } = [];
    public List<DashboardSeriesPointDto> RevenueTrend { get; set; } = [];
    public List<DashboardSeriesPointDto> BookingTrend { get; set; } = [];
    public List<DashboardBreakdownItemDto> SportDistribution { get; set; } = [];
    public List<VenuePerformanceDto> VenuePerformance { get; set; } = [];
    public int TotalReviews { get; set; }
    public decimal AverageRating { get; set; }
}

public class DashboardUserStatisticsDto
{
    public int TotalBookings { get; set; }
    public List<DashboardBreakdownItemDto> FavoriteSports { get; set; } = [];
    public List<DashboardBreakdownItemDto> FavoriteVenues { get; set; } = [];
    public List<DashboardSeriesPointDto> MonthlyActivity { get; set; } = [];
    public List<DashboardCountPointDto> PreferredHours { get; set; } = [];
    public decimal PlayingFrequencyPerMonth { get; set; }
    public SpendingStatisticsDto SpendingStatistics { get; set; } = new();
    public MatchmakingStatisticsDto MatchmakingStatistics { get; set; } = new();
    public List<DashboardSeriesPointDto> SpendingTrend { get; set; } = [];
    public int UnreadNotifications { get; set; }
    public decimal AverageReviewRating { get; set; }
}

public class DashboardCoachStatisticsDto
{
    public decimal RevenueToday { get; set; }
    public decimal RevenueThisMonth { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalSessions { get; set; }
    public int PaidSessions { get; set; }
    public int CompletedSessions { get; set; }
    public int PendingPaymentSessions { get; set; }
    public decimal AverageSessionRevenue { get; set; }
    public List<DashboardSeriesPointDto> RevenueTrend { get; set; } = [];
    public List<DashboardBreakdownItemDto> SportDistribution { get; set; } = [];
}

internal class GroqDashboardAiResponse
{
    [JsonPropertyName("summary")]
    public string? Summary { get; set; }

    [JsonPropertyName("insights")]
    public List<string>? Insights { get; set; }

    [JsonPropertyName("recommendations")]
    public List<string>? Recommendations { get; set; }

    [JsonPropertyName("risks")]
    public List<string>? Risks { get; set; }

    [JsonPropertyName("opportunities")]
    public List<string>? Opportunities { get; set; }

    [JsonPropertyName("forecast")]
    public Dictionary<string, JsonElement>? Forecast { get; set; }
}
