using System.Text;
using System.Text.Json;
using MATCHOP.API.Services.AI;

namespace MATCHOP.API.Services;

public static class AiResponseFormatter
{
    public static string? TryFormat(AiToolResult result, string intent)
    {
        if (!result.Success && !string.IsNullOrWhiteSpace(result.Message))
            return result.Message;

        if (result.RequiresConfirmation && result.PendingBooking != null)
            return FormatPendingBooking(result.PendingBooking);

        if (!string.IsNullOrWhiteSpace(result.Message) && result.Data is null)
            return result.Message;

        return intent switch
        {
            AiIntents.SearchVenue or AiIntents.SearchCourt or AiIntents.LocationRecommendation
                or AiIntents.SportRecommendation => FormatSearch(result),
            AiIntents.CheckAvailability or AiIntents.PriceInformation or AiIntents.CourtInformation
                => FormatAvailability(result),
            AiIntents.ViewBooking or AiIntents.Payment => FormatBookings(result),
            AiIntents.ConfirmBooking => result.Message ?? FormatConfirmBooking(result),
            AiIntents.CancelBooking => result.Message,
            AiIntents.BookCourt when !result.Success => result.Message,
            AiIntents.OwnerDashboard or AiIntents.AdminDashboard or AiIntents.CoachDashboard
                => FormatDashboard(result),
            AiIntents.GeneralChat or AiIntents.Faq => null,
            _ when result.Data is null => result.Message,
            _ => null
        };
    }

    private static string FormatPendingBooking(PendingBookingDraft p) =>
        $"""
        📋 **Xác nhận đặt sân**

        • **Sân:** {p.CourtName} — {p.VenueName}
        • **Ngày:** {FormatDate(p.BookingDate)}
        • **Giờ:** {p.StartTime} – {p.EndTime}
        • **Giá ước tính:** {p.TotalPrice:N0}đ

        Bạn có muốn **xác nhận đặt sân** không? (Trả lời "Đồng ý" hoặc "Xác nhận")
        """;

    private static string FormatConfirmBooking(AiToolResult result)
    {
        if (result.Data is null)
            return result.Message ?? "Đặt sân thành công!";

        try
        {
            var json = JsonSerializer.Serialize(result.Data);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var venue = root.TryGetProperty("VenueName", out var v) ? v.GetString() : null;
            var court = root.TryGetProperty("CourtName", out var c) ? c.GetString() : null;
            var date = root.TryGetProperty("BookingDate", out var d) ? d.GetString() : null;
            var start = root.TryGetProperty("StartTime", out var s) ? s.GetString() : null;
            var end = root.TryGetProperty("EndTime", out var e) ? e.GetString() : null;
            var price = root.TryGetProperty("TotalPrice", out var p) ? p.GetDecimal() : 0;

            return $"""
                ✅ **Đặt sân thành công!**

                • **Sân:** {court} — {venue}
                • **Ngày:** {date}, {start}–{end}
                • **Tổng tiền:** {price:N0}đ

                Vui lòng thanh toán trong ứng dụng để giữ slot.
                """;
        }
        catch
        {
            return result.Message ?? "Đặt sân thành công!";
        }
    }

    private static string FormatSearch(AiToolResult result)
    {
        try
        {
            var json = JsonSerializer.Serialize(result.Data);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.TryGetProperty("availableSlots", out var slots) && slots.GetArrayLength() > 0)
                return FormatAvailableSlots(slots);

            if (root.TryGetProperty("venues", out var venues) && venues.GetArrayLength() > 0)
                return FormatVenues(venues, root.TryGetProperty("count", out var c) ? c.GetInt32() : venues.GetArrayLength());

            return "🔎 Không tìm thấy sân phù hợp với tiêu chí của bạn. Bạn có thể thử khu vực khác hoặc môn thể thao khác.";
        }
        catch
        {
            return result.Message ?? "Không thể hiển thị kết quả tìm kiếm.";
        }
    }

    private static string FormatVenues(JsonElement venues, int count)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"🔎 Tôi tìm thấy **{count}** địa điểm trên MATCHOP:\n");

        var i = 1;
        foreach (var v in venues.EnumerateArray().Take(5))
        {
            var name = v.TryGetProperty("Name", out var n) ? n.GetString() : v.TryGetProperty("name", out var n2) ? n2.GetString() : "—";
            var district = v.TryGetProperty("District", out var d) ? d.GetString() : v.TryGetProperty("district", out var d2) ? d2.GetString() : "";
            var city = v.TryGetProperty("City", out var c) ? c.GetString() : "";
            var address = v.TryGetProperty("Address", out var a) ? a.GetString() : "";

            sb.AppendLine($"{i}. **{name}**");
            if (!string.IsNullOrWhiteSpace(district) || !string.IsNullOrWhiteSpace(city))
                sb.AppendLine($"   📍 {district}{(!string.IsNullOrWhiteSpace(city) ? $", {city}" : "")}");
            if (!string.IsNullOrWhiteSpace(address))
                sb.AppendLine($"   🏠 {address}");
            sb.AppendLine();
            i++;
        }

        sb.AppendLine("Bạn muốn tôi kiểm tra lịch trống hoặc đặt sân nào?");
        return sb.ToString().Trim();
    }

    private static string FormatAvailableSlots(JsonElement slots)
    {
        var sb = new StringBuilder();
        sb.AppendLine("🕐 **Sân còn trống:**\n");

        var i = 1;
        foreach (var s in slots.EnumerateArray().Take(6))
        {
            var court = s.TryGetProperty("courtName", out var cn) ? cn.GetString() : "—";
            var venue = s.TryGetProperty("venueName", out var vn) ? vn.GetString() : "";
            var district = s.TryGetProperty("venueDistrict", out var vd) ? vd.GetString() : "";
            var start = s.TryGetProperty("startTime", out var st) ? st.GetString() : "";
            var end = s.TryGetProperty("endTime", out var et) ? et.GetString() : "";
            var price = s.TryGetProperty("estimatedPrice", out var p) && p.ValueKind == JsonValueKind.Number
                ? p.GetDecimal()
                : (decimal?)null;

            sb.AppendLine($"{i}. **{court}** — {venue}");
            if (!string.IsNullOrWhiteSpace(district))
                sb.AppendLine($"   📍 {district}");
            if (!string.IsNullOrWhiteSpace(start))
                sb.AppendLine($"   🕐 {start}–{end}");
            if (price.HasValue && price.Value > 0)
                sb.AppendLine($"   💰 ~{price.Value:N0}đ");
            sb.AppendLine();
            i++;
        }

        sb.AppendLine("Bạn muốn đặt sân nào? Cho tôi biết tên sân và khung giờ.");
        return sb.ToString().Trim();
    }

    private static string FormatAvailability(AiToolResult result)
    {
        try
        {
            var json = JsonSerializer.Serialize(result.Data);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.TryGetProperty("availableSlots", out var list) && list.GetArrayLength() > 0)
                return FormatAvailableSlots(list);

            var court = root.TryGetProperty("CourtName", out var c) ? c.GetString()
                : root.TryGetProperty("courtName", out var c2) ? c2.GetString() : "Sân";
            var venue = root.TryGetProperty("VenueName", out var v) ? v.GetString()
                : root.TryGetProperty("venueName", out var v2) ? v2.GetString() : "";
            var date = root.TryGetProperty("Date", out var d) ? d.GetString()
                : root.TryGetProperty("date", out var d2) ? d2.GetString() : "";

            if (root.TryGetProperty("slotInfo", out var slotInfo))
            {
                if (slotInfo.TryGetProperty("isAvailable", out var avail))
                {
                    var req = slotInfo.TryGetProperty("requested", out var r) ? r.GetString() : "";
                    return avail.GetBoolean()
                        ? $"✅ **{court}** ({venue}) ngày {date}: khung {req} **còn trống**."
                        : $"❌ **{court}** ({venue}) ngày {date}: khung {req} **không còn trống**.";
                }

                if (slotInfo.TryGetProperty("availableCount", out var cnt))
                {
                    return $"🕐 **{court}** ({venue}) ngày {date}: còn **{cnt.GetInt32()}** slot trống.";
                }
            }

            return result.Message ?? "Không có thông tin lịch trống.";
        }
        catch
        {
            return result.Message ?? "Không thể kiểm tra lịch sân.";
        }
    }

    private static string FormatBookings(AiToolResult result)
    {
        try
        {
            var json = JsonSerializer.Serialize(result.Data);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (!root.TryGetProperty("bookings", out var bookings) || bookings.GetArrayLength() == 0)
                return "📋 Bạn chưa có booking nào.";

            var sb = new StringBuilder();
            sb.AppendLine("📋 **Booking của bạn:**\n");

            var i = 1;
            foreach (var b in bookings.EnumerateArray().Take(8))
            {
                var venue = b.TryGetProperty("VenueName", out var v) ? v.GetString() : "—";
                var court = b.TryGetProperty("CourtName", out var c) ? c.GetString() : "";
                var date = b.TryGetProperty("BookingDate", out var d) ? d.GetString() : "";
                var start = b.TryGetProperty("StartTime", out var s) ? s.GetString() : "";
                var end = b.TryGetProperty("EndTime", out var e) ? e.GetString() : "";
                var status = b.TryGetProperty("Status", out var st) ? st.GetString() : "";
                var price = b.TryGetProperty("TotalPrice", out var p) && p.ValueKind == JsonValueKind.Number
                    ? p.GetDecimal()
                    : 0m;

                sb.AppendLine($"{i}. **{venue}** — {court}");
                sb.AppendLine($"   📅 {date}, {start}–{end}");
                sb.AppendLine($"   💰 {price:N0}đ | Trạng thái: **{status}**");
                sb.AppendLine();
                i++;
            }

            return sb.ToString().Trim();
        }
        catch
        {
            return result.Message ?? "Không thể tải danh sách booking.";
        }
    }

    private static string FormatDashboard(AiToolResult result)
    {
        try
        {
            var json = JsonSerializer.Serialize(result.Data);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var sb = new StringBuilder("📊 **Phân tích dữ liệu MATCHOP:**\n\n");

            AppendIfExists(sb, "👥 Tổng user", root, "TotalUsers");
            AppendIfExists(sb, "🏟 Tổng venue", root, "TotalVenues");
            AppendIfExists(sb, "📅 Tổng booking", root, "TotalBookings");
            AppendIfExists(sb, "💰 Doanh thu", root, "TotalRevenue", "N0", "đ");
            AppendIfExists(sb, "📈 Booking tháng này", root, "CurrentMonthBookings");
            AppendIfExists(sb, "💵 Doanh thu tháng này", root, "CurrentMonthRevenue", "N0", "đ");
            AppendIfExists(sb, "📉 Tỷ lệ hủy", root, "CancellationRate", "P1", "%");
            AppendIfExists(sb, "⏱ Công suất sân", root, "OccupancyRate", "P1", "%");

            if (sb.Length <= 40)
                return result.Message ?? "Chưa có đủ dữ liệu phân tích.";

            sb.AppendLine("\n💡 Bạn muốn tôi phân tích sâu hơn khung giờ cao điểm hoặc sân hoạt động kém?");
            return sb.ToString().Trim();
        }
        catch
        {
            return result.Message ?? "Không thể tải dữ liệu dashboard.";
        }
    }

    private static void AppendIfExists(StringBuilder sb, string label, JsonElement root, string prop, string format = "", string suffix = "")
    {
        if (!root.TryGetProperty(prop, out var val))
            return;

        var text = val.ValueKind switch
        {
            JsonValueKind.Number when format == "N0" => val.GetDecimal().ToString("N0"),
            JsonValueKind.Number when format == "P1" => val.GetDecimal().ToString("P1"),
            JsonValueKind.Number => val.GetDecimal().ToString(),
            JsonValueKind.String => val.GetString(),
            _ => val.ToString()
        };

        if (!string.IsNullOrWhiteSpace(text))
            sb.AppendLine($"• {label}: **{text}{suffix}**");
    }

    private static string FormatDate(string iso)
    {
        if (DateOnly.TryParse(iso, out var d))
            return d.ToString("dd/MM/yyyy");
        return iso;
    }
}
