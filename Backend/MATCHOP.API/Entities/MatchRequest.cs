using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities
{
    public class MatchRequest
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public MatchPost Post { get; set; } = null!;
        public Guid SenderUserId { get; set; }
        public User SenderUser { get; set; } = null!;
        public Guid ReceiverUserId { get; set; }
        public User ReceiverUser { get; set; } = null!;
        public MatchRequestStatus Status { get; set; } = MatchRequestStatus.PENDING;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RespondedAt { get; set; }
    }

    public enum MatchRequestStatus
    {
        PENDING = 1,
        ACCEPTED = 2,
        REJECTED = 3,
        CANCELLED = 4
    }
}
