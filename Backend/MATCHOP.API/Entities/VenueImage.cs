using MATCHOP.API.Entities;

public class VenueImage
{
    public Guid Id { get; set; }

    public Guid VenueId { get; set; }

    public Venue Venue { get; set; } = null!;

    public string ImageUrl { get; set; } = string.Empty;

    public string? PublicId { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}