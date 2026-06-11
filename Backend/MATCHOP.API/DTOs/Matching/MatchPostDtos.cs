using MATCHOP.API.Enums;

namespace MATCHOP.API.DTOs.Matching
{
    public class CreateMatchPostDto
    {
        public Guid SportId { get; set; }
        public SkillLevel MinSkillLevel { get; set; }
        public SkillLevel MaxSkillLevel { get; set; }
        public string City { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public DateTime PreferredTime { get; set; }
        public int SlotsNeeded { get; set; }
        public string? Note { get; set; }
    }

    public class UpdateMatchPostDto
    {
        public SkillLevel? MinSkillLevel { get; set; }
        public SkillLevel? MaxSkillLevel { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public DateTime? PreferredTime { get; set; }
        public int? SlotsNeeded { get; set; }
        public string? Note { get; set; }
        public MatchPostStatus? Status { get; set; }
    }

    public class MatchPostResponseDto
    {
        public Guid Id { get; set; }
        public Guid CreatorId { get; set; }
        public string CreatorName { get; set; } = string.Empty;
        public string? CreatorAvatar { get; set; }
        public Guid SportId { get; set; }
        public string SportName { get; set; } = string.Empty;
        public string MinSkillLevel { get; set; } = string.Empty;
        public string MaxSkillLevel { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public DateTime PreferredTime { get; set; }
        public int SlotsNeeded { get; set; }
        public int SlotsFilled { get; set; }
        public string? Note { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class MatchPostFilterDto
    {
        public Guid? SportId { get; set; }
        public Guid? CreatorId { get; set; }
        public SkillLevel? Level { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public DateTime? Date { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
