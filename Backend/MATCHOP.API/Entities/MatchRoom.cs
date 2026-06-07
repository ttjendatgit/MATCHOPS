using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities
{
    public class MatchRoom
    {
        public Guid Id { get; set; }
        public Guid SportId { get; set; }
        public Sport Sport { get; set; } = null!;
        public Guid? MatchPostId { get; set; }
        public MatchPost? MatchPost { get; set; }
        public MatchRoomStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ICollection<MatchRoomPlayer> Players { get; set; } = new List<MatchRoomPlayer>();
    }
}
