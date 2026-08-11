using System.Security.Cryptography;
using System.Text;

namespace MATCHOP.API.Helpers;

/// <summary>
/// Helper cho SePay:
///   - Tạo nội dung chuyển khoản (payment content) theo quy ước MATCHOP
///   - Tạo URL QR code VietQR
///   - Xác thực API Key từ header Authorization của SePay webhook
/// </summary>
public static class SePayHelper
{
    /// <summary>
    /// Tạo mã nội dung chuyển khoản từ bookingId.
    /// Format: MATCHOP{bookingId 8 ký tự đầu uppercase}
    /// Ví dụ: MATCHOP3F2A1B4C
    /// </summary>
    public static string BuildPaymentContent(Guid bookingId)
    {
        var shortId = bookingId.ToString("N")[..8].ToUpper();
        return $"MATCHOP{shortId}";
    }

    /// <summary>
    /// Tách bookingId từ nội dung chuyển khoản.
    /// Tìm pattern MATCHOP + 8 ký tự hex trong nội dung ngân hàng.
    /// </summary>
    public static string? ExtractPaymentContent(string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;

        // Tìm "MATCHOP" trong chuỗi (case-insensitive), lấy 8 ký tự tiếp theo
        var upper = content.ToUpperInvariant();
        var idx = upper.IndexOf("MATCHOP", StringComparison.Ordinal);
        if (idx < 0) return null;

        var start = idx;
        var end = start + 15; // "MATCHOP" (7) + 8 = 15
        if (end > upper.Length) return null;

        return upper[start..end]; // VD: MATCHOP3F2A1B4C
    }

    /// <summary>
    /// Tìm bookingId (Guid) từ payment content đã extract.
    /// So sánh với danh sách booking đang PENDING_PAYMENT.
    /// </summary>
    public static bool TryMatchBookingId(string paymentContent, Guid bookingId)
    {
        var expected = BuildPaymentContent(bookingId);
        return string.Equals(paymentContent, expected, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Tạo URL ảnh QR VietQR.
    /// </summary>
    public static string BuildVietQrUrl(
        string bankBin,
        string accountNumber,
        long amount,
        string content,
        string accountName)
    {
        // VietQR CDN: https://img.vietqr.io/image/{BANK_BIN}-{ACCOUNT}-{TEMPLATE}.png
        // Template "compact2" cho QR gọn, có logo ngân hàng
        var encodedContent = Uri.EscapeDataString(content);
        var encodedName    = Uri.EscapeDataString(accountName);

        return $"https://img.vietqr.io/image/{bankBin}-{accountNumber}-compact2.png" +
               $"?amount={amount}" +
               $"&addInfo={encodedContent}" +
               $"&accountName={encodedName}";
    }

    /// <summary>
    /// Xác thực API Key từ header Authorization của SePay webhook.
    /// SePay gửi: Authorization: Apikey {your_api_key}
    /// </summary>
    public static bool ValidateApiKey(string? authHeader, string expectedApiKey)
    {
        if (string.IsNullOrWhiteSpace(authHeader)) return false;

        // SePay gửi "Apikey xxxx"
        const string prefix = "Apikey ";
        if (!authHeader.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        var receivedKey = authHeader[prefix.Length..].Trim();
        return string.Equals(receivedKey, expectedApiKey, StringComparison.Ordinal);
    }

    /// <summary>
    /// Xác thực HMAC-SHA256 nếu dùng phương thức bảo mật HMAC (tùy chọn).
    /// SePay gửi signature trong header X-SePay-Signature.
    /// </summary>
    public static bool ValidateHmacSignature(string body, string signature, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
        var expected = Convert.ToHexString(hash).ToLowerInvariant();
        return string.Equals(expected, signature, StringComparison.OrdinalIgnoreCase);
    }
}
