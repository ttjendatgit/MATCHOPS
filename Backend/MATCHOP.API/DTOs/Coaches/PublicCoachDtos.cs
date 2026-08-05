namespace MATCHOP.API.DTOs.Coaches;

public class PublicCoachListItemDto
{
    public Guid Id { get; set; }

    public string DisplayName { get; set; } = string.Empty;

    public string? BioPreview { get; set; }

    public int? ExperienceYears { get; set; }

    public decimal? HourlyRate { get; set; }

    public string City { get; set; } = string.Empty;

    public string District { get; set; } = string.Empty;

    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<CoachSportResponseDto> Sports { get; set; } = new();

    /// <summary>Cover portfolio image only — the full gallery lives on the detail page.</summary>
    public string? CoverImageUrl { get; set; }
}

public class PublicCoachDetailDto
{
    public Guid Id { get; set; }

    public string DisplayName { get; set; } = string.Empty;

    public string? Bio { get; set; }

    public int? ExperienceYears { get; set; }

    public decimal? HourlyRate { get; set; }

    public string City { get; set; } = string.Empty;

    public string District { get; set; } = string.Empty;

    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<CoachSportResponseDto> Sports { get; set; } = new();

    public List<CoachPortfolioImageResponseDto> PortfolioImages { get; set; } = new();
}

public class PublicCoachListResponseDto
{
    public List<PublicCoachListItemDto> Items { get; set; } = new();

    public int TotalCount { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }
}
