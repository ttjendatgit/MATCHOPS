using System.Text.Json;
using MATCHOP.API.DTOs.Dashboard;

namespace MATCHOP.API.Services;

public interface IGroqAnalyticsService
{
    Task<DashboardAiSummaryDto> AnalyzeAsync(string audience, object statistics, CancellationToken cancellationToken = default);
}

public class GroqAnalyticsService : IGroqAnalyticsService
{
    private readonly IGroqService _groqService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GroqAnalyticsService> _logger;

    public GroqAnalyticsService(IGroqService groqService, IConfiguration configuration, ILogger<GroqAnalyticsService> logger)
    {
        _groqService = groqService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<DashboardAiSummaryDto> AnalyzeAsync(string audience, object statistics, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Groq:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Groq API key is missing.");
        }

        var statsJson = JsonSerializer.Serialize(statistics, new JsonSerializerOptions
        {
            WriteIndented = true
        });

        var messages = new List<GroqMessage>
        {
            new()
            {
                role = "system",
                content = """
                    You are a senior business analytics expert for a sports booking and matchmaking platform.
                    You analyze KPI snapshots and return strict JSON only.
                    Do not return markdown.
                    Do not wrap the JSON in code fences.
                    Keep the response concise, specific, and action oriented.
                    """
            },
            new()
            {
                role = "user",
                content = $$"""
                    Analyze the following {audience} dashboard statistics for MATCHOPS.

                    Statistics:
                    {statsJson}

                    Return strict JSON with this shape:
                    {
                      "summary": "short executive summary",
                      "insights": ["...", "...", "..."],
                      "recommendations": ["...", "...", "..."],
                      "risks": ["...", "..."],
                      "opportunities": ["...", "..."],
                      "forecast": {
                        "metric1": "value",
                        "metric2": "value"
                      }
                    }

                    Requirements:
                    - Explain why growth increased or decreased when possible.
                    - Mention operational risks and commercial opportunities.
                    - Tailor advice to the {audience} audience.
                    - Use plain English.
                    - Keep each list item under 25 words.
                    """
            }
        };

        var content = await _groqService.GetChatCompletionAsync(messages, cancellationToken);
        var json = ExtractJson(content);
        var parsed = JsonSerializer.Deserialize<GroqDashboardAiResponse>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? throw new InvalidOperationException("Groq returned an empty analytics response.");

        return new DashboardAiSummaryDto
        {
            Summary = parsed.Summary?.Trim() ?? "No summary generated.",
            Insights = NormalizeList(parsed.Insights),
            Recommendations = NormalizeList(parsed.Recommendations),
            Risks = NormalizeList(parsed.Risks),
            Opportunities = NormalizeList(parsed.Opportunities),
            Forecast = parsed.Forecast?
                .Select(kvp => new ForecastMetricDto
                {
                    Label = kvp.Key,
                    Value = kvp.Value.ValueKind == JsonValueKind.String ? kvp.Value.GetString() ?? string.Empty : kvp.Value.ToString()
                })
                .Where(x => !string.IsNullOrWhiteSpace(x.Value))
                .ToList() ?? [],
            GeneratedAt = DateTime.UtcNow,
            IsFallback = false
        };
    }

    private static string ExtractJson(string content)
    {
        var cleaned = content.Trim();
        if (cleaned.StartsWith("```"))
        {
            var firstBrace = cleaned.IndexOf('{');
            var lastBrace = cleaned.LastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace)
            {
                return cleaned[firstBrace..(lastBrace + 1)];
            }
        }

        return cleaned;
    }

    private static List<string> NormalizeList(List<string>? items) =>
        items?
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct()
            .Take(6)
            .ToList() ?? [];
}

public interface IAIAnalyticsService
{
    Task<DashboardAiSummaryDto> GetAdminAiSummaryAsync(CancellationToken cancellationToken = default);
    Task<DashboardAiSummaryDto> GetOwnerAiSummaryAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task<DashboardAiSummaryDto> GetUserAiSummaryAsync(Guid userId, CancellationToken cancellationToken = default);
}

public class AIAnalyticsService : IAIAnalyticsService
{
    private readonly IDashboardStatisticsService _dashboardStatisticsService;
    private readonly IGroqAnalyticsService _groqAnalyticsService;
    private readonly ILogger<AIAnalyticsService> _logger;

    public AIAnalyticsService(
        IDashboardStatisticsService dashboardStatisticsService,
        IGroqAnalyticsService groqAnalyticsService,
        ILogger<AIAnalyticsService> logger)
    {
        _dashboardStatisticsService = dashboardStatisticsService;
        _groqAnalyticsService = groqAnalyticsService;
        _logger = logger;
    }

    public async Task<DashboardAiSummaryDto> GetAdminAiSummaryAsync(CancellationToken cancellationToken = default)
    {
        var statistics = await _dashboardStatisticsService.GetAdminStatisticsAsync(cancellationToken);
        return await AnalyzeWithFallbackAsync(
            "admin",
            statistics,
            () => BuildAdminFallback(statistics),
            cancellationToken);
    }

    public async Task<DashboardAiSummaryDto> GetOwnerAiSummaryAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        var statistics = await _dashboardStatisticsService.GetOwnerStatisticsAsync(ownerId, cancellationToken);
        return await AnalyzeWithFallbackAsync(
            "venue owner",
            statistics,
            () => BuildOwnerFallback(statistics),
            cancellationToken);
    }

    public async Task<DashboardAiSummaryDto> GetUserAiSummaryAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var statistics = await _dashboardStatisticsService.GetUserStatisticsAsync(userId, cancellationToken);
        return await AnalyzeWithFallbackAsync(
            "end user",
            statistics,
            () => BuildUserFallback(statistics),
            cancellationToken);
    }

    private async Task<DashboardAiSummaryDto> AnalyzeWithFallbackAsync(
        string audience,
        object statistics,
        Func<DashboardAiSummaryDto> fallbackFactory,
        CancellationToken cancellationToken)
    {
        try
        {
            return await _groqAnalyticsService.AnalyzeAsync(audience, statistics, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Groq analytics failed for {Audience}. Falling back to deterministic insights.", audience);
            return fallbackFactory();
        }
    }

    private static DashboardAiSummaryDto BuildAdminFallback(DashboardAdminStatisticsDto statistics)
    {
        var topSport = statistics.MostPopularSports.FirstOrDefault()?.Label ?? "N/A";
        var weakestVenue = statistics.TopPerformingVenues
            .OrderByDescending(v => v.CancellationRate)
            .ThenBy(v => v.Revenue)
            .FirstOrDefault()?.VenueName ?? "N/A";

        return new DashboardAiSummaryDto
        {
            Summary = $"The platform has {statistics.TotalUsers} users, {statistics.TotalBookings} bookings, and {statistics.TotalRevenue:0} revenue captured so far.",
            Insights =
            [
                $"Booking growth rate is {statistics.BookingGrowthRate:0.##}% this month.",
                $"{topSport} is currently the strongest demand driver.",
                $"User retention is {statistics.UserRetentionRate:0.##}% based on repeat booking behavior."
            ],
            Recommendations =
            [
                "Increase campaign spend around the top-performing sports and booking hours.",
                "Review onboarding and reactivation journeys to lift repeat bookings.",
                "Promote high-converting venues more aggressively in discovery surfaces."
            ],
            Risks =
            [
                $"Cancellation rate is {statistics.CancellationRate:0.##}%, which can erode trust if it keeps rising.",
                $"{weakestVenue} needs attention because it is underperforming or cancelling more often."
            ],
            Opportunities =
            [
                "Bundle promotions around peak demand windows to maximize conversion.",
                "Use venue review data to prioritize quality improvements and moderation."
            ],
            Forecast =
            [
                new ForecastMetricDto { Label = "nextMonthBookings", Value = Math.Round(statistics.TotalBookings * 1.08m, 0).ToString("0") },
                new ForecastMetricDto { Label = "expectedRevenue", Value = Math.Round(statistics.TotalRevenue * 1.1m, 0).ToString("0") }
            ],
            IsFallback = true,
            GeneratedAt = DateTime.UtcNow
        };
    }

    private static DashboardAiSummaryDto BuildOwnerFallback(DashboardOwnerStatisticsDto statistics)
    {
        var topCourt = statistics.MostPopularCourts.FirstOrDefault()?.CourtName ?? "N/A";
        var topHour = statistics.PeakHours.OrderByDescending(x => x.Count).FirstOrDefault()?.Label ?? "N/A";

        return new DashboardAiSummaryDto
        {
            Summary = $"Your venues generated {statistics.RevenueThisMonth:0} this month across {statistics.TotalBookings} bookings, with court utilization at {statistics.CourtUtilizationRate:0.##}%.",
            Insights =
            [
                $"{topCourt} is your most demanded court right now.",
                $"{topHour} is the strongest booking hour and supports premium pricing.",
                $"Returning customers currently account for {statistics.ReturningCustomers} repeat bookers."
            ],
            Recommendations =
            [
                "Increase price slightly during the top demand hours and monitor conversion.",
                "Launch low-demand promotions for weak time slots to improve utilization.",
                "Review maintenance scheduling around low-demand windows to reduce revenue impact."
            ],
            Risks =
            [
                $"Cancellation rate is {statistics.CancellationStatistics.CancellationRate:0.##}%, which may affect customer confidence.",
                "Low court utilization means fixed operating costs can dilute margin."
            ],
            Opportunities =
            [
                "Promote the best-rated venue as a premium destination.",
                "Create loyalty offers for repeat bookers to improve monthly revenue stability."
            ],
            Forecast = statistics.RevenueForecast,
            IsFallback = true,
            GeneratedAt = DateTime.UtcNow
        };
    }

    private static DashboardAiSummaryDto BuildUserFallback(DashboardUserStatisticsDto statistics)
    {
        var favoriteSport = statistics.FavoriteSports.FirstOrDefault()?.Label ?? "N/A";
        var favoriteVenue = statistics.FavoriteVenues.FirstOrDefault()?.Label ?? "N/A";

        return new DashboardAiSummaryDto
        {
            Summary = $"You have made {statistics.TotalBookings} bookings, spend {statistics.SpendingStatistics.TotalSpent:0} in total, and average {statistics.PlayingFrequencyPerMonth:0.##} sessions per month.",
            Insights =
            [
                $"{favoriteSport} is your top played sport.",
                $"{favoriteVenue} appears to be your preferred venue.",
                $"You currently have {statistics.UnreadNotifications} unread notifications."
            ],
            Recommendations =
            [
                "Book your most frequent hours earlier to secure preferred courts.",
                "Revisit favorite venues with strong consistency and lower cancellation risk.",
                "Use matchmaking more often to turn open sessions into social play."
            ],
            Risks =
            [
                "Irregular activity can make it harder to build consistent training habits.",
                "Late booking behavior may reduce court choice during peak periods."
            ],
            Opportunities =
            [
                "Join more match rooms aligned with your favorite sport to meet partners.",
                "Bundle bookings into a routine schedule to optimize spend and availability."
            ],
            Forecast =
            [
                new ForecastMetricDto { Label = "nextMonthBookings", Value = Math.Max(1, Math.Round(statistics.PlayingFrequencyPerMonth, 0)).ToString("0") },
                new ForecastMetricDto { Label = "expectedSpending", Value = Math.Round(statistics.SpendingStatistics.AverageSpend * Math.Max(1, statistics.PlayingFrequencyPerMonth), 0).ToString("0") }
            ],
            IsFallback = true,
            GeneratedAt = DateTime.UtcNow
        };
    }
}
