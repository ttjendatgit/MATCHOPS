using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

/// <summary>
/// Created automatically when a coach accepts a CoachSessionRequest. Kept as
/// its own entity (not the existing Booking) because it isn't court/venue
/// shaped and Payment.BookingId is a required, non-nullable FK — reusing
/// Payment/Booking here would mean weakening a live, working constraint.
/// Payment traceability is intentionally minimal (PaymentTransactionCode)
/// rather than a full Payment-row mirror, matching MVP scope.
/// </summary>
public class CoachSession
{
    public Guid Id { get; set; }

    public Guid CoachSessionRequestId { get; set; }
    public CoachSessionRequest CoachSessionRequest { get; set; } = null!;

    public Guid CoachProfileId { get; set; }
    public CoachProfile CoachProfile { get; set; } = null!;

    public Guid RequesterId { get; set; }
    public User Requester { get; set; } = null!;

    public Guid? SportId { get; set; }
    public Sport? Sport { get; set; }

    public DateOnly? ScheduledDate { get; set; }
    public string? ScheduledTimeSlot { get; set; }
    public int? DurationMinutes { get; set; }
    public string? LocationNote { get; set; }

    public decimal? PriceAmount { get; set; }
    public string Currency { get; set; } = "VND";

    public CoachSessionStatus Status { get; set; } = CoachSessionStatus.AWAITING_PAYMENT;
    public CoachSessionPaymentStatus PaymentStatus { get; set; } = CoachSessionPaymentStatus.UNPAID;
    public string? PaymentTransactionCode { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
