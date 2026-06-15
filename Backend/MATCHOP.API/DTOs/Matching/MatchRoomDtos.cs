namespace MATCHOP.API.DTOs.Matching
{
    public class MatchRoomResponseDto
    {
        public Guid Id { get; set; }
        public Guid SportId { get; set; }
        public string SportName { get; set; } = string.Empty;
        public Guid? MatchPostId { get; set; }
        public Guid? ConversationId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        // Post-linked fields (empty/null for queue-based rooms where MatchPost is null)
        public string PostCity { get; set; } = string.Empty;
        public string PostDistrict { get; set; } = string.Empty;
        public DateTime? PostPreferredTime { get; set; }
        public string PostMinSkillLevel { get; set; } = string.Empty;
        public string PostMaxSkillLevel { get; set; } = string.Empty;
        public int SlotsNeeded { get; set; }
        public int SlotsFilled { get; set; }
        public string PostStatus { get; set; } = string.Empty;
        public Guid? OwnerUserId { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public List<MatchRoomPlayerDto> Players { get; set; } = new List<MatchRoomPlayerDto>();
    }

    public class MatchRoomPlayerDto
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public bool IsHost { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
    }
}
