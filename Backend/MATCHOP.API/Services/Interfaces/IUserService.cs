using MATCHOP.API.DTOs.Profile;

namespace MATCHOP.API.Services.Interfaces
{
    public interface IUserService
    {
        Task<GetProfileResponseDto> GetProfileAsync(Guid userId);
        Task<GetProfileResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileRequestDto dto);
        Task<string> UploadAvatarAsync(Guid userId, UploadAvatarRequestDto dto);
        Task ChangePasswordAsync(Guid userId, ChangePasswordRequestDto dto);
        Task ValidateUserProfileAsync(Guid userId, UpdateProfileRequestDto dto);

        Task<List<FavoriteSportDto>> GetFavoriteSportsAsync(Guid userId);
        Task<List<FavoriteSportDto>> UpdateFavoriteSportsAsync(Guid userId, UpdateFavoriteSportsRequestDto dto);

        // Admin
        Task<List<UserAdminResponseDto>> GetAllUsersForAdminAsync();
    }
}

