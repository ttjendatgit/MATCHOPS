using MATCHOP.API.Enums;

namespace MATCHOP.API.DTOs.Chat
{
    public class ConversationDto
    {
        public Guid Id { get; set; }
        public string? Title { get; set; }
        public ConversationType Type { get; set; }
        public DateTime LastMessageAt { get; set; }
        public MessageDto? LastMessage { get; set; }
        public int UnreadCount { get; set; }
        public List<ParticipantDto> Participants { get; set; } = new();
    }

    public class ParticipantDto
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
    }

    public class MessageDto
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public Guid SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
    }

    public class SendMessageDto
    {
        public Guid ConversationId { get; set; }
        public string Content { get; set; } = string.Empty;
    }

    public class NotificationDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public NotificationType Type { get; set; }
        public string? Metadata { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
