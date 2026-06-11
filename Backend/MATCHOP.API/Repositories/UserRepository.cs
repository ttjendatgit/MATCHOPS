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

        public async Task<User?> GetByIdAsync(Guid id)
        {
            return await _context.Users.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<List<User>> GetAllAsync()
        {
            return await _context.Users.OrderByDescending(u => u.CreatedAt).ToListAsync();
        }

        public async Task<User?> GetProfileAsync(Guid userId)
        {
            return await _context.Users
                .Include(x => x.FavoriteSports)
                .FirstOrDefaultAsync(x => x.Id == userId);
        }

        public async Task<User> UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User?> UploadAvatarAsync(Guid userId, string avatarUrl)
        {
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null)
            {
                return null;
            }

            user.AvatarUrl = avatarUrl;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> EmailExistsAsync(string email, Guid excludeUserId)
        {
            var normalized = email.Trim().ToLower();
            return await _context.Users.AnyAsync(x => x.Email == normalized && x.Id != excludeUserId);
        }

        public async Task<bool> PhoneExistsAsync(string phoneNumber, Guid excludeUserId)
        {
            var normalized = phoneNumber.Trim();
            return await _context.Users.AnyAsync(x => x.PhoneNumber == normalized && x.Id != excludeUserId);
        }

        public async Task<List<FavoriteSport>> GetFavoriteSportsAsync(Guid userId)
        {
            return await _context.FavoriteSports
                .Where(x => x.UserId == userId)
                .OrderBy(x => x.SportType)
                .ToListAsync();
        }

        public async Task ReplaceFavoriteSportsAsync(Guid userId, List<SportType> sportTypes)
        {
            var existing = await _context.FavoriteSports
                .Where(x => x.UserId == userId)
                .ToListAsync();

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

                await _context.FavoriteSports.AddRangeAsync(items);
            }

            await _context.SaveChangesAsync();
        }
    }
}
