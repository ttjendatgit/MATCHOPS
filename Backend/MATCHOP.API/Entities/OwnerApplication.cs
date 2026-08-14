using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class OwnerApplication
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string BusinessName { get; set; } = null!;
    public string ContactPhone { get; set; } = null!;
    public string Address { get; set; } = null!;
    public string City { get; set; } = null!;
    public string District { get; set; } = null!;
    public string? Description { get; set; }
    public string? BusinessLicenseNumber { get; set; }

    public OwnerApplicationStatus Status { get; set; } = OwnerApplicationStatus.PENDING_APPROVAL;
    public string? RejectionReason { get; set; }
    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
