using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class CoachSessionRequest
{
    public Guid Id { get; set; }

    public Guid CoachProfileId { get; set; }
    public CoachProfile CoachProfile { get; set; } = null!;

    public Guid RequesterId { get; set; }
    public User Requester { get; set; } = null!;

    public Guid? SportId { get; set; }
    public Sport? Sport { get; set; }

    public DateOnly? PreferredDate { get; set; }
    public string? PreferredTimeSlot { get; set; }
    public int? DurationMinutes { get; set; }
    public string? LocationNote { get; set; }
    public string? Message { get; set; }

    public CoachSessionRequestStatus Status { get; set; } = CoachSessionRequestStatus.PENDING;
    public string? CoachResponseMessage { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
}
