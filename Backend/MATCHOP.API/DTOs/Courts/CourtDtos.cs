using MATCHOP.API.Enums;

namespace MATCHOP.API.DTOs.Courts;

public class CreateCourtDto
{
    public Guid VenueId { get; set; }

    public Guid SportId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Type { get; set; }

    public int? Capacity { get; set; }

    public string? LocationNote { get; set; }

    public string? Description { get; set; }

    // Upload nhiều ảnh từ máy
    public List<IFormFile>? Images { get; set; }

    // Ảnh nào là ảnh đại diện chính, tính từ 0
    public int? PrimaryImageIndex { get; set; }
}

public class UpdateCourtDto
{
    public Guid? SportId { get; set; }

    public string? Name { get; set; }

    public string? Type { get; set; }

    public int? Capacity { get; set; }

    public string? LocationNote { get; set; }

    public string? Description { get; set; }
}

public class UpdateCourtStatusDto
{
    public CourtStatus Status { get; set; }
}

public class CourtImageResponseDto
{
    public Guid Id { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public bool IsPrimary { get; set; }

    public int SortOrder { get; set; }
}

public class CourtResponseDto
{
    public Guid Id { get; set; }

    public Guid VenueId { get; set; }

    public string VenueName { get; set; } = string.Empty;

    // Vị trí thật lấy từ Venue
    public string VenueAddress { get; set; } = string.Empty;

    public string VenueCity { get; set; } = string.Empty;

    public string VenueDistrict { get; set; } = string.Empty;

    public string? VenueWard { get; set; }

    public decimal? VenueLatitude { get; set; }

    public decimal? VenueLongitude { get; set; }

    public Guid SportId { get; set; }

    public string SportName { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Type { get; set; }

    public int? Capacity { get; set; }

    public string? LocationNote { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public List<CourtImageResponseDto> Images { get; set; } = new();

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}