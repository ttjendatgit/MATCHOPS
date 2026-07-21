using MATCHOP.API.Enums;

namespace MATCHOP.API.DTOs.Coaches;

public class CoachApplyRequestDto
{
    public string? DisplayName { get; set; }

    public string? Bio { get; set; }

    public int ExperienceYears { get; set; }

    public decimal HourlyRate { get; set; }

    public string City { get; set; } = string.Empty;

    public string District { get; set; } = string.Empty;

    public string? Achievements { get; set; }

    public List<Guid> SportIds { get; set; } = new();
}

public class CoachUpdateMyProfileRequestDto
{
    public string? DisplayName { get; set; }

    public string? Bio { get; set; }

    public int? ExperienceYears { get; set; }

    public decimal? HourlyRate { get; set; }

    public string? City { get; set; }

    public string? District { get; set; }

    public string? Achievements { get; set; }

    public List<Guid>? SportIds { get; set; }
}

public class CoachSportResponseDto
{
    public Guid SportId { get; set; }

    public string SportName { get; set; } = string.Empty;
}

public class CoachProofResponseDto
{
    public Guid Id { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public string ProofType { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class UploadCoachProofRequestDto
{
    public List<IFormFile> Files { get; set; } = new();

    public CoachProofType ProofType { get; set; }
}

public class CoachProfileMeResponseDto
{
    public Guid Id { get; set; }

    public string? DisplayName { get; set; }

    public string? Bio { get; set; }

    public int? ExperienceYears { get; set; }

    public decimal? HourlyRate { get; set; }

    public string City { get; set; } = string.Empty;

    public string District { get; set; } = string.Empty;

    public string? Achievements { get; set; }

    public string Email { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? RejectionReason { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public List<CoachSportResponseDto> Sports { get; set; } = new();

    public List<CoachProofResponseDto> Proofs { get; set; } = new();
}
