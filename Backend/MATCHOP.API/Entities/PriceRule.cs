using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class PriceRule
{
    public Guid Id { get; set; }
    public Guid CourtId { get; set; }
    public DayType DayType { get; set; } = DayType.ALL;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public decimal PricePerHour { get; set; }
    public int Priority { get; set; } = 0;
    public PriceRuleStatus Status { get; set; } = PriceRuleStatus.ACTIVE;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Court Court { get; set; } = null!;
}