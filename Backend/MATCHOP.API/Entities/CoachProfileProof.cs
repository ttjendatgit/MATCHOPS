using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class CoachProfileProof
{
    public Guid Id { get; set; }
    public Guid CoachProfileId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;
    public string PublicId { get; set; } = string.Empty;

    public CoachProofType ProofType { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public CoachProfile CoachProfile { get; set; } = null!;
}
