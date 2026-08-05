namespace MATCHOP.API.DTOs.Coaches;

public class AdminCoachProfileListItemDto
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string UserFullName { get; set; } = string.Empty;

    public string UserEmail { get; set; } = string.Empty;

    public string? DisplayName { get; set; }

    public string? BioPreview { get; set; }

    public int? ExperienceYears { get; set; }

    public decimal? HourlyRate { get; set; }

    public string City { get; set; } = string.Empty;

    public string District { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string? RejectionReason { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public List<CoachSportResponseDto> Sports { get; set; } = new();
}

public class AdminCoachProfileDetailDto
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string UserFullName { get; set; } = string.Empty;

    public string UserEmail { get; set; } = string.Empty;

    public string? UserPhoneNumber { get; set; }

    public string? DisplayName { get; set; }

    public string? Bio { get; set; }

    public int? ExperienceYears { get; set; }

    public decimal? HourlyRate { get; set; }

    public string City { get; set; } = string.Empty;

    public string District { get; set; } = string.Empty;

    public string? Achievements { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? RejectionReason { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public List<CoachSportResponseDto> Sports { get; set; } = new();

    public List<CoachProofResponseDto> Proofs { get; set; } = new();

    public List<CoachVerificationDocumentResponseDto> VerificationDocuments { get; set; } = new();

    public List<CoachPortfolioImageResponseDto> PortfolioImages { get; set; } = new();
}

public class AdminCoachProfileListResponseDto
{
    public List<AdminCoachProfileListItemDto> Items { get; set; } = new();

    public int TotalCount { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }
}

public class RejectCoachProfileRequestDto
{
    public string RejectionReason { get; set; } = string.Empty;
}

public class SuspendCoachProfileRequestDto
{
    public string? Reason { get; set; }
}
