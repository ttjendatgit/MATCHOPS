namespace MATCHOP.API.DTOs.Bookings;

public class CreateBookingDto
{
    public Guid CourtId { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? Note { get; set; }
}

public class CreateOfflineBookingDto
{
    public Guid CourtId { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class MockPaymentRequestDto
{
    public string? TransactionCode { get; set; }
}

public class CancelBookingDto
{
    public string? Reason { get; set; }
}

public class BookingResponseDto
{
    public Guid Id { get; set; }
    public Guid VenueId { get; set; }
    public Guid CourtId { get; set; }
    public Guid SportId { get; set; }
    public Guid? UserId { get; set; }
    public Guid? OwnerId { get; set; }
    public string CourtName { get; set; } = null!;
    public string VenueName { get; set; } = null!;
    public string VenueAddress { get; set; } = null!;
    public string SportName { get; set; } = null!;
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string BookingDate { get; set; } = null!;
    public string StartTime { get; set; } = null!;
    public string EndTime { get; set; } = null!;
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = null!;
    public string PaymentStatus { get; set; } = null!;
    public string BookingType { get; set; } = null!;
    public string? Note { get; set; }
    public DateTime? ExpireAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<PaymentResponseDto> Payments { get; set; } = new();
    public List<BookingSlotResponseDto> Slots { get; set; } = new();
}

public class BookingSlotResponseDto
{
    public Guid Id { get; set; }
    public string SlotDate { get; set; } = null!;
    public string SlotStartTime { get; set; } = null!;
    public string SlotEndTime { get; set; } = null!;
    public string Status { get; set; } = null!;
}

public class PaymentResponseDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? TransactionCode { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
