namespace MATCHOP.API.Helpers;

/// <summary>Giờ địa phương cho sân tại Việt Nam (UTC+7).</summary>
public static class VenueTimeHelper
{
    private static readonly TimeZoneInfo VietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById(
        OperatingSystem.IsWindows() ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh");

    public static DateTime GetNow() =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone);

    public static DateOnly GetToday() =>
        DateOnly.FromDateTime(GetNow());

    public static TimeOnly GetCurrentTime() =>
        TimeOnly.FromDateTime(GetNow());
}
