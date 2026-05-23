namespace MATCHOP.API.DTOs.Bookings;

public class CreateBookingDto
{
    public Guid CourtId { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? Note { get; set; }
}

public class BookingResponseDto
{
    public Guid Id { get; set; }
    public Guid CourtId { get; set; }
    public string CourtName { get; set; } = null!;
    public string VenueName { get; set; } = null!;
    public string VenueAddress { get; set; } = null!;
    public string SportName { get; set; } = null!;
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