namespace MATCHOP.API.DTOs.Coaches;

public class CoachAvailabilitySlotResponseDto
{
    public Guid Id { get; set; }

    /// <summary>0 = Sunday ... 6 = Saturday (System.DayOfWeek convention).</summary>
    public int DayOfWeek { get; set; }

    /// <summary>"HH:mm"</summary>
    public string StartTime { get; set; } = string.Empty;

    /// <summary>"HH:mm"</summary>
    public string EndTime { get; set; } = string.Empty;

    public bool IsEnabled { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}

public class CoachAvailabilitySlotInputDto
{
    public int DayOfWeek { get; set; }

    public string StartTime { get; set; } = string.Empty;

    public string EndTime { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = true;
}

public class UpdateCoachAvailabilityRequestDto
{
    public List<CoachAvailabilitySlotInputDto> Slots { get; set; } = new();
}
