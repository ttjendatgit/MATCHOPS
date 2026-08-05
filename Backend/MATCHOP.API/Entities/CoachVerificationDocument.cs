using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities;

public class CoachVerificationDocument
{
    public Guid Id { get; set; }
    public Guid CoachProfileId { get; set; }

    public string FileUrl { get; set; } = string.Empty;
    public string PublicId { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }

    public CoachVerificationDocumentType DocumentType { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public CoachProfile CoachProfile { get; set; } = null!;
}
