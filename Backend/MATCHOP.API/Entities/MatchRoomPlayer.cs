using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities
{
    public class MatchRoomPlayer
    {
        public Guid Id { get; set; }
        public Guid RoomId { get; set; }
        public MatchRoom Room { get; set; } = null!;
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public bool IsHost { get; set; }
        public DateTime JoinedAt { get; set; }
        public MatchRoomPlayerStatus Status { get; set; }
    }
}
