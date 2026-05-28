using MATCHOP.API.Enums;

namespace MATCHOP.API.DTOs.Matching
{
    public class MatchRoomResponseDto
    {
        public Guid Id { get; set; }
        public Guid SportId { get; set; }
        public string SportName { get; set; } = string.Empty;
        public Guid? MatchPostId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
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
