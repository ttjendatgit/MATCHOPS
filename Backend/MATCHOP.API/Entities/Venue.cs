using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class Venue
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
    public string City { get; set; } = null!;
    public string District { get; set; } = null!;
    public string? Ward { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Description { get; set; }
    public TimeOnly OpeningTime { get; set; }
    public string? CoverImageUrl { get; set; }
    public TimeOnly ClosingTime { get; set; }
    public VenueStatus Status { get; set; } = VenueStatus.DRAFT;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Owner { get; set; } = null!;
    public ICollection<Court> Courts { get; set; } = new List<Court>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<CourtBlock> CourtBlocks { get; set; } = new List<CourtBlock>();
}