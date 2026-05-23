namespace MATCHOP.API.Entities;

public class CourtImage
{
    public Guid Id { get; set; }

    public Guid CourtId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public string PublicId { get; set; } = string.Empty;

    public bool IsPrimary { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Court Court { get; set; } = null!;
}