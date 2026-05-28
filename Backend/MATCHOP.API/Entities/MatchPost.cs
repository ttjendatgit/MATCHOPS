using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities
{
    public class MatchPost
    {
        public Guid Id { get; set; }
        public Guid CreatorId { get; set; }
        public User Creator { get; set; } = null!;
        public Guid SportId { get; set; }
        public Sport Sport { get; set; } = null!;
        public SkillLevel MinSkillLevel { get; set; }
        public SkillLevel MaxSkillLevel { get; set; }
        public string City { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public DateTime PreferredTime { get; set; }
        public int SlotsNeeded { get; set; }
        public int SlotsFilled { get; set; }
        public string? Note { get; set; }
        public MatchPostStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        public ICollection<MatchRoom> MatchRooms { get; set; } = new List<MatchRoom>();
    }
}
