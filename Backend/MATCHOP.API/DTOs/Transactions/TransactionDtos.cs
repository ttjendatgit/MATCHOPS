namespace MATCHOP.API.DTOs.Transactions;

public class TransactionHistoryQueryDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? Status { get; set; }
}

public class TransactionSummaryDto
{
    public decimal TotalAmount { get; set; }
    public decimal ThisMonthAmount { get; set; }
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
}

public class TransactionItemDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Method { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? TransactionCode { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Description { get; set; } = null!;
    public Guid? ReferenceId { get; set; }
    public string? VenueName { get; set; }
    public string? CourtName { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
}

public class TransactionHistoryResponseDto
{
    public List<TransactionItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public TransactionSummaryDto Summary { get; set; } = new();
}
