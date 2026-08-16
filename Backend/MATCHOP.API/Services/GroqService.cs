using System.Net;
using System.Text;
using System.Text.Json;
using MATCHOP.API.Helpers;

namespace MATCHOP.API.Services
{
    public interface IGroqService
    {
        Task<string> GetChatCompletionAsync(List<GroqMessage> messages, CancellationToken cancellationToken = default, int maxTokens = 1024);
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
        private readonly ILogger<GroqService> _logger;
        private const string GroqUrl = "https://api.groq.com/openai/v1/chat/completions";
        private const int MaxAttempts = 3;

        public GroqService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GroqService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> GetChatCompletionAsync(
            List<GroqMessage> messages,
            CancellationToken cancellationToken = default,
            int maxTokens = 1024)
        {
            var apiKey = _configuration["Groq:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new AppException(
                    ErrorCodes.InternalServerError,
                    "AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.",
                    StatusCodes.Status503ServiceUnavailable);
            }

            var requestBody = new
            {
                model = "llama-3.3-70b-versatile",
                messages,
                temperature = 0.3,
                max_tokens = maxTokens
            };

            var payload = JsonSerializer.Serialize(requestBody);

            for (var attempt = 1; attempt <= MaxAttempts; attempt++)
            {
                cancellationToken.ThrowIfCancellationRequested();

                using var request = new HttpRequestMessage(HttpMethod.Post, GroqUrl);
                request.Headers.Add("Authorization", $"Bearer {apiKey}");
                request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    using var doc = JsonDocument.Parse(responseContent);
                    return doc.RootElement
                        .GetProperty("choices")[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString() ?? string.Empty;
                }

                if (response.StatusCode == HttpStatusCode.TooManyRequests && attempt < MaxAttempts)
                {
                    var delay = GetRetryDelay(response, attempt);
                    _logger.LogWarning(
                        "Groq rate limit (429). Retry {Attempt}/{MaxAttempts} after {DelayMs}ms",
                        attempt,
                        MaxAttempts,
                        delay.TotalMilliseconds);
                    await Task.Delay(delay, cancellationToken);
                    continue;
                }

                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Groq API error {StatusCode}: {Body}",
                    (int)response.StatusCode,
                    errorBody);

                throw MapGroqFailure(response.StatusCode);
            }

            throw MapGroqFailure(HttpStatusCode.TooManyRequests);
        }

        private static TimeSpan GetRetryDelay(HttpResponseMessage response, int attempt)
        {
            TimeSpan delay;

            if (response.Headers.RetryAfter?.Delta is TimeSpan retryAfter)
            {
                delay = retryAfter;
            }
            else if (response.Headers.RetryAfter?.Date is DateTimeOffset retryDate)
            {
                delay = retryDate - DateTimeOffset.UtcNow;
                if (delay <= TimeSpan.Zero)
                    delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
            }
            else
            {
                delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
            }

            // Groq có thể trả Retry-After ~11 phút — cap để không treo request
            return delay > TimeSpan.FromSeconds(8) ? TimeSpan.FromSeconds(8) : delay;
        }

        private static AppException MapGroqFailure(HttpStatusCode statusCode)
        {
            return statusCode switch
            {
                HttpStatusCode.TooManyRequests => new AppException(
                    ErrorCodes.AiRateLimited,
                    "AI đang quá tải (giới hạn Groq). Vui lòng thử lại sau vài giây.",
                    StatusCodes.Status429TooManyRequests),
                HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden => new AppException(
                    ErrorCodes.InternalServerError,
                    "AI chưa được cấu hình đúng. Vui lòng liên hệ quản trị viên.",
                    StatusCodes.Status503ServiceUnavailable),
                HttpStatusCode.BadRequest => new AppException(
                    ErrorCodes.ValidationError,
                    "Không thể xử lý yêu cầu AI. Vui lòng thử câu hỏi ngắn hơn.",
                    StatusCodes.Status400BadRequest),
                _ => new AppException(
                    ErrorCodes.InternalServerError,
                    "AI tạm thời không phản hồi. Vui lòng thử lại sau.",
                    StatusCodes.Status503ServiceUnavailable),
            };
        }
    }
}
