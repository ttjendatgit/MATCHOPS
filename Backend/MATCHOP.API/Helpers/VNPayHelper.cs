using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace MATCHOP.API.Helpers;

public static class VNPayHelper
{
    public static string HmacSHA512(string key, string data)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new HMACSHA512(keyBytes);
        var hashBytes = hmac.ComputeHash(dataBytes);
        return BitConverter.ToString(hashBytes)
            .Replace("-", "")
            .ToLower();
    }

    public static string BuildQueryString(
        SortedList<string, string> parameters)
    {
        var sb = new StringBuilder();
        foreach (var (key, value) in parameters)
        {
            if (string.IsNullOrWhiteSpace(value)) continue;
            if (sb.Length > 0) sb.Append('&');
            sb.Append(WebUtility.UrlEncode(key));
            sb.Append('=');
            sb.Append(WebUtility.UrlEncode(value));
        }
        return sb.ToString();
    }

    public static bool ValidateSignature(
        IQueryCollection query,
        string hashSecret)
    {
        // Lấy vnp_SecureHash từ query
        var vnpSecureHash = query["vnp_SecureHash"].ToString();
        if (string.IsNullOrWhiteSpace(vnpSecureHash)) return false;

        // Build lại params không có vnp_SecureHash và vnp_SecureHashType
        var parameters = new SortedList<string, string>(StringComparer.Ordinal);
        foreach (var (key, value) in query)
        {
            if (key == "vnp_SecureHash" || key == "vnp_SecureHashType") continue;
            parameters.Add(key, value.ToString());
        }

        var rawData = BuildQueryString(parameters);
        var checkHash = HmacSHA512(hashSecret, rawData);

        return string.Equals(
            checkHash,
            vnpSecureHash,
            StringComparison.OrdinalIgnoreCase);
    }
}