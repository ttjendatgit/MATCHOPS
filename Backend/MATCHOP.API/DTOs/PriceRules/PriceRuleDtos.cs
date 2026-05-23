using MATCHOP.API.Enums;

namespace MATCHOP.API.DTOs.PriceRules;

public class CreatePriceRuleDto
{
    public Guid CourtId { get; set; }

    public DayType DayType { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public decimal PricePerHour { get; set; }
}

public class UpdatePriceRuleDto
{
    public DayType? DayType { get; set; }

    public TimeOnly? StartTime { get; set; }

    public TimeOnly? EndTime { get; set; }

    public decimal? PricePerHour { get; set; }
}

public class UpdatePriceRuleStatusDto
{
    public PriceRuleStatus Status { get; set; }
}

public class PriceRuleResponseDto
{
    public Guid Id { get; set; }

    public Guid CourtId { get; set; }

    public string CourtName { get; set; } = string.Empty;

    public string DayType { get; set; } = string.Empty;

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public decimal PricePerHour { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}