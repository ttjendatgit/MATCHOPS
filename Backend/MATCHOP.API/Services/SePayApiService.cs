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

    public SePayApiService(HttpClient httpClient, IConfiguration config, ILogger<SePayApiService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    public async Task<SePayTransactionMatch?> FindIncomingTransactionAsync(
        string paymentContent,
        long expectedAmount,
        CancellationToken cancellationToken = default)
    {
        var apiToken = _config["SePay:ApiToken"];
        if (string.IsNullOrWhiteSpace(apiToken))
        {
            _logger.LogDebug("SePay ApiToken not configured — skip transaction lookup.");
            return null;
        }

        var query = Uri.EscapeDataString(paymentContent);
        var url =
            $"https://userapi.sepay.vn/v2/transactions?q={query}&transfer_type=in&per_page=20&transaction_date_sort=desc";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SePay API request failed for content {Content}", paymentContent);
            return null;
        }

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "SePay API returned {StatusCode} for content {Content}",
                (int)response.StatusCode,
                paymentContent);
            return null;
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var payload = await JsonSerializer.DeserializeAsync<SePayTransactionsListResponse>(
            stream,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
            cancellationToken);

        if (payload?.Data is null || payload.Data.Count == 0)
            return null;

        foreach (var tx in payload.Data)
        {
            if (!string.Equals(tx.TransferType, "in", StringComparison.OrdinalIgnoreCase))
                continue;

            var content = tx.TransactionContent ?? string.Empty;
            if (!content.Contains(paymentContent, StringComparison.OrdinalIgnoreCase))
                continue;

            var amount = tx.AmountIn;
            if (Math.Abs(amount - expectedAmount) > 1)
                continue;

            return new SePayTransactionMatch
            {
                TransactionId = tx.Id ?? string.Empty,
                AmountIn = amount,
                TransactionContent = content
            };
        }

        return null;
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
        public long AmountIn { get; set; }

        [JsonPropertyName("transaction_content")]
        public string? TransactionContent { get; set; }

        [JsonPropertyName("transfer_type")]
        public string? TransferType { get; set; }
    }
}
