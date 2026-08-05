namespace MATCHOP.API.Entities;

public class CoachPortfolioImage
{
    public Guid Id { get; set; }
    public Guid CoachProfileId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;
    public string PublicId { get; set; } = string.Empty;
    public string? Caption { get; set; }

    public int SortOrder { get; set; }
    public bool IsCover { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public CoachProfile CoachProfile { get; set; } = null!;
}
