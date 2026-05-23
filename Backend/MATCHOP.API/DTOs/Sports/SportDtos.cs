using MATCHOP.API.Enums;

namespace MATCHOP.API.DTOs.Sports
{
    public class CreateSportDto
    {
        public string Name { get; set; } = string.Empty;

        public string? Icon { get; set; }

        public string? Description { get; set; }
    }

    public class UpdateSportDto
    {
        public string? Name { get; set; }

        public string? Icon { get; set; }

        public string? Description { get; set; }

        public SportStatus? Status { get; set; }
    }

    public class SportResponseDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Icon { get; set; }

        public string? Description { get; set; }

        public string Status { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}