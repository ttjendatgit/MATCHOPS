using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class Court
{
    public Guid Id { get; set; }


    public Guid VenueId { get; set; }

    public Guid SportId { get; set; }
  
    public string Name { get; set; } = null!;

    public string? Type { get; set; }
    public int? Capacity { get; set; }

    public string? LocationNote { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }


    public string? ImagePublicId { get; set; }

    public CourtStatus Status { get; set; } = CourtStatus.ACTIVE;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Venue Venue { get; set; } = null!;

    public Sport Sport { get; set; } = null!;

    public ICollection<CourtImage> Images { get; set; } = new List<CourtImage>();

    public ICollection<PriceRule> PriceRules { get; set; } = new List<PriceRule>();

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public ICollection<BookingSlot> BookingSlots { get; set; } = new List<BookingSlot>();

    public ICollection<CourtBlock> CourtBlocks { get; set; } = new List<CourtBlock>();
}