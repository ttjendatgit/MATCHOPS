using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class Booking
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public Guid? OwnerId { get; set; }
    public Guid VenueId { get; set; }
    public Guid CourtId { get; set; }
    public Guid SportId { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public decimal TotalPrice { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.PENDING_PAYMENT;
    public BookingPaymentStatus PaymentStatus { get; set; } = BookingPaymentStatus.UNPAID;
    public BookingType BookingType { get; set; } = BookingType.ONLINE;
    public BookingSource BookingSource { get; set; } = BookingSource.MATCHOP;
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public DateTime? ExpireAt { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? User { get; set; }
    public User? Owner { get; set; }
    public Venue Venue { get; set; } = null!;
    public Court Court { get; set; } = null!;
    public Sport Sport { get; set; } = null!;
    public ICollection<BookingSlot> BookingSlots { get; set; } = new List<BookingSlot>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}