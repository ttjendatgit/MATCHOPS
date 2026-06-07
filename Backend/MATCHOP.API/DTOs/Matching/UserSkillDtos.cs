using MATCHOP.API.Enums;

namespace MATCHOP.API.DTOs.Matching
{
    public class UpdateUserSkillDto
    {
        public Guid SportId { get; set; }
        public SkillLevel Level { get; set; }
    }

    public class UserSkillResponseDto
    {
        public Guid SportId { get; set; }
        public string SportName { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }
}
