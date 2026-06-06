namespace MATCHOP.API.DTOs.Payments;

public class CreateVNPayPaymentResponseDto
{
    public string PaymentUrl { get; set; } = null!;
    public string OrderId { get; set; } = null!;
    public decimal Amount { get; set; }
    public DateTime ExpireAt { get; set; }
}

public class VNPayReturnDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = null!;
    public string? OrderId { get; set; }
    public string? TransactionCode { get; set; }
    public decimal? Amount { get; set; }
    public string? BookingStatus { get; set; }
}