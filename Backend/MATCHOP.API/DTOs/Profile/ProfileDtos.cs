using MATCHOP.API.Enums;

namespace MATCHOP.API.DTOs.Profile
{
    public class GetProfileResponseDto
    {
        public Guid Id { get; set; }
        public string AvatarUrl { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string SkillLevel { get; set; } = string.Empty;
        public string PreferredPlayingArea { get; set; } = string.Empty;
        public List<FavoriteSportDto> FavoriteSports { get; set; } = new();
    }

    public class UpdateProfileRequestDto
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public SkillLevel SkillLevel { get; set; }
        public string PreferredPlayingArea { get; set; } = string.Empty;
    }

    public class UploadAvatarRequestDto
    {
        public IFormFile Avatar { get; set; } = default!;
    }

    public class ChangePasswordRequestDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class FavoriteSportDto
    {
        public Guid Id { get; set; }
        public string SportType { get; set; } = string.Empty;
    }

    public class UpdateFavoriteSportsRequestDto
    {
        public List<SportType> SportTypes { get; set; } = new();
    }
}

