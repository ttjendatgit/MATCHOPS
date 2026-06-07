using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Repositories.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(Guid id);
        Task<User?> GetProfileAsync(Guid userId);
        Task<User> UpdateAsync(User user);
        Task<User?> UploadAvatarAsync(Guid userId, string avatarUrl);

        Task<bool> EmailExistsAsync(string email, Guid excludeUserId);
        Task<bool> PhoneExistsAsync(string phoneNumber, Guid excludeUserId);

        Task<List<FavoriteSport>> GetFavoriteSportsAsync(Guid userId);
        Task ReplaceFavoriteSportsAsync(Guid userId, List<SportType> sportTypes);
    }
}
