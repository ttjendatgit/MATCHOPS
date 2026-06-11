using MATCHOP.API.Entities;

namespace MATCHOP.API.DTOs.Matching
{
    public class CreateMatchRequestDto
    {
        public Guid PostId { get; set; }
        public Guid ReceiverUserId { get; set; }
    }

    public class MatchRequestResponseDto
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public string SportName { get; set; } = string.Empty;
        public Guid SenderUserId { get; set; }
        public string SenderFullName { get; set; } = string.Empty;
        public string? SenderAvatar { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
