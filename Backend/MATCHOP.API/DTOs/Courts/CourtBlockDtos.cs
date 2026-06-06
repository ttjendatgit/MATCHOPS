namespace MATCHOP.API.DTOs.Courts;

public class CreateCourtBlockDto
{
    public Guid CourtId { get; set; }
    public DateOnly BlockDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? Reason { get; set; }
}

public class CancelCourtBlockDto
{
    public string? Reason { get; set; }
}

public class CourtBlockResponseDto
{
    public Guid Id { get; set; }
    public Guid VenueId { get; set; }
    public Guid CourtId { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public string VenueName { get; set; } = string.Empty;
    public string BlockDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
