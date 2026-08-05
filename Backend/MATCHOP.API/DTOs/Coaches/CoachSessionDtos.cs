namespace MATCHOP.API.DTOs.Coaches;

public class CoachSessionResponseDto
{
    public Guid Id { get; set; }

    public Guid CoachSessionRequestId { get; set; }

    public Guid CoachProfileId { get; set; }

    public string CoachDisplayName { get; set; } = string.Empty;

    public Guid RequesterId { get; set; }

    public string RequesterName { get; set; } = string.Empty;

    /// <summary>Only populated for the coach's own view — see CoachSessionRequestResponseDto.</summary>
    public string? RequesterEmail { get; set; }

    public string? RequesterPhoneNumber { get; set; }

    public Guid? SportId { get; set; }

    public string? SportName { get; set; }

    public DateOnly? ScheduledDate { get; set; }

    public string? ScheduledTimeSlot { get; set; }

    public int? DurationMinutes { get; set; }

    public string? LocationNote { get; set; }

    public decimal? PriceAmount { get; set; }

    public string Currency { get; set; } = "VND";

    /// <summary>True when PriceAmount could not be auto-calculated (missing hourly rate and/or duration) and needs manual confirmation between coach and requester.</summary>
    public bool RequiresManualPricing { get; set; }

    public string Status { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = string.Empty;

    public string? PaymentTransactionCode { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}

public class PayCoachSessionRequestDto
{
    public string? TransactionCode { get; set; }
}
