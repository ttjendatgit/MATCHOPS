using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities
{
    public class Conversation
    {
        public Guid Id { get; set; }
        public string? Title { get; set; }
        public ConversationType Type { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

        // Relationships
        public ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }

    public class ConversationParticipant
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public Conversation Conversation { get; set; } = null!;
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastReadAt { get; set; }
    }

    public class Message
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public Conversation Conversation { get; set; } = null!;
        public Guid SenderId { get; set; }
        public User Sender { get; set; } = null!;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; }
    }

    public class Notification
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public NotificationType Type { get; set; }
        public string? Metadata { get; set; } // JSON metadata for redirection
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class UserConnection
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public string ConnectionId { get; set; } = string.Empty;
        public DateTime ConnectedAt { get; set; } = DateTime.UtcNow;
    }
}
