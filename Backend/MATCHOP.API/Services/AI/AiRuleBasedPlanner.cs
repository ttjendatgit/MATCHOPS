using System.Text.RegularExpressions;
using MATCHOP.API.Entities;
using MATCHOP.API.Helpers;

namespace MATCHOP.API.Services.AI;

public static partial class AiRuleBasedPlanner
{
    public static AiPlan? TryPlan(string userMessage)
    {
        var text = userMessage.Trim();
        if (string.IsNullOrWhiteSpace(text))
            return null;

        var lower = LocationHelper.NormalizeKey(text);
        if (string.IsNullOrWhiteSpace(lower))
            lower = text.ToLowerInvariant();
        else
            text = userMessage.Trim(); // keep original for regex city extract

        if (IsViewBookings(lower))
            return Plan(AiIntents.ViewBooking);

        if (IsCancelBooking(lower))
            return Plan(AiIntents.CancelBooking);

        if (IsOwnerDashboard(lower))
            return Plan(AiIntents.OwnerDashboard);

        if (IsAdminDashboard(lower))
            return Plan(AiIntents.AdminDashboard);

        if (TryParseVenueSearch(text, lower, out var searchPlan))
            return searchPlan;

        if (TryParseAvailability(lower, out var availPlan))
            return availPlan;

        return null;
    }

    /// <summary>Fallback khi không khớp pattern chính xác — tránh gọi Groq.</summary>
    public static AiPlan? TryHeuristicFallback(string userMessage)
    {
        var lower = LocationHelper.NormalizeKey(userMessage);
        if (string.IsNullOrWhiteSpace(lower))
            return null;

        if (lower.Contains("san") || lower.Contains("venue"))
        {
            return new AiPlan
            {
                Intent = AiIntents.SearchVenue,
                Parameters = new AiPlanParameters
                {
                    Sport = ExtractSportFromNormalized(lower),
                    City = ExtractCityFromNormalized(lower),
                    Keyword = userMessage.Trim()
                }
            };
        }

        return null;
    }

    private static string? ExtractSportFromNormalized(string lower)
    {
        if (lower.Contains("cau long") || lower.Contains("badminton")) return "cầu lông";
        if (lower.Contains("pickleball")) return "pickleball";
        if (lower.Contains("bong ban")) return "bóng bàn";
        return null;
    }

    private static string? ExtractCityFromNormalized(string lower)
    {
        if (lower.Contains("binh duong")) return "Bình Dương";
        if (lower.Contains("ho chi minh") || lower.Contains("hcm") || lower.Contains("sai gon")) return "TP.HCM";
        if (lower.Contains("ha noi")) return "Hà Nội";
        if (lower.Contains("da nang")) return "Đà Nẵng";
        return null;
    }

    private static bool IsViewBookings(string lower) =>
        lower.Contains("booking") || lower.Contains("dat san cua toi") ||
        lower.Contains("lich dat") || lower.Contains("xem booking");

    private static bool IsCancelBooking(string lower) =>
        lower.Contains("huy booking") || lower.Contains("huy dat san");

    private static bool IsOwnerDashboard(string lower) =>
        lower.Contains("doanh thu") || lower.Contains("phan tich booking") ||
        lower.Contains("occupancy") ||
        (lower.Contains("khung gio") && lower.Contains("dong"));

    private static bool IsAdminDashboard(string lower) =>
        lower.Contains("gmv") || lower.Contains("tăng trưởng user") ||
        lower.Contains("nền tảng") && lower.Contains("phân tích");

    private static bool TryParseVenueSearch(string text, string lower, out AiPlan plan)
    {
        plan = null!;

        var isSearch =
            lower.Contains("tim san") ||
            lower.Contains("san nao") ||
            lower.Contains("may san") ||
            lower.Contains("bao nhieu san") ||
            lower.Contains("co san") ||
            lower.Contains("san o") ||
            lower.Contains("san gan") ||
            lower.Contains("gia re") ||
            lower.Contains("o binh duong") ||
            lower.Contains("binh duong");

        if (!isSearch)
            return false;

        var parameters = new AiPlanParameters
        {
            Sport = ExtractSport(lower),
            City = ExtractCityFromNormalized(lower) ?? ExtractCity(text, lower),
            District = ExtractDistrict(text, lower),
            Keyword = ExtractKeyword(text, lower)
        };

        // Chỉ gắn ngày/giờ khi user nói rõ trong CÂU NÀY
        if (ContainsTonight(lower) || lower.Contains("hom nay"))
            parameters.Date = VenueTimeHelper.GetToday().ToString("yyyy-MM-dd");

        var time = ExtractTimeRange(lower);
        if (time.start != null) parameters.StartTime = time.start;
        if (time.end != null) parameters.EndTime = time.end;

        parameters.MaxPrice = ExtractMaxPrice(lower);

        plan = new AiPlan
        {
            Intent = AiIntents.SearchVenue,
            Parameters = parameters
        };
        return true;
    }

    private static bool TryParseAvailability(string lower, out AiPlan plan)
    {
        plan = null!;
        if (!lower.Contains("con trong") && !lower.Contains("khung gio") &&
            !lower.Contains("luc") && !TimeRegex().IsMatch(lower))
            return false;

        if (!lower.Contains("trong") && !lower.Contains("con trong") &&
            !TimeRegex().IsMatch(lower))
            return false;

        var parameters = new AiPlanParameters
        {
            Sport = ExtractSport(lower),
            City = ExtractCity(lower, lower),
            District = ExtractDistrict(lower, lower),
            Date = ContainsTonight(lower) || lower.Contains("hôm nay") || lower.Contains("hom nay")
                ? VenueTimeHelper.GetToday().ToString("yyyy-MM-dd")
                : null
        };

        var time = ExtractTimeRange(lower);
        if (time.start != null) parameters.StartTime = time.start;
        if (time.end != null) parameters.EndTime = time.end;

        plan = new AiPlan
        {
            Intent = AiIntents.CheckAvailability,
            Parameters = parameters
        };
        return true;
    }

    private static AiPlan Plan(string intent) => new() { Intent = intent };

    private static string? ExtractSport(string lower)
    {
        if (lower.Contains("cau long") || lower.Contains("badminton"))
            return "cầu lông";
        if (lower.Contains("pickleball"))
            return "pickleball";
        if (lower.Contains("bong ban"))
            return "bóng bàn";
        if (lower.Contains("bong da") || lower.Contains("football"))
            return "bóng đá";
        if (lower.Contains("tennis"))
            return "tennis";
        return null;
    }

    private static string? ExtractCity(string text, string lower)
    {
        var patterns = new[]
        {
            @"(?:ở|o|tại|tai)\s+(bình dương|binh duong)",
            @"(bình dương|binh duong)",
            @"(?:ở|o|tại|tai)\s+(tp\.?\s*hcm|hồ chí minh|ho chi minh|sài gòn|sai gon)",
            @"(?:ở|o|tại|tai)\s+(hà nội|ha noi|hn)",
            @"(?:ở|o|tại|tai)\s+(đà nẵng|da nang)",
        };

        foreach (var p in patterns)
        {
            var m = Regex.Match(lower, p, RegexOptions.IgnoreCase);
            if (!m.Success) continue;
            var raw = m.Groups[1].Value;
            return raw switch
            {
                "binh duong" or "bình dương" => "Bình Dương",
                "tp hcm" or "tp.hcm" or "hcm" or "ho chi minh" or "hồ chí minh" or "sai gon" or "sài gòn" => "TP.HCM",
                "ha noi" or "hà nội" or "hn" => "Hà Nội",
                "da nang" or "đà nẵng" => "Đà Nẵng",
                _ => char.ToUpper(raw[0]) + raw[1..]
            };
        }

        return null;
    }

    private static string? ExtractDistrict(string text, string lower)
    {
        var m = Regex.Match(text, @"(quận|quan|huyện|huyen|thị xã|thi xa|thành phố)\s+[\w\sđĐ]+", RegexOptions.IgnoreCase);
        if (m.Success)
            return m.Value.Trim();
        return null;
    }

    private static string? ExtractKeyword(string text, string lower)
    {
        if (lower.Contains("gần tôi") || lower.Contains("gan toi"))
            return null;
        return null;
    }

    private static decimal? ExtractMaxPrice(string lower)
    {
        var m = Regex.Match(lower, @"(\d+)\s*k");
        if (m.Success && decimal.TryParse(m.Groups[1].Value, out var k))
            return k * 1000;

        m = Regex.Match(lower, @"dưới\s+(\d+)");
        if (m.Success && decimal.TryParse(m.Groups[1].Value, out var v))
            return v >= 1000 ? v : v * 1000;

        return null;
    }

    private static bool ContainsTonight(string lower) =>
        lower.Contains("toi nay") || (lower.Contains("toi") && lower.Contains("nay"));

    private static (string? start, string? end) ExtractTimeRange(string lower)
    {
        var range = Regex.Match(lower, @"(\d{1,2})\s*[:h]\s*(\d{0,2})\s*[-–đến]\s*(\d{1,2})");
        if (range.Success)
        {
            var s = int.Parse(range.Groups[1].Value);
            var e = int.Parse(range.Groups[3].Value);
            return ($"{s:D2}:00", $"{e:D2}:00");
        }

        var single = TimeRegex().Match(lower);
        if (single.Success)
        {
            var h = int.Parse(single.Groups[1].Value);
            return ($"{h:D2}:00", $"{h + 1:D2}:00");
        }

        return (null, null);
    }

    [GeneratedRegex(@"\b(\d{1,2})\s*h\b|\b(\d{1,2}):(\d{2})\b", RegexOptions.IgnoreCase)]
    private static partial Regex TimeRegex();
}
