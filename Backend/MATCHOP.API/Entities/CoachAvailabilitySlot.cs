namespace MATCHOP.API.Entities;

public class CoachAvailabilitySlot
{
    public Guid Id { get; set; }

    public Guid CoachProfileId { get; set; }
    public CoachProfile CoachProfile { get; set; } = null!;

    /// <summary>
    /// Matches System.DayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
    /// </summary>
    public int DayOfWeek { get; set; }

    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public bool IsEnabled { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
