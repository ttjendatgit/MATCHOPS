using MATCHOP.API.Entities;
using MATCHOP.API.Enums;

namespace MATCHOP.API.Repositories.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<User>> GetAllAsync(bool includeDeleted = false, CancellationToken cancellationToken = default);
        Task<User?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<User> UpdateAsync(User user, CancellationToken cancellationToken = default);
        Task<User?> UploadAvatarAsync(Guid userId, string avatarUrl, CancellationToken cancellationToken = default);

        Task<bool> EmailExistsAsync(string email, Guid excludeUserId, CancellationToken cancellationToken = default);
        Task<bool> PhoneExistsAsync(string phoneNumber, Guid excludeUserId, CancellationToken cancellationToken = default);

        Task<List<FavoriteSport>> GetFavoriteSportsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task ReplaceFavoriteSportsAsync(Guid userId, List<SportType> sportTypes, CancellationToken cancellationToken = default);
    }
}
