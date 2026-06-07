using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class Sport
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Description { get; set; }
    public SportStatus Status { get; set; } = SportStatus.ACTIVE;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Court> Courts { get; set; } = new List<Court>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
}