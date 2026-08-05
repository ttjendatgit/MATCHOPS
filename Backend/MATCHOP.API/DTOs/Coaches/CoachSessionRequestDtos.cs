namespace MATCHOP.API.DTOs.Coaches;

public class CreateCoachSessionRequestDto
{
    public Guid? SportId { get; set; }

    public DateOnly? PreferredDate { get; set; }

    public string? PreferredTimeSlot { get; set; }

    public int? DurationMinutes { get; set; }

    public string? LocationNote { get; set; }

    public string? Message { get; set; }
}

public class CoachRespondSessionRequestDto
{
    public string? ResponseMessage { get; set; }
}

public class CoachSessionRequestResponseDto
{
    public Guid Id { get; set; }

    public Guid CoachProfileId { get; set; }

    public string CoachDisplayName { get; set; } = string.Empty;

    public Guid RequesterId { get; set; }

    public string RequesterName { get; set; } = string.Empty;

    /// <summary>
    /// Only populated for the coach's own incoming-request view — never
    /// returned to the requester (it's their own data, redundant there) and
    /// never exposed on any public/anonymous endpoint.
    /// </summary>
    public string? RequesterEmail { get; set; }

    public string? RequesterPhoneNumber { get; set; }

    public Guid? SportId { get; set; }

    public string? SportName { get; set; }

    public DateOnly? PreferredDate { get; set; }

    public string? PreferredTimeSlot { get; set; }

    public int? DurationMinutes { get; set; }

    public string? LocationNote { get; set; }

    public string? Message { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? CoachResponseMessage { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? RespondedAt { get; set; }

    public DateTime? CancelledAt { get; set; }
}
