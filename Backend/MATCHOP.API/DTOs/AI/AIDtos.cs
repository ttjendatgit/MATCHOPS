namespace MATCHOP.API.DTOs.AI
{
    public class ChatRequestDto
    {
        public string Message { get; set; } = string.Empty;
        public Guid? ConversationId { get; set; }
    }

    public class ChatResponseDto
    {
        public string Response { get; set; } = string.Empty;
        public Guid ConversationId { get; set; }
        public Guid Id { get; set; }
        public DateTime Timestamp { get; set; }
        public List<ChatMessageDto> History { get; set; } = new();
    }

    public class ChatMessageDto
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
    
    public class AIConversationDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? LastMessage { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
    
    public class RenameConversationDto
    {
        public string Title { get; set; } = string.Empty;
    }
}
