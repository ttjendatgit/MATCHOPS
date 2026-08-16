using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace MATCHOP.API.Helpers;

public static partial class LocationHelper
{
    public static string NormalizeKey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var ch in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                builder.Append(ch);
        }

        var s = builder.ToString().Normalize(NormalizationForm.FormC);
        s = NonAlphaNumericRegex().Replace(s, " ");
        s = PrefixRegex().Replace(s, string.Empty);
        return CollapseWhitespaceRegex().Replace(s, " ").Trim();
    }

    public static string NormalizeCityKey(string? city) => NormalizeCityAlias(NormalizeKey(city));

    public static string NormalizeDistrictKey(string? district) => NormalizeKey(district);

    public static bool CityMatches(string? venueCity, string? filterCity)
    {
        if (string.IsNullOrWhiteSpace(filterCity)) return true;
        if (string.IsNullOrWhiteSpace(venueCity)) return false;

        var venue = NormalizeCityKey(venueCity);
        var filter = NormalizeCityKey(filterCity);
        return venue == filter || venue.Contains(filter) || filter.Contains(venue);
    }

    public static bool DistrictMatches(string? venueDistrict, string? filterDistrict)
    {
        if (string.IsNullOrWhiteSpace(filterDistrict)) return true;
        if (string.IsNullOrWhiteSpace(venueDistrict)) return false;

        var venue = NormalizeDistrictKey(venueDistrict);
        var filter = NormalizeDistrictKey(filterDistrict);
        if (string.IsNullOrEmpty(venue) || string.IsNullOrEmpty(filter)) return false;

        return venue == filter || venue.Contains(filter) || filter.Contains(venue);
    }

    private static string NormalizeCityAlias(string key)
    {
        if (string.IsNullOrEmpty(key)) return key;

        if (key.Contains("hcm") || key.Contains("ho chi minh") || key.Contains("sai gon"))
            return "hcm";

        if (key.Contains("ha noi") || key == "hn")
            return "ha noi";

        if (key.Contains("da nang"))
            return "da nang";

        return key;
    }

    [GeneratedRegex(@"^(quan|huyen|thanh pho|tp)\s+", RegexOptions.IgnoreCase)]
    private static partial Regex PrefixRegex();

    [GeneratedRegex(@"[^a-z0-9\s]", RegexOptions.IgnoreCase)]
    private static partial Regex NonAlphaNumericRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex CollapseWhitespaceRegex();
}
