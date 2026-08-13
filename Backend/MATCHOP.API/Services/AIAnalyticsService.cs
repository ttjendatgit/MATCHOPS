using System.Text.Json;
using MATCHOP.API.DTOs.Dashboard;
using MATCHOP.API.Helpers;

namespace MATCHOP.API.Services;

public interface IGroqAnalyticsService
{
    Task<DashboardAiSummaryDto> AnalyzeAsync(string role, object statistics, CancellationToken cancellationToken = default);
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

    public async Task<DashboardAiSummaryDto> AnalyzeAsync(string role, object statistics, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Groq:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Groq API key is missing.");
        }

        var statsJson = JsonSerializer.Serialize(statistics, new JsonSerializerOptions { WriteIndented = true });

        var messages = new List<GroqMessage>
        {
            new() { role = "system", content = DashboardAiPrompts.SystemPrompt },
            new() { role = "user", content = DashboardAiPrompts.BuildUserMessage(role, statsJson) }
        };

        var content = await _groqService.GetChatCompletionAsync(messages, cancellationToken, maxTokens: 4096);
        var json = ExtractJson(content);
        var parsed = JsonSerializer.Deserialize<GroqDashboardAiResponse>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? throw new InvalidOperationException("Groq returned an empty analytics response.");

        var (riskItems, riskStrings) = ParseRisks(parsed.Risks);
        var actions = ParseActions(parsed.Actions);

        return new DashboardAiSummaryDto
        {
            FullReport = parsed.FullReport?.Trim() ?? string.Empty,
            Summary = parsed.Summary?.Trim() ?? "Không tạo được tóm tắt.",
            Insights = NormalizeList(parsed.Insights),
            Recommendations = NormalizeList(parsed.Recommendations),
            RiskItems = riskItems,
            Risks = riskStrings,
            Opportunities = NormalizeList(parsed.Opportunities),
            Actions = actions,
            Forecast = parsed.Forecast?
                .Select(kvp => new ForecastMetricDto
                {
                    Label = kvp.Key,
                    Value = kvp.Value.ValueKind == JsonValueKind.String
                        ? kvp.Value.GetString() ?? string.Empty
                        : kvp.Value.ToString()
                })
                .Where(x => !string.IsNullOrWhiteSpace(x.Value))
                .ToList() ?? [],
            GeneratedAt = DateTime.UtcNow,
            IsFallback = false
        };
    }

    private static (List<DashboardAiRiskItemDto> Items, List<string> Strings) ParseRisks(JsonElement? risksElement)
    {
        var items = new List<DashboardAiRiskItemDto>();
        var strings = new List<string>();

        if (risksElement is null || risksElement.Value.ValueKind == JsonValueKind.Null)
        {
            return (items, strings);
        }

        if (risksElement.Value.ValueKind == JsonValueKind.Array)
        {
            foreach (var element in risksElement.Value.EnumerateArray())
            {
                if (element.ValueKind == JsonValueKind.String)
                {
                    var text = element.GetString()?.Trim();
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        strings.Add(text);
                    }
                    continue;
                }

                var risk = element.Deserialize<GroqDashboardAiRiskResponse>(new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                if (risk is null) continue;

                var dto = new DashboardAiRiskItemDto
                {
                    Level = risk.Level?.Trim() ?? "MEDIUM",
                    Title = risk.Title?.Trim() ?? string.Empty,
                    Detail = risk.Detail?.Trim() ?? string.Empty,
                    Evidence = risk.Evidence?.Trim() ?? string.Empty,
                    Impact = risk.Impact?.Trim() ?? string.Empty,
                    SuggestedAction = risk.SuggestedAction?.Trim() ?? string.Empty
                };
                items.Add(dto);
                strings.Add(FormatRiskString(dto));
            }
        }

        return (items.Take(8).ToList(), strings.Take(8).ToList());
    }

    private static List<DashboardAiActionItemDto> ParseActions(List<GroqDashboardAiActionResponse>? actions) =>
        actions?
            .Where(a => !string.IsNullOrWhiteSpace(a.Action))
            .Select(a => new DashboardAiActionItemDto
            {
                Priority = a.Priority <= 0 ? 1 : a.Priority,
                Level = a.Level?.Trim() ?? "MEDIUM",
                Action = a.Action!.Trim(),
                Reason = a.Reason?.Trim() ?? string.Empty,
                ExpectedImpact = a.ExpectedImpact?.Trim() ?? string.Empty,
                Metric = a.Metric?.Trim() ?? string.Empty
            })
            .OrderBy(a => a.Priority)
            .Take(6)
            .ToList() ?? [];

    private static string FormatRiskString(DashboardAiRiskItemDto risk)
    {
        var parts = new List<string> { $"[{risk.Level}] {risk.Title}" };
        if (!string.IsNullOrWhiteSpace(risk.Detail)) parts.Add(risk.Detail);
        if (!string.IsNullOrWhiteSpace(risk.Evidence)) parts.Add($"Căn cứ: {risk.Evidence}");
        return string.Join(" — ", parts.Where(p => !string.IsNullOrWhiteSpace(p)));
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

        var start = cleaned.IndexOf('{');
        var end = cleaned.LastIndexOf('}');
        if (start >= 0 && end > start)
        {
            return cleaned[start..(end + 1)];
        }

        return cleaned;
    }

    private static List<string> NormalizeList(List<string>? items) =>
        items?
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct()
            .Take(8)
            .ToList() ?? [];
}

public interface IAIAnalyticsService
{
    Task<DashboardAiSummaryDto> GetAdminAiSummaryAsync(CancellationToken cancellationToken = default);
    Task<DashboardAiSummaryDto> GetOwnerAiSummaryAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task<DashboardAiSummaryDto> GetCoachAiSummaryAsync(Guid coachUserId, CancellationToken cancellationToken = default);
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
        return await AnalyzeWithFallbackAsync("ADMIN", statistics, () => BuildAdminFallback(statistics), cancellationToken);
    }

    public async Task<DashboardAiSummaryDto> GetOwnerAiSummaryAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        var statistics = await _dashboardStatisticsService.GetOwnerStatisticsAsync(ownerId, cancellationToken);
        return await AnalyzeWithFallbackAsync("OWNER", statistics, () => BuildOwnerFallback(statistics), cancellationToken);
    }

    public async Task<DashboardAiSummaryDto> GetCoachAiSummaryAsync(Guid coachUserId, CancellationToken cancellationToken = default)
    {
        var statistics = await _dashboardStatisticsService.GetCoachStatisticsAsync(coachUserId, cancellationToken);
        return await AnalyzeWithFallbackAsync("COACH", statistics, () => BuildCoachFallback(statistics), cancellationToken);
    }

    public async Task<DashboardAiSummaryDto> GetUserAiSummaryAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var statistics = await _dashboardStatisticsService.GetUserStatisticsAsync(userId, cancellationToken);
        return await AnalyzeWithFallbackAsync("USER", statistics, () => BuildUserFallback(statistics), cancellationToken);
    }

    private async Task<DashboardAiSummaryDto> AnalyzeWithFallbackAsync(
        string role,
        object statistics,
        Func<DashboardAiSummaryDto> fallbackFactory,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _groqAnalyticsService.AnalyzeAsync(role, statistics, cancellationToken);
            if (string.IsNullOrWhiteSpace(result.FullReport))
            {
                var fallback = fallbackFactory();
                result.FullReport = fallback.FullReport;
            }
            if (result.Risks.Count == 0 && result.RiskItems.Count > 0)
            {
                result.Risks = result.RiskItems.Select(r => $"[{r.Level}] {r.Title}: {r.Detail}").ToList();
            }
            if (result.Recommendations.Count == 0 && result.Actions.Count > 0)
            {
                result.Recommendations = result.Actions.Select(a => $"{a.Action} — {a.Reason}").ToList();
            }
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Groq analytics failed for role {Role}. Falling back to deterministic insights.", role);
            return fallbackFactory();
        }
    }

    private static DashboardAiSummaryDto BuildAdminFallback(DashboardAdminStatisticsDto s)
    {
        var topSport = s.MostPopularSports.FirstOrDefault();
        var topVenue = s.TopPerformingVenues.FirstOrDefault();
        var weakVenue = s.TopPerformingVenues.OrderByDescending(v => v.CancellationRate).FirstOrDefault();
        var peakHour = s.PeakBookingHours.OrderByDescending(x => x.Count).FirstOrDefault();
        var monthlyRev = s.MonthlyRevenue.TakeLast(2).ToList();
        var revTrend = monthlyRev.Count == 2 && monthlyRev[0].Value > 0
            ? Math.Round((monthlyRev[1].Value - monthlyRev[0].Value) / monthlyRev[0].Value * 100m, 2)
            : (decimal?)null;

        var insights = new List<string>
        {
            $"Hệ thống có {s.TotalUsers:N0} người dùng, {s.TotalVenues:N0} cơ sở và {s.TotalBookings:N0} booking.",
            $"Tổng doanh thu ghi nhận từ booking xác nhận/hoàn tất: {s.TotalRevenue:N0} VND.",
            $"Tỷ lệ tăng trưởng booking tháng này: {s.BookingGrowthRate:0.##}%.",
            $"Tỷ lệ retention (user đặt ≥2 lần): {s.UserRetentionRate:0.##}%.",
            topSport is not null ? $"Môn {topSport.Label} dẫn đầu với {topSport.Count} booking và doanh thu {topSport.Value:N0} VND." : "Chưa có dữ liệu phân bổ môn."
        };

        var riskItems = new List<DashboardAiRiskItemDto>
        {
            new()
            {
                Level = s.CancellationRate >= 15 ? "HIGH" : "MEDIUM",
                Title = "Tỷ lệ hủy booking",
                Detail = $"Cancellation rate hiện tại {s.CancellationRate:0.##}%.",
                Evidence = $"Tính trên {s.TotalBookings} booking tổng.",
                Impact = "Tỷ lệ hủy cao có thể làm giảm niềm tin và doanh thu thực nhận.",
                SuggestedAction = "Rà soát venue/sân có tỷ lệ hủy cao và chính sách hoàn/hủy."
            }
        };
        if (weakVenue is not null && weakVenue.CancellationRate > 10)
        {
            riskItems.Add(new DashboardAiRiskItemDto
            {
                Level = "MEDIUM",
                Title = $"Cơ sở {weakVenue.VenueName}",
                Detail = $"Cancellation {weakVenue.CancellationRate:0.##}%, doanh thu {weakVenue.Revenue:N0} VND.",
                Evidence = $"{weakVenue.BookingCount} booking, rating TB {weakVenue.AverageRating:0.##}.",
                Impact = "Venue kém hiệu suất kéo chất lượng nền tảng.",
                SuggestedAction = "Admin liên hệ owner, kiểm tra vận hành và review."
            });
        }

        var actions = new List<DashboardAiActionItemDto>
        {
            new()
            {
                Priority = 1,
                Level = "HIGH",
                Action = "Ưu tiên marketing quanh môn và khung giờ cao điểm",
                Reason = topSport is not null && peakHour is not null
                    ? $"{topSport.Label} ({topSport.Count} booking) và giờ {peakHour.Label} ({peakHour.Count} booking) đang dẫn demand."
                    : "Tập trung nguồn lực vào segment có booking cao nhất trong dữ liệu.",
                ExpectedImpact = "Tăng conversion booking mà không cần mở rộng inventory.",
                Metric = "Booking Count, GMV"
            },
            new()
            {
                Priority = 2,
                Level = "MEDIUM",
                Action = "Cải thiện retention onboarding",
                Reason = $"User retention {s.UserRetentionRate:0.##}% — cần tăng tỷ lệ quay lại.",
                ExpectedImpact = "Tăng booking lặp lại và giảm phụ thuộc user mới.",
                Metric = "User Retention Rate"
            }
        };

        var revTrendText = revTrend.HasValue
            ? $"Doanh thu tháng gần nhất so với tháng trước: {(revTrend >= 0 ? "tăng" : "giảm")} {Math.Abs(revTrend.Value):0.##}%."
            : "Dữ liệu hiện tại chưa đủ để so sánh doanh thu 2 tháng liên tiếp.";

        var fullReport = $"""
            # 🤖 PHÂN TÍCH AI MATCHOP

            ## 1. Tổng quan
            MATCHOP có {s.TotalUsers:N0} user, {s.TotalVenues:N0} venue, {s.TotalBookings:N0} booking. Doanh thu booking (CONFIRMED/COMPLETED): **{s.TotalRevenue:N0} VND**. {revTrendText}

            ## 2. Phân tích hiệu suất
            - Booking growth tháng: **{s.BookingGrowthRate:0.##}%**
            - User retention: **{s.UserRetentionRate:0.##}%**
            - Cancellation rate: **{s.CancellationRate:0.##}%**
            - Tổng review: **{s.TotalReviews}**, thông báo: **{s.TotalNotifications}**

            ## 3. Phân tích doanh thu
            Doanh thu phản ánh booking đã xác nhận/hoàn tất, không phải lợi nhuận ròng (chưa có dữ liệu chi phí).
            {(topVenue is not null ? $"Venue dẫn đầu: **{topVenue.VenueName}** — {topVenue.Revenue:N0} VND, {topVenue.BookingCount} booking." : "")}

            ## 4. Xu hướng nổi bật
            {(topSport is not null ? $"- **{topSport.Label}**: {topSport.Count} booking, {topSport.Value:N0} VND" : "- Chưa có dữ liệu môn")}
            {(peakHour is not null ? $"- Giờ cao điểm: **{peakHour.Label}** ({peakHour.Count} booking)" : "")}

            ## 5. Phân tích nguyên nhân
            {(s.BookingGrowthRate > 0 ? "Booking tăng có thể gắn với demand môn thể thao và giờ peak trong dữ liệu." : "Booking không tăng hoặc giảm — cần thêm dữ liệu chiến dịch để kết luận chắc chắn (giả thuyết cần kiểm chứng).")}

            ## 6. ⚠️ Rủi ro
            ### 🟠 HIGH
            - Cancellation {s.CancellationRate:0.##}% — {(s.CancellationRate >= 15 ? "cao hơn ngưỡng an toàn 15%" : "cần theo dõi")}

            ## 7. 🚀 Cơ hội
            - Tận dụng môn và giờ peak để tăng GMV
            - Cải thiện retention từ {s.UserRetentionRate:0.##}%

            ## 8. 🔮 Dự báo
            Nếu xu hướng booking hiện tại tiếp tục, có khả năng booking tháng tới ~{Math.Round(s.TotalBookings * 1.05m, 0):N0} (ước tính từ tốc độ hiện tại, không phải cam kết).

            ## 9. 🎯 Đề xuất hành động
            ### Ưu tiên 1
            - Hành động: {actions[0].Action}
            - Lý do: {actions[0].Reason}
            - KPI: {actions[0].Metric}

            ## 10. Kết luận của AI
            Nền tảng {(s.BookingGrowthRate >= 0 ? "đang có dấu hiệu tăng trưởng booking" : "cần chú ý suy giảm booking")}. Ưu tiên kiểm soát cancellation và tăng retention.
            """;

        return BuildResult(fullReport, insights, actions, riskItems,
            [
                "Bundle khuyến mãi quanh peak hours",
                "Tăng visibility venue rating cao"
            ],
            [
                new ForecastMetricDto { Label = "Booking tháng tới (ước tính)", Value = Math.Round(s.TotalBookings * 1.05m, 0).ToString("N0") },
                new ForecastMetricDto { Label = "Doanh thu (ước tính)", Value = Math.Round(s.TotalRevenue * 1.05m, 0).ToString("N0") }
            ],
            $"MATCHOP: {s.TotalUsers:N0} user, {s.TotalBookings:N0} booking, doanh thu {s.TotalRevenue:N0} VND. Growth booking {s.BookingGrowthRate:0.##}%, retention {s.UserRetentionRate:0.##}%.");
    }

    private static DashboardAiSummaryDto BuildOwnerFallback(DashboardOwnerStatisticsDto s)
    {
        var topCourt = s.MostPopularCourts.FirstOrDefault();
        var topHour = s.PeakHours.OrderByDescending(x => x.Count).FirstOrDefault();
        var topSport = s.SportDistribution.FirstOrDefault();
        var cancelRate = s.CancellationStatistics.CancellationRate;
        var avgBooking = s.TotalBookings > 0 ? s.RevenueThisMonth / Math.Max(1, s.TotalBookings) : 0m;

        var insights = new List<string>
        {
            $"Doanh thu tháng này: {s.RevenueThisMonth:N0} VND ({s.TotalBookings} booking).",
            $"Doanh thu hôm nay: {s.RevenueToday:N0} VND.",
            $"Tỷ lệ lấp đầy sân: {s.CourtUtilizationRate:0.##}%.",
            $"Khách quay lại: {s.ReturningCustomers} user.",
            topCourt is not null ? $"Sân hot nhất: {topCourt.CourtName} — {topCourt.BookingCount} booking, {topCourt.Revenue:N0} VND." : "Chưa có dữ liệu sân."
        };

        var riskItems = new List<DashboardAiRiskItemDto>
        {
            new()
            {
                Level = cancelRate >= 15 ? "HIGH" : "MEDIUM",
                Title = "Tỷ lệ hủy",
                Detail = $"{cancelRate:0.##}% ({s.CancellationStatistics.CancelledBookings}/{s.CancellationStatistics.TotalBookings} booking).",
                Evidence = "Dữ liệu cancellation statistics.",
                Impact = "Hủy cao làm mất slot và giảm doanh thu thực.",
                SuggestedAction = "Rà soát chính sách đặt/hủy và xác nhận sớm."
            }
        };
        if (s.CourtUtilizationRate < 40)
        {
            riskItems.Add(new DashboardAiRiskItemDto
            {
                Level = "HIGH",
                Title = "Công suất sân thấp",
                Detail = $"Occupancy {s.CourtUtilizationRate:0.##}%.",
                Evidence = "So với capacity tháng hiện tại.",
                Impact = "Giờ trống = doanh thu bỏ lỡ.",
                SuggestedAction = "Promotion giờ thấp điểm, combo membership."
            });
        }

        var actions = new List<DashboardAiActionItemDto>
        {
            new()
            {
                Priority = 1,
                Level = "HIGH",
                Action = topHour is not null ? $"Tối ưu giá/khuyến mãi quanh {topHour.Label}" : "Phân tích thêm peak hours",
                Reason = topHour is not null ? $"Khung {topHour.Label} có {topHour.Count} booking — demand cao nhất." : "Cần dữ liệu giờ để quyết định.",
                ExpectedImpact = "Tăng doanh thu/giờ tại slot cao điểm.",
                Metric = "Revenue per Hour, Occupancy"
            },
            new()
            {
                Priority = 2,
                Level = "MEDIUM",
                Action = "Chương trình loyalty cho khách quay lại",
                Reason = $"{s.ReturningCustomers} khách quay lại — cơ hội tăng LTV.",
                ExpectedImpact = "Tăng booking lặp và ổn định doanh thu.",
                Metric = "Returning Customers, Revenue This Month"
            }
        };

        var fullReport = $"""
            # 🤖 PHÂN TÍCH AI MATCHOP — CHỦ SÂN

            ## 1. Tổng quan
            Doanh thu tháng: **{s.RevenueThisMonth:N0} VND**, hôm nay **{s.RevenueToday:N0} VND**, {s.TotalBookings} booking. Rating TB: **{s.AverageRating:0.##}** ({s.TotalReviews} review).

            ## 2. Phân tích hiệu suất
            - Occupancy: **{s.CourtUtilizationRate:0.##}%**
            - Cancellation: **{cancelRate:0.##}%**
            - Khách quay lại: **{s.ReturningCustomers}**

            ## 3. Phân tích doanh thu
            Giá trị booking TB ước tính: **{avgBooking:N0} VND/booking** (doanh thu tháng / booking).
            {(topSport is not null ? $"Môn mạnh: **{topSport.Label}** — {topSport.Count} booking, {topSport.Value:N0} VND." : "")}

            ## 4. Xu hướng nổi bật
            {(topHour is not null ? $"Peak: **{topHour.Label}** ({topHour.Count} booking)" : "Chưa đủ dữ liệu giờ")}

            ## 5. Phân tích nguyên nhân
            {(s.RevenueThisMonth > 0 && cancelRate < 15 ? "Doanh thu ổn định khi cancellation chưa vượt ngưỡng 15%." : "Cần giảm hủy hoặc tăng occupancy để cải thiện doanh thu ròng từ sân.")}

            ## 6. ⚠️ Rủi ro
            - [{riskItems[0].Level}] {riskItems[0].Title}: {riskItems[0].Detail}

            ## 7. 🚀 Cơ hội
            - Tận dụng peak hours và sân hot
            - Loyalty cho {s.ReturningCustomers} khách quay lại

            ## 8. 🔮 Dự báo
            {string.Join("; ", s.RevenueForecast.Select(f => $"{f.Label}: {f.Value}"))}

            ## 9. 🎯 Đề xuất hành động
            ### Ưu tiên 1 — {actions[0].Action}
            Lý do: {actions[0].Reason}. KPI: {actions[0].Metric}

            ## 10. Kết luận
            Sân {(s.CourtUtilizationRate >= 50 ? "đang sử dụng tốt" : "còn nhiều slot trống cần kích demand")}. Ưu tiên peak hour và giữ chân khách quay lại.
            """;

        return BuildResult(fullReport, insights, actions, riskItems,
            ["Promotion off-peak", "Highlight venue rating cao"],
            s.RevenueForecast.Count > 0 ? s.RevenueForecast : [new ForecastMetricDto { Label = "Doanh thu tháng tới (ước tính)", Value = Math.Round(s.RevenueThisMonth * 1.05m, 0).ToString("N0") }],
            $"Tháng này {s.RevenueThisMonth:N0} VND, occupancy {s.CourtUtilizationRate:0.##}%, {s.ReturningCustomers} khách quay lại.");
    }

    private static DashboardAiSummaryDto BuildCoachFallback(DashboardCoachStatisticsDto s)
    {
        var topSport = s.SportDistribution.FirstOrDefault();
        var completionRate = s.TotalSessions > 0 ? Math.Round(s.CompletedSessions * 100m / s.TotalSessions, 2) : 0m;
        var paidRate = s.TotalSessions > 0 ? Math.Round(s.PaidSessions * 100m / s.TotalSessions, 2) : 0m;

        var insights = new List<string>
        {
            $"Tổng buổi HL: {s.TotalSessions}, đã thanh toán: {s.PaidSessions}, hoàn thành: {s.CompletedSessions}.",
            $"Doanh thu tích lũy: {s.TotalRevenue:N0} VND, tháng này: {s.RevenueThisMonth:N0} VND.",
            $"TB thu/buổi đã trả: {s.AverageSessionRevenue:N0} VND.",
            $"Chờ thanh toán: {s.PendingPaymentSessions} buổi."
        };

        var riskItems = new List<DashboardAiRiskItemDto>();
        if (s.PendingPaymentSessions > 0)
        {
            riskItems.Add(new DashboardAiRiskItemDto
            {
                Level = "MEDIUM",
                Title = "Buổi chờ thanh toán",
                Detail = $"{s.PendingPaymentSessions} buổi AWAITING_PAYMENT.",
                Evidence = "Coach session payment status.",
                Impact = "Doanh thu chưa ghi nhận, rủi ro hủy.",
                SuggestedAction = "Nhắc học viên thanh toán sớm."
            });
        }
        if (paidRate < 50 && s.TotalSessions > 0)
        {
            riskItems.Add(new DashboardAiRiskItemDto
            {
                Level = "HIGH",
                Title = "Tỷ lệ thanh toán thấp",
                Detail = $"Chỉ {paidRate:0.##}% buổi đã thanh toán.",
                Evidence = $"{s.PaidSessions}/{s.TotalSessions} sessions.",
                Impact = "Thu nhập coach không ổn định.",
                SuggestedAction = "Rà soát quy trình xác nhận giá và QR thanh toán."
            });
        }

        var actions = new List<DashboardAiActionItemDto>
        {
            new()
            {
                Priority = 1,
                Level = "HIGH",
                Action = "Theo dõi sát buổi chờ thanh toán",
                Reason = $"{s.PendingPaymentSessions} buổi chưa PAID.",
                ExpectedImpact = "Chuyển pending → paid, tăng doanh thu thực.",
                Metric = "Paid Sessions, Revenue This Month"
            }
        };

        var fullReport = $"""
            # 🤖 PHÂN TÍCH AI MATCHOP — HUẤN LUYỆN VIÊN

            ## 1. Tổng quan
            {s.TotalSessions} buổi, {s.PaidSessions} đã trả, doanh thu **{s.TotalRevenue:N0} VND**.

            ## 2. Phân tích hiệu suất
            - Hoàn thành: **{completionRate:0.##}%** ({s.CompletedSessions}/{s.TotalSessions})
            - Thanh toán: **{paidRate:0.##}%**
            - Chờ TT: **{s.PendingPaymentSessions}**

            ## 3. Phân tích doanh thu
            Tháng này **{s.RevenueThisMonth:N0} VND**, hôm nay **{s.RevenueToday:N0} VND**, TB **{s.AverageSessionRevenue:N0} VND/buổi**.

            ## 4. Xu hướng
            {(topSport is not null ? $"Môn: **{topSport.Label}** — {topSport.Count} buổi" : "Chưa có phân bổ môn")}

            ## 5. Nguyên nhân
            {(s.PendingPaymentSessions > 0 ? "Doanh thu chưa tối đa do còn buổi pending payment." : "Pipeline thanh toán ổn định trong dữ liệu hiện tại.")}

            ## 6. ⚠️ Rủi ro
            {(riskItems.Count > 0 ? string.Join("\n", riskItems.Select(r => $"- [{r.Level}] {r.Title}: {r.Detail}")) : "- Không phát hiện rủi ro lớn từ dữ liệu session.")}

            ## 7. 🚀 Cơ hội
            - Tăng completion rate từ {completionRate:0.##}%
            - Upsell buổi cho học viên đã PAID

            ## 8. 🔮 Dự báo
            Dữ liệu hiện tại {(s.RevenueTrend.Count >= 2 ? "có trend 14 ngày để theo dõi" : "chưa đủ cho dự báo dài hạn")}.

            ## 9. 🎯 Hành động
            - {actions[0].Action}: {actions[0].Reason}

            ## 10. Kết luận
            Coach nên ưu tiên chốt thanh toán và hoàn thành buổi để tăng thu nhập ổn định.
            """;

        return BuildResult(fullReport, insights, actions, riskItems,
            ["Nhắc học viên book lại sau buổi COMPLETED"],
            [new ForecastMetricDto { Label = "Buổi paid mục tiêu", Value = (s.PaidSessions + 2).ToString("N0") }],
            $"{s.PaidSessions} buổi đã trả, doanh thu tháng {s.RevenueThisMonth:N0} VND, {s.PendingPaymentSessions} buổi chờ TT.");
    }

    private static DashboardAiSummaryDto BuildUserFallback(DashboardUserStatisticsDto s)
    {
        var favSport = s.FavoriteSports.FirstOrDefault();
        var favVenue = s.FavoriteVenues.FirstOrDefault();
        var spend = s.SpendingStatistics;

        var insights = new List<string>
        {
            $"{s.TotalBookings} booking, chi tiêu tổng {spend.TotalSpent:N0} VND.",
            $"Tháng này: {spend.ThisMonthSpent:N0} VND, TB {spend.AverageSpend:N0} VND/booking.",
            $"Tần suất: {s.PlayingFrequencyPerMonth:0.##} buổi/tháng.",
            favSport is not null ? $"Môn yêu thích: {favSport.Label} ({favSport.Count} lần)." : "Chưa có môn yêu thích."
        };

        var riskItems = new List<DashboardAiRiskItemDto>
        {
            new()
            {
                Level = s.PlayingFrequencyPerMonth < 1 ? "MEDIUM" : "LOW",
                Title = "Tần suất chơi",
                Detail = $"{s.PlayingFrequencyPerMonth:0.##} buổi/tháng.",
                Evidence = $"{s.TotalBookings} booking lịch sử.",
                Impact = "Tần suất thấp → khó duy trì thói quen và skill.",
                SuggestedAction = "Đặt lịch cố định hàng tuần."
            }
        };

        var actions = new List<DashboardAiActionItemDto>
        {
            new()
            {
                Priority = 1,
                Level = "MEDIUM",
                Action = favVenue is not null ? $"Book sớm tại {favVenue.Label}" : "Khám phá venue mới",
                Reason = favVenue is not null ? $"Venue yêu thích — {favVenue.Count} lần đặt." : "Mở rộng trải nghiệm.",
                ExpectedImpact = "Giữ slot ưa thích, giảm hủy do hết chỗ.",
                Metric = "Booking Count"
            }
        };

        var fullReport = $"""
            # 🤖 PHÂN TÍCH AI MATCHOP — NGƯỜI CHƠI

            ## 1. Tổng quan
            {s.TotalBookings} booking, chi tiêu **{spend.TotalSpent:N0} VND**.

            ## 2. Hiệu suất
            - TB/tháng: **{s.PlayingFrequencyPerMonth:0.##}** buổi
            - Match posts: **{s.MatchmakingStatistics.TotalMatchPosts}**, rooms: **{s.MatchmakingStatistics.JoinedMatchRooms}**

            ## 3. Chi tiêu
            Tháng này **{spend.ThisMonthSpent:N0} VND**, TB **{spend.AverageSpend:N0} VND/booking**.

            ## 4. Xu hướng
            {(favSport is not null ? $"**{favSport.Label}** — {favSport.Count} booking" : "")}

            ## 5-10. Gợi ý
            Đặt sớm giờ peak, tham gia matchmaking ({s.MatchmakingStatistics.OpenMatchPosts} post đang mở).
            """;

        return BuildResult(fullReport, insights, actions, riskItems,
            ["Join match room cùng môn yêu thích"],
            [
                new ForecastMetricDto { Label = "Booking tháng tới (ước tính)", Value = Math.Max(1, Math.Round(s.PlayingFrequencyPerMonth, 0)).ToString("N0") },
                new ForecastMetricDto { Label = "Chi tiêu ước tính", Value = Math.Round(spend.AverageSpend * Math.Max(1, s.PlayingFrequencyPerMonth), 0).ToString("N0") }
            ],
            $"{s.TotalBookings} booking, chi tiêu {spend.TotalSpent:N0} VND, {s.PlayingFrequencyPerMonth:0.##} buổi/tháng.");
    }

    private static DashboardAiSummaryDto BuildResult(
        string fullReport,
        List<string> insights,
        List<DashboardAiActionItemDto> actions,
        List<DashboardAiRiskItemDto> riskItems,
        List<string> opportunities,
        List<ForecastMetricDto> forecast,
        string summary)
    {
        var recommendations = actions.Select(a => $"[{a.Level}] {a.Action} — {a.Reason}").ToList();
        return new DashboardAiSummaryDto
        {
            FullReport = fullReport,
            Summary = summary,
            Insights = insights,
            Recommendations = recommendations,
            RiskItems = riskItems,
            Risks = riskItems.Select(FormatRiskString).ToList(),
            Opportunities = opportunities,
            Actions = actions,
            Forecast = forecast,
            IsFallback = true,
            GeneratedAt = DateTime.UtcNow
        };
    }

    private static string FormatRiskString(DashboardAiRiskItemDto risk)
    {
        var parts = new List<string> { $"[{risk.Level}] {risk.Title}" };
        if (!string.IsNullOrWhiteSpace(risk.Detail)) parts.Add(risk.Detail);
        if (!string.IsNullOrWhiteSpace(risk.Evidence)) parts.Add($"Căn cứ: {risk.Evidence}");
        return string.Join(" — ", parts);
    }
}
