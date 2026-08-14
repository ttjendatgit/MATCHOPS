using BCrypt.Net;
using MATCHOP.API.DTOs.Profile;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories.Interfaces;
using MATCHOP.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<UserService> _logger;

        public UserService(
            IUserRepository userRepository,
            ApplicationDbContext context,
            IWebHostEnvironment env,
            ILogger<UserService> logger)
        {
            _userRepository = userRepository;
            _context = context;
            _env = env;
            _logger = logger;
        }

        private static FavoriteSportDto ToDto(FavoriteSport x) => new()
        {
            Id = x.Id,
            SportType = x.SportType.ToString()
        };

        private static GetProfileResponseDto ToDto(User user) => new()
        {
            Id = user.Id,
            AvatarUrl = user.AvatarUrl ?? string.Empty,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            Email = user.Email,
            SkillLevel = user.SkillLevel.ToString(),
            PreferredPlayingArea = user.PreferredPlayingArea ?? string.Empty,
            FavoriteSports = user.FavoriteSports
                .OrderBy(x => x.SportType)
                .Select(ToDto)
                .ToList()
        };

        private static void ValidateAvatarFile(IFormFile file)
        {
            var ext = Path.GetExtension(file.FileName ?? string.Empty);
            if (string.IsNullOrWhiteSpace(ext))
            {
                throw new AppException(ErrorCodes.INVALID_FILE_TYPE, "File không đúng định dạng.");
            }

            var allowed = ext.Equals(".jpg", StringComparison.OrdinalIgnoreCase)
                          || ext.Equals(".jpeg", StringComparison.OrdinalIgnoreCase)
                          || ext.Equals(".png", StringComparison.OrdinalIgnoreCase)
                          || ext.Equals(".webp", StringComparison.OrdinalIgnoreCase);

            if (!allowed)
            {
                throw new AppException(ErrorCodes.INVALID_FILE_TYPE, "File không đúng định dạng. Chỉ hỗ trợ jpg, jpeg, png, webp.");
            }

            if (file.Length <= 0)
            {
                throw new AppException(ErrorCodes.ValidationError, "File upload không hợp lệ.");
            }

            if (file.Length > 5 * 1024 * 1024)
            {
                throw new AppException(ErrorCodes.FILE_TOO_LARGE, "File quá lớn. Tối đa 5MB.");
            }
        }

        private string EnsureAvatarFolder()
        {
            var webRoot = _env.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRoot))
            {
                webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var folder = Path.Combine(webRoot, "uploads", "avatar");
            Directory.CreateDirectory(folder);
            return folder;
        }

        private static bool IsLocalAvatarPath(string? avatarUrl)
        {
            if (string.IsNullOrWhiteSpace(avatarUrl))
            {
                return false;
            }

            return avatarUrl.StartsWith("/uploads/avatar/", StringComparison.OrdinalIgnoreCase)
                   || avatarUrl.StartsWith("uploads/avatar/", StringComparison.OrdinalIgnoreCase);
        }

        private string? GetLocalAvatarPhysicalPath(string avatarUrl)
        {
            var webRoot = _env.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRoot))
            {
                webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var normalized = avatarUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            return Path.Combine(webRoot, normalized);
        }

        private void SafeDeleteLocalAvatar(string? avatarUrl)
        {
            if (!IsLocalAvatarPath(avatarUrl))
            {
                return;
            }

            try
            {
                var path = GetLocalAvatarPhysicalPath(avatarUrl!);
                if (!string.IsNullOrWhiteSpace(path) && File.Exists(path))
                {
                    File.Delete(path);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete old avatar {AvatarUrl}", avatarUrl);
            }
        }

        private async Task<User> GetUserOrThrowAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetProfileAsync(userId, cancellationToken);
            if (user == null)
            {
                throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);
            }

            return user;
        }

        public async Task<GetProfileResponseDto> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await GetUserOrThrowAsync(userId, cancellationToken);
            return ToDto(user);
        }

        public async Task ValidateUserProfileAsync(Guid userId, UpdateProfileRequestDto dto, CancellationToken cancellationToken = default)
        {
            var email = dto.Email.Trim().ToLower();
            var emailExists = await _userRepository.EmailExistsAsync(email, userId, cancellationToken);
            if (emailExists)
            {
                throw new AppException("EMAIL_ALREADY_EXISTS", "Email đã được sử dụng.");
            }

            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                var phoneExists = await _userRepository.PhoneExistsAsync(dto.PhoneNumber, userId, cancellationToken);
                if (phoneExists)
                {
                    throw new AppException("PHONE_ALREADY_EXISTS", "Số điện thoại đã được sử dụng.");
                }
            }
        }

        public async Task<GetProfileResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileRequestDto dto, CancellationToken cancellationToken = default)
        {
            await ValidateUserProfileAsync(userId, dto, cancellationToken);

            var user = await GetUserOrThrowAsync(userId, cancellationToken);

            user.FullName = dto.FullName.Trim();
            user.Email = dto.Email.Trim().ToLower();
            user.PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber.Trim();
            user.SkillLevel = dto.SkillLevel;
            user.PreferredPlayingArea = string.IsNullOrWhiteSpace(dto.PreferredPlayingArea) ? null : dto.PreferredPlayingArea.Trim();
            user.UpdatedAt = DateTime.UtcNow;

            var updated = await _userRepository.UpdateAsync(user, cancellationToken);
            return ToDto(updated);
        }

        public async Task<string> UploadAvatarAsync(Guid userId, UploadAvatarRequestDto dto, CancellationToken cancellationToken = default)
        {
            ValidateAvatarFile(dto.Avatar);

            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            if (user == null)
            {
                throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);
            }

            var oldAvatar = user.AvatarUrl;

            var folder = EnsureAvatarFolder();
            var ext = Path.GetExtension(dto.Avatar.FileName);
            var fileName = $"{userId:N}_{Guid.NewGuid():N}{ext}";
            var fullPath = Path.Combine(folder, fileName);

            try
            {
                await using var stream = new FileStream(fullPath, FileMode.CreateNew);
                await dto.Avatar.CopyToAsync(stream, cancellationToken);
            }
            catch
            {
                throw new AppException(ErrorCodes.UPLOAD_FAILED, "Upload avatar thất bại.");
            }

            var avatarUrl = $"/uploads/avatar/{fileName}";
            var updated = await _userRepository.UploadAvatarAsync(userId, avatarUrl, cancellationToken);
            if (updated == null)
            {
                SafeDeleteLocalAvatar(avatarUrl);
                throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);
            }

            SafeDeleteLocalAvatar(oldAvatar);
            return avatarUrl;
        }

        public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequestDto dto, CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            if (user == null)
            {
                throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);
            }

            if (string.IsNullOrWhiteSpace(user.PasswordHash))
            {
                throw new AppException(ErrorCodes.ValidationError, "Tài khoản này không hỗ trợ đổi mật khẩu.");
            }

            var valid = BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash);
            if (!valid)
            {
                throw new AppException("INVALID_CURRENT_PASSWORD", "Mật khẩu hiện tại không đúng.", StatusCodes.Status400BadRequest);
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user, cancellationToken);
        }

        public async Task<List<FavoriteSportDto>> GetFavoriteSportsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            _ = await GetUserOrThrowAsync(userId, cancellationToken);
            var items = await _userRepository.GetFavoriteSportsAsync(userId, cancellationToken);
            return items.Select(ToDto).ToList();
        }

        public async Task<List<FavoriteSportDto>> UpdateFavoriteSportsAsync(Guid userId, UpdateFavoriteSportsRequestDto dto, CancellationToken cancellationToken = default)
        {
            _ = await GetUserOrThrowAsync(userId, cancellationToken);
            await _userRepository.ReplaceFavoriteSportsAsync(userId, dto.SportTypes, cancellationToken);
            var items = await _userRepository.GetFavoriteSportsAsync(userId, cancellationToken);
            return items.Select(ToDto).ToList();
        }

        private static UserAdminResponseDto ToAdminDto(User user) => new()
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role.ToString(),
            Status = user.Status.ToString(),
            EmailConfirmed = user.EmailConfirmed,
            CreatedAt = user.CreatedAt,
            IsDeleted = user.IsDeleted,
            DeletedAt = user.DeletedAt
        };

        public async Task<List<UserAdminResponseDto>> GetAllUsersForAdminAsync(
            bool includeDeleted = false,
            CancellationToken cancellationToken = default)
        {
            var users = await _userRepository.GetAllAsync(includeDeleted, cancellationToken);
            return users.Select(ToAdminDto).ToList();
        }

        public async Task<UserAdminResponseDto> SuspendUserAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            if (user == null)
                throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);

            if (user.IsDeleted)
                throw new AppException(ErrorCodes.ValidationError, "Không thể khóa tài khoản đã bị xóa.");

            user.Status = UserStatus.SUSPENDED;
            user.UpdatedAt = DateTime.UtcNow;
            var updated = await _userRepository.UpdateAsync(user, cancellationToken);

            return ToAdminDto(updated);
        }

        public async Task<UserAdminResponseDto> ActivateUserAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            if (user == null)
                throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);

            if (user.IsDeleted)
                throw new AppException(ErrorCodes.ValidationError, "Không thể kích hoạt tài khoản đã bị xóa. Hãy khôi phục trước.");

            user.Status = UserStatus.ACTIVE;
            user.UpdatedAt = DateTime.UtcNow;
            var updated = await _userRepository.UpdateAsync(user, cancellationToken);

            return ToAdminDto(updated);
        }

        public async Task<UserAdminResponseDto> UpdateUserRoleAsync(
            Guid userId,
            UpdateUserRoleRequestDto dto,
            CancellationToken cancellationToken = default)
        {
            if (!Enum.TryParse<UserRole>(dto.Role, ignoreCase: true, out var newRole))
            {
                throw new AppException(ErrorCodes.ValidationError, "Vai trò không hợp lệ.");
            }

            if (newRole is UserRole.ADMIN)
            {
                throw new AppException(
                    ErrorCodes.PermissionDenied,
                    "Không thể thay đổi vai trò thành ADMIN qua giao diện này.",
                    StatusCodes.Status403Forbidden);
            }

            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            if (user == null)
                throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);

            if (user.IsDeleted)
                throw new AppException(ErrorCodes.ValidationError, "Không thể thay đổi vai trò tài khoản đã bị xóa.");

            if (user.Role == UserRole.ADMIN)
            {
                throw new AppException(
                    ErrorCodes.PermissionDenied,
                    "Không thể thay đổi vai trò của tài khoản quản trị.",
                    StatusCodes.Status403Forbidden);
            }

            if (user.Role == newRole)
            {
                throw new AppException(ErrorCodes.ValidationError, "Người dùng đã có vai trò này.");
            }

            user.Role = newRole;
            user.UpdatedAt = DateTime.UtcNow;

            if (newRole == UserRole.OWNER)
            {
                var application = await _context.OwnerApplications
                    .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

                if (application is not null && application.Status != OwnerApplicationStatus.APPROVED)
                {
                    application.Status = OwnerApplicationStatus.APPROVED;
                    application.RejectionReason = null;
                    application.ApprovedAt = DateTime.UtcNow;
                    application.UpdatedAt = DateTime.UtcNow;
                }
            }

            var updated = await _userRepository.UpdateAsync(user, cancellationToken);

            return ToAdminDto(updated);
        }

        public async Task<UserAdminResponseDto> SoftDeleteUserAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            if (user == null)
                throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);

            if (user.IsDeleted)
                throw new AppException(ErrorCodes.ValidationError, "Tài khoản đã bị xóa trước đó.");

            if (user.Role == UserRole.ADMIN)
                throw new AppException(ErrorCodes.PermissionDenied, "Không thể xóa tài khoản quản trị.", StatusCodes.Status403Forbidden);

            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            user.Status = UserStatus.INACTIVE;
            user.UpdatedAt = DateTime.UtcNow;

            var updated = await _userRepository.UpdateAsync(user, cancellationToken);
            return ToAdminDto(updated);
        }

        public async Task<UserAdminResponseDto> RestoreUserAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            if (user == null)
                throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);

            if (!user.IsDeleted)
                throw new AppException(ErrorCodes.ValidationError, "Tài khoản chưa bị xóa.");

            user.IsDeleted = false;
            user.DeletedAt = null;
            user.Status = UserStatus.ACTIVE;
            user.UpdatedAt = DateTime.UtcNow;

            var updated = await _userRepository.UpdateAsync(user, cancellationToken);
            return ToAdminDto(updated);
        }
    }
}

