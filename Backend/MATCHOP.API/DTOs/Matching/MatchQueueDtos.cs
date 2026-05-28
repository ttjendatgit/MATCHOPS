using MATCHOP.API.Enums;

namespace MATCHOP.API.DTOs.Matching
{
    public class JoinQueueDto
    {
        public Guid SportId { get; set; }
        public string City { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public DateTime PreferredTimeStart { get; set; }
        public DateTime PreferredTimeEnd { get; set; }
    }

    public class MatchQueueResponseDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid SportId { get; set; }
        public string SportName { get; set; } = string.Empty;
        public string SkillLevel { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public DateTime PreferredTimeStart { get; set; }
        public DateTime PreferredTimeEnd { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}
