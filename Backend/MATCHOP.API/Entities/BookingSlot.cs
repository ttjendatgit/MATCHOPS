using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class BookingSlot
{
    public Guid Id { get; set; }
    public Guid? BookingId { get; set; }
    public Guid CourtId { get; set; }
    public DateOnly SlotDate { get; set; }
    public TimeOnly SlotStartTime { get; set; }
    public TimeOnly SlotEndTime { get; set; }
    public BookingSlotStatus Status { get; set; } = BookingSlotStatus.HOLDING;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Booking? Booking { get; set; }
    public Court Court { get; set; } = null!;
}