namespace MATCHOP.API.DTOs.Payments;

// ── SePay QR / Chuyển khoản ─────────────────────────────────────────────────

/// <summary>
/// Trả về cho FE: thông tin QR để user chuyển khoản.
/// </summary>
public class CreateSePayQrResponseDto
{
    /// <summary>URL ảnh QR (VietQR CDN).</summary>
    public string QrImageUrl { get; set; } = null!;

    /// <summary>Nội dung chuyển khoản cần ghi chính xác (mã booking).</summary>
    public string PaymentContent { get; set; } = null!;

    /// <summary>Số tài khoản ngân hàng nhận tiền.</summary>
    public string AccountNumber { get; set; } = null!;

    /// <summary>Tên chủ tài khoản.</summary>
    public string AccountName { get; set; } = null!;

    /// <summary>Ngân hàng nhận tiền.</summary>
    public string BankName { get; set; } = null!;

    /// <summary>Số tiền cần chuyển (VND).</summary>
    public decimal Amount { get; set; }

    /// <summary>Booking hết hạn thanh toán lúc.</summary>
    public DateTime ExpireAt { get; set; }
}

/// <summary>
/// Payload SePay POST về webhook khi có giao dịch ngân hàng.
/// </summary>
public class SePayWebhookPayload
{
    /// <summary>ID giao dịch SePay – dùng làm idempotency key.</summary>
    public long Id { get; set; }

    /// <summary>Tên ngân hàng nhận tiền (Vietcombank, MB, ...).</summary>
    public string Gateway { get; set; } = null!;

    /// <summary>Thời gian giao dịch (yyyy-MM-dd HH:mm:ss).</summary>
    public string TransactionDate { get; set; } = null!;

    /// <summary>Số tài khoản ngân hàng.</summary>
    public string AccountNumber { get; set; } = null!;

    /// <summary>Mã thanh toán SePay tách từ nội dung CK (ví dụ: MATCHOP_xxx).</summary>
    public string? Code { get; set; }

    /// <summary>Nội dung chuyển khoản gốc từ ngân hàng.</summary>
    public string Content { get; set; } = null!;

    /// <summary>"in" = tiền vào, "out" = tiền ra.</summary>
    public string TransferType { get; set; } = null!;

    /// <summary>Số tiền giao dịch (VND, nguyên).</summary>
    public long TransferAmount { get; set; }

    /// <summary>Mã giao dịch tham chiếu phía ngân hàng.</summary>
    public string? ReferenceCode { get; set; }
}

/// <summary>
/// Response trả về cho SePay sau khi xử lý webhook.
/// SePay yêu cầu { "success": true } kèm HTTP 200.
/// </summary>
public class SePayWebhookResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
}