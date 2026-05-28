using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities
{
    public class MatchQueue
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public Guid SportId { get; set; }
        public Sport Sport { get; set; } = null!;
        public SkillLevel SkillLevel { get; set; }
        public string City { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public DateTime PreferredTimeStart { get; set; }
        public DateTime PreferredTimeEnd { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}
