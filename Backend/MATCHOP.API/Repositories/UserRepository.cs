using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.Users.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.Users.OrderByDescending(u => u.CreatedAt).ToListAsync(cancellationToken);
        }

        public async Task<User?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.Users
                .Include(x => x.FavoriteSports)
                .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);
        }

        public async Task<User> UpdateAsync(User user, CancellationToken cancellationToken = default)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync(cancellationToken);
            return user;
        }

        public async Task<User?> UploadAvatarAsync(Guid userId, string avatarUrl, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);
            if (user == null)
            {
                return null;
            }

            user.AvatarUrl = avatarUrl;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
            return user;
        }

        public async Task<bool> EmailExistsAsync(string email, Guid excludeUserId, CancellationToken cancellationToken = default)
        {
            var normalized = email.Trim().ToLower();
            return await _context.Users.AnyAsync(x => x.Email == normalized && x.Id != excludeUserId, cancellationToken);
        }

        public async Task<bool> PhoneExistsAsync(string phoneNumber, Guid excludeUserId, CancellationToken cancellationToken = default)
        {
            var normalized = phoneNumber.Trim();
            return await _context.Users.AnyAsync(x => x.PhoneNumber == normalized && x.Id != excludeUserId, cancellationToken);
        }

        public async Task<List<FavoriteSport>> GetFavoriteSportsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.FavoriteSports
                .Where(x => x.UserId == userId)
                .OrderBy(x => x.SportType)
                .ToListAsync(cancellationToken);
        }

        public async Task ReplaceFavoriteSportsAsync(Guid userId, List<SportType> sportTypes, CancellationToken cancellationToken = default)
        {
            var existing = await _context.FavoriteSports
                .Where(x => x.UserId == userId)
                .ToListAsync(cancellationToken);

            if (existing.Count > 0)
            {
                _context.FavoriteSports.RemoveRange(existing);
            }

            if (sportTypes.Count > 0)
            {
                var items = sportTypes.Distinct()
                    .Select(t => new FavoriteSport
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        SportType = t
                    })
                    .ToList();

                await _context.FavoriteSports.AddRangeAsync(items, cancellationToken);
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
