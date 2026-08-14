using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MATCHOP.API.Services;

public interface ISePayApiService
{
    /// <summary>
    /// Tìm giao dịch tiền vào khớp nội dung CK và số tiền (dùng khi webhook chưa kích hoạt).
    /// </summary>
    Task<SePayTransactionMatch?> FindIncomingTransactionAsync(
        string paymentContent,
        long expectedAmount,
        CancellationToken cancellationToken = default);

    /// <summary>True khi SePay:ApiToken đã được cấu hình trên server.</summary>
    bool IsConfigured { get; }
}

public class SePayTransactionMatch
{
    public string TransactionId { get; set; } = null!;
    public long AmountIn { get; set; }
    public string TransactionContent { get; set; } = null!;
}

public class SePayApiService : ISePayApiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<SePayApiService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString,
    };

    public SePayApiService(HttpClient httpClient, IConfiguration config, ILogger<SePayApiService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_config["SePay:ApiToken"]);

    public async Task<SePayTransactionMatch?> FindIncomingTransactionAsync(
        string paymentContent,
        long expectedAmount,
        CancellationToken cancellationToken = default)
    {
        var apiToken = _config["SePay:ApiToken"];
        if (string.IsNullOrWhiteSpace(apiToken))
        {
            _logger.LogWarning("SePay ApiToken chưa cấu hình — không thể tra cứu giao dịch {Content}", paymentContent);
            return null;
        }

        var normalizedContent = paymentContent.Trim().ToUpperInvariant();
        var dateFrom = Uri.EscapeDataString(DateTime.UtcNow.AddDays(-14).ToString("yyyy-MM-dd HH:mm:ss"));

        // Thử nhiều chiến lược tìm kiếm (SePay v2 hỗ trợ transaction_content LIKE và q multi-field)
        var queryVariants = new[]
        {
            $"transaction_content={Uri.EscapeDataString(normalizedContent)}&transfer_type=in&amount_in_min={expectedAmount - 1}&amount_in_max={expectedAmount + 1}&transaction_date_from={dateFrom}&per_page=50&transaction_date_sort=desc",
            $"q={Uri.EscapeDataString(normalizedContent)}&transfer_type=in&amount_in_min={expectedAmount - 1}&amount_in_max={expectedAmount + 1}&transaction_date_from={dateFrom}&per_page=50&transaction_date_sort=desc",
            $"q={Uri.EscapeDataString(normalizedContent)}&transfer_type=in&transaction_date_from={dateFrom}&per_page=50&transaction_date_sort=desc",
        };

        foreach (var query in queryVariants)
        {
            var match = await QueryTransactionsAsync(apiToken, query, normalizedContent, expectedAmount, cancellationToken);
            if (match is not null)
                return match;
        }

        _logger.LogInformation(
            "SePay API: no incoming transaction matched content={Content} amount={Amount}",
            normalizedContent,
            expectedAmount);

        return null;
    }

    private async Task<SePayTransactionMatch?> QueryTransactionsAsync(
        string apiToken,
        string queryString,
        string paymentContent,
        long expectedAmount,
        CancellationToken cancellationToken)
    {
        var url = $"https://userapi.sepay.vn/v2/transactions?{queryString}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SePay API request failed for query {Query}", queryString);
            return null;
        }

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning(
                "SePay API returned {StatusCode} for query {Query}. Body={Body}",
                (int)response.StatusCode,
                queryString,
                body.Length > 500 ? body[..500] : body);
            return null;
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var payload = await JsonSerializer.DeserializeAsync<SePayTransactionsListResponse>(
            stream,
            JsonOptions,
            cancellationToken);

        if (payload?.Data is null || payload.Data.Count == 0)
            return null;

        foreach (var tx in payload.Data)
        {
            if (!string.Equals(tx.TransferType, "in", StringComparison.OrdinalIgnoreCase))
                continue;

            var content = tx.TransactionContent ?? tx.Code ?? string.Empty;
            if (!ContentMatches(content, paymentContent))
                continue;

            var amount = ParseAmount(tx.AmountIn);
            if (Math.Abs(amount - expectedAmount) > 1)
                continue;

            return new SePayTransactionMatch
            {
                TransactionId = tx.Id ?? string.Empty,
                AmountIn = amount,
                TransactionContent = content,
            };
        }

        return null;
    }

    private static bool ContentMatches(string haystack, string memCode) =>
        haystack.Contains(memCode, StringComparison.OrdinalIgnoreCase);

    private static long ParseAmount(object? value)
    {
        return value switch
        {
            null => 0,
            long l => l,
            int i => i,
            decimal d => (long)Math.Round(d),
            double dbl => (long)Math.Round(dbl),
            JsonElement el when el.ValueKind == JsonValueKind.Number =>
                el.TryGetInt64(out var n) ? n : (long)Math.Round(el.GetDecimal()),
            JsonElement el when el.ValueKind == JsonValueKind.String &&
                long.TryParse(el.GetString(), out var parsed) => parsed,
            _ when long.TryParse(value.ToString(), out var parsed) => parsed,
            _ => 0,
        };
    }

    private sealed class SePayTransactionsListResponse
    {
        public string? Status { get; set; }
        public List<SePayTransactionItem> Data { get; set; } = [];
    }

    private sealed class SePayTransactionItem
    {
        public string? Id { get; set; }

        [JsonPropertyName("amount_in")]
        public object? AmountIn { get; set; }

        [JsonPropertyName("transaction_content")]
        public string? TransactionContent { get; set; }

        public string? Code { get; set; }

        [JsonPropertyName("transfer_type")]
        public string? TransferType { get; set; }
    }
}
