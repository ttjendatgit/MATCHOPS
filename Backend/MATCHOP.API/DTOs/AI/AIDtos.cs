namespace MATCHOP.API.DTOs.AI
{
    public class ChatRequestDto
    {
        public string Message { get; set; } = string.Empty;
    }

    public class ChatResponseDto
    {
        public string Response { get; set; } = string.Empty;
        public List<ChatMessageDto> History { get; set; } = new();
    }

    public class ChatMessageDto
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
