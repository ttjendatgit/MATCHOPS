using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities
{
    public class UserSkill
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public Guid SportId { get; set; }
        public Sport Sport { get; set; } = null!;
        public SkillLevel Level { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
