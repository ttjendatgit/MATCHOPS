namespace MATCHOP.API.Entities;

public class CoachSport
{
    public Guid Id { get; set; }
    public Guid CoachProfileId { get; set; }
    public Guid SportId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public CoachProfile CoachProfile { get; set; } = null!;
    public Sport Sport { get; set; } = null!;
}
