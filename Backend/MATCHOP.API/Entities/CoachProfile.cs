using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class CoachProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public int? ExperienceYears { get; set; }
    public decimal? HourlyRate { get; set; }
    public string City { get; set; } = null!;
    public string District { get; set; } = null!;
    public string? Achievements { get; set; }

    public CoachProfileStatus Status { get; set; } = CoachProfileStatus.PENDING_APPROVAL;
    public string? RejectionReason { get; set; }
    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<CoachSport> CoachSports { get; set; } = new List<CoachSport>();
    public ICollection<CoachProfileProof> Proofs { get; set; } = new List<CoachProfileProof>();
}
