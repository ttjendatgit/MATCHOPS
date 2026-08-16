using MATCHOP.API.Enums;

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

public class CreateExternalBookingDto
{
    public Guid CourtId { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public BookingSource BookingSource { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class UpdateExternalBookingDto
{
    public BookingSource? BookingSource { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public DateOnly? BookingDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? Notes { get; set; }
}

public class CourtCalendarEntryDto
{
    public Guid? BookingId { get; set; }
    public Guid? BlockId { get; set; }
    public string EntryType { get; set; } = null!;
    public string StartTime { get; set; } = null!;
    public string EndTime { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? BookingSource { get; set; }
    public string? CustomerName { get; set; }
    public string? Note { get; set; }
}

public class OwnerCourtCalendarResponseDto
{
    public Guid CourtId { get; set; }
    public string CourtName { get; set; } = null!;
    public string VenueName { get; set; } = null!;
    public string Date { get; set; } = null!;
    public string OpeningTime { get; set; } = null!;
    public string ClosingTime { get; set; } = null!;
    public List<CourtCalendarEntryDto> Entries { get; set; } = new();
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
    public string? UserEmail { get; set; }
    public string BookingDate { get; set; } = null!;
    public string StartTime { get; set; } = null!;
    public string EndTime { get; set; } = null!;
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = null!;
    public string PaymentStatus { get; set; } = null!;
    public string BookingType { get; set; } = null!;
    public string BookingSource { get; set; } = null!;
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

public class BookingReportDto
{
    public DateTime GeneratedAt { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int TotalBookings { get; set; }
    public int CompletedBookings { get; set; }
    public int ConfirmedBookings { get; set; }
    public int CancelledBookings { get; set; }
    public int PendingBookings { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal CompletedRevenue { get; set; }
    public List<BookingResponseDto> Bookings { get; set; } = new();
}
