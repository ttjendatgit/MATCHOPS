using MATCHOP.API.DTOs.Profile;

namespace MATCHOP.API.Services.Interfaces
{
    public interface IUserService
    {
        Task<GetProfileResponseDto> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<GetProfileResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileRequestDto dto, CancellationToken cancellationToken = default);
        Task<string> UploadAvatarAsync(Guid userId, UploadAvatarRequestDto dto, CancellationToken cancellationToken = default);
        Task ChangePasswordAsync(Guid userId, ChangePasswordRequestDto dto, CancellationToken cancellationToken = default);
        Task ValidateUserProfileAsync(Guid userId, UpdateProfileRequestDto dto, CancellationToken cancellationToken = default);

        Task<List<FavoriteSportDto>> GetFavoriteSportsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<List<FavoriteSportDto>> UpdateFavoriteSportsAsync(Guid userId, UpdateFavoriteSportsRequestDto dto, CancellationToken cancellationToken = default);

        // Admin
        Task<List<UserAdminResponseDto>> GetAllUsersForAdminAsync(CancellationToken cancellationToken = default);
        Task<UserAdminResponseDto> SuspendUserAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<UserAdminResponseDto> ActivateUserAsync(Guid userId, CancellationToken cancellationToken = default);
    }
}

