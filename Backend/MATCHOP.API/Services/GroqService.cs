using System.Text;
using System.Text.Json;

namespace MATCHOP.API.Services
{
    public interface IGroqService
    {
        Task<string> GetChatCompletionAsync(List<GroqMessage> messages, CancellationToken cancellationToken = default);
    }

    public class GroqMessage
    {
        public string role { get; set; } = string.Empty;
        public string content { get; set; } = string.Empty;
    }

    public class GroqService : IGroqService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private const string GroqUrl = "https://api.groq.com/openai/v1/chat/completions";

        public GroqService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> GetChatCompletionAsync(List<GroqMessage> messages, CancellationToken cancellationToken = default)
        {
            var apiKey = _configuration["Groq:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new Exception("Groq API Key is missing in configuration.");
            }

            var requestBody = new
            {
                model = "llama-3.3-70b-versatile",
                messages = messages,
                temperature = 0.7,
                max_tokens = 1024
            };

            var request = new HttpRequestMessage(HttpMethod.Post, GroqUrl);
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(responseContent);
            return doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? string.Empty;
        }
    }
}
