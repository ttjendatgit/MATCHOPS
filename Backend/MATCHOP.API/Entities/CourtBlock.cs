using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class CourtBlock
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public Guid VenueId { get; set; }
    public Guid CourtId { get; set; }
    public DateOnly BlockDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? Reason { get; set; }
    public CourtBlockStatus Status { get; set; } = CourtBlockStatus.ACTIVE;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Owner { get; set; } = null!;
    public Venue Venue { get; set; } = null!;
    public Court Court { get; set; } = null!;
}