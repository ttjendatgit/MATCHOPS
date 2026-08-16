using System.ComponentModel.DataAnnotations;

namespace MATCHOP.API.Entities
{
    public class AIConversation
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public string Title { get; set; } = "Cuộc trò chuyện mới";
        public string? MetadataJson { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<AIChatMessage> Messages { get; set; } = new List<AIChatMessage>();
    }
}
