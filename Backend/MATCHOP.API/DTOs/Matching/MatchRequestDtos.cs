namespace MATCHOP.API.DTOs.Matching
{
    public class CreateMatchRequestDto
    {
        public Guid PostId { get; set; }
        // ReceiverUserId is now derived from the post on the backend; kept for backward compat but ignored.
        public Guid? ReceiverUserId { get; set; }
    }

    public class MatchRequestResponseDto
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public string SportName { get; set; } = string.Empty;
        public Guid SenderUserId { get; set; }
        public string SenderFullName { get; set; } = string.Empty;
        public string? SenderAvatar { get; set; }
        public Guid ReceiverUserId { get; set; }
        public string ReceiverFullName { get; set; } = string.Empty;
        public string? ReceiverAvatar { get; set; }
        public string PostDistrict { get; set; } = string.Empty;
        public string PostCity { get; set; } = string.Empty;
        public DateTime PostPreferredTime { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public Guid? RoomId { get; set; }
    }
}
