namespace MATCHOP.API.DTOs.Courts;

public class CourtAvailabilityResponseDto
{
    public Guid CourtId { get; set; }
    public string CourtName { get; set; } = null!;
    public string VenueName { get; set; } = null!;
    public string Date { get; set; } = null!;
    public string OpeningTime { get; set; } = null!;
    public string ClosingTime { get; set; } = null!;
    public List<AvailabilitySlotDto> Slots { get; set; } = new();
}

public class AvailabilitySlotDto
{
    public string StartTime { get; set; } = null!;
    public string EndTime { get; set; } = null!;
    public string Status { get; set; } = null!;
    public decimal? Price { get; set; }
}