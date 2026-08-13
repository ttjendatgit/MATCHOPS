using BCrypt.Net;
using MATCHOP.API.DTOs.Auth;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using Microsoft.EntityFrameworkCore;
using Google.Apis.Auth;

namespace MATCHOP.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IJwtService _jwtService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;
        private readonly IHostEnvironment _environment;

        public AuthService(
            ApplicationDbContext context,
            IEmailService emailService,
            IJwtService jwtService,
            IConfiguration configuration,
            ILogger<AuthService> logger,
            IHostEnvironment environment)
        {
            _context = context;
            _emailService = emailService;
            _jwtService = jwtService;
            _configuration = configuration;
            _logger = logger;
            _environment = environment;
        }

        public async Task RegisterAsync(RegisterRequestDto dto, CancellationToken cancellationToken = default)
        {
            var email = dto.Email.Trim().ToLower();

            var emailExists = await _context.Users.AnyAsync(x => x.Email == email, cancellationToken);
            if (emailExists)
            {
                throw new AppException("EMAIL_ALREADY_EXISTS", "Email đã được sử dụng.");
            }

            if (!string.IsNullOrWhiteSpace(dto.Phone))
            {
                var phoneExists = await _context.Users.AnyAsync(x => x.PhoneNumber == dto.Phone, cancellationToken);
                if (phoneExists)
                {
                    throw new AppException("PHONE_ALREADY_EXISTS", "Số điện thoại đã được sử dụng.");
                }
            }

            var token = TokenHelper.GenerateSecureToken();
            var tokenHash = TokenHelper.HashToken(token);

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = dto.FullName.Trim(),
                Email = email,
                PhoneNumber = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = UserRole.USER,
                Status = UserStatus.ACTIVE,
                EmailConfirmed = false,
                EmailVerificationTokenHash = tokenHash,
                EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24),
                AuthProvider = "LOCAL",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync(cancellationToken);

            var verificationUrl = BuildVerificationUrl(user.Email, token);

            try
            {
                await _emailService.SendEmailVerificationAsync(user.Email, user.FullName, verificationUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to send verification email to {Email}. UserId={UserId}",
                    user.Email, user.Id);

                throw new AppException(
                    "EMAIL_SEND_FAILED",
                    "Tài khoản đã được tạo nhưng không gửi được email xác thực. " +
                    "Vui lòng vào trang xác thực email và chọn \"Gửi lại email xác thực\", hoặc liên hệ hỗ trợ.",
                    StatusCodes.Status503ServiceUnavailable);
            }
        }

        public async Task VerifyEmailAsync(VerifyEmailRequestDto dto, CancellationToken cancellationToken = default)
        {
            var email = dto.Email.Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
            if (user == null)
            {
                throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);
            }

            if (user.EmailConfirmed)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(user.EmailVerificationTokenHash))
            {
                throw new AppException("INVALID_EMAIL_VERIFICATION_TOKEN", "Token xác thực không hợp lệ.");
            }

            if (user.EmailVerificationTokenExpiresAt == null ||
                user.EmailVerificationTokenExpiresAt < DateTime.UtcNow)
            {
                throw new AppException("EMAIL_VERIFICATION_TOKEN_EXPIRED", "Token xác thực đã hết hạn.");
            }

            var isValid = TokenHelper.VerifyToken(dto.Token, user.EmailVerificationTokenHash);
            if (!isValid)
            {
                throw new AppException("INVALID_EMAIL_VERIFICATION_TOKEN", "Token xác thực không hợp lệ.");
            }

            user.EmailConfirmed = true;
            user.EmailVerificationTokenHash = null;
            user.EmailVerificationTokenExpiresAt = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task ResendVerificationEmailAsync(ResendVerificationEmailRequestDto dto, CancellationToken cancellationToken = default)
        {
            var email = dto.Email.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
            if (user == null)
            {
                throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);
            }
            if (user.EmailConfirmed)
            {
                return;
            }
            var token = TokenHelper.GenerateSecureToken();
            user.EmailVerificationTokenHash = TokenHelper.HashToken(token);
            user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";
            var verificationUrl =
                $"{frontendBaseUrl}/verify-email?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(token)}";

            // ✅ Gửi email không chờ, trả về ngay — tránh timeout khi SMTP chậm
            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendEmailVerificationAsync(user.Email, user.FullName, verificationUrl);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Resend email failed: {ex.Message}");
                }
            });
        }
        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto, CancellationToken cancellationToken = default)
        {
            var email = dto.Email.Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
            if (user == null)
            {
                throw new AppException("INVALID_LOGIN", "Email hoặc mật khẩu không đúng.", StatusCodes.Status401Unauthorized);
            }

            if (user.Status != UserStatus.ACTIVE)
            {
                throw new AppException(ErrorCodes.PermissionDenied, "Tài khoản không hoạt động.", StatusCodes.Status403Forbidden);
            }

            if (string.IsNullOrWhiteSpace(user.PasswordHash))
            {
                throw new AppException("INVALID_LOGIN", "Tài khoản này không hỗ trợ đăng nhập bằng mật khẩu.", StatusCodes.Status400BadRequest);
            }

            var isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                throw new AppException("INVALID_LOGIN", "Email hoặc mật khẩu không đúng.", StatusCodes.Status401Unauthorized);
            }

            if (!user.EmailConfirmed)
            {
                throw new AppException("EMAIL_NOT_CONFIRMED", "Vui lòng xác thực email trước khi đăng nhập.", StatusCodes.Status403Forbidden);
            }

            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            var token = _jwtService.GenerateToken(user);

            return new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString(),
                EmailConfirmed = user.EmailConfirmed,
                AuthProvider = user.AuthProvider
            };
        }

        public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto dto, CancellationToken cancellationToken = default)
        {
            var clientId = _configuration["GoogleAuth:ClientId"];

            GoogleJsonWebSignature.Payload payload;

            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(
                    dto.IdToken,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { clientId }
                    });
            }
            catch
            {
                throw new AppException("GOOGLE_LOGIN_FAILED", "Đăng nhập Google thất bại.", StatusCodes.Status401Unauthorized);
            }

            if (!payload.EmailVerified)
            {
                throw new AppException("GOOGLE_LOGIN_FAILED", "Email Google chưa được xác thực.", StatusCodes.Status401Unauthorized);
            }

            var email = payload.Email.Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    FullName = payload.Name ?? email,
                    Email = email,
                    AvatarUrl = payload.Picture,
                    GoogleId = payload.Subject,
                    PasswordHash = null,
                    Role = UserRole.USER,
                    Status = UserStatus.ACTIVE,
                    EmailConfirmed = true,
                    AuthProvider = "GOOGLE",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
            }
            else
            {
                if (user.Status != UserStatus.ACTIVE)
                {
                    throw new AppException(ErrorCodes.PermissionDenied, "Tài khoản không hoạt động.", StatusCodes.Status403Forbidden);
                }

                user.GoogleId ??= payload.Subject;
                user.AvatarUrl ??= payload.Picture;
                user.EmailConfirmed = true;
                user.LastLoginAt = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);

            var token = _jwtService.GenerateToken(user);

            return new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString(),
                EmailConfirmed = user.EmailConfirmed,
                AuthProvider = user.AuthProvider
            };
        }

        public async Task<AuthResponseDto> GetMeAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);
            if (user == null)
            {
                throw new AppException(ErrorCodes.UserNotFound, "Không tìm thấy người dùng.", StatusCodes.Status404NotFound);
            }

            if (user.Status != UserStatus.ACTIVE)
            {
                throw new AppException(ErrorCodes.PermissionDenied, "Tài khoản không hoạt động.", StatusCodes.Status403Forbidden);
            }

            var token = _jwtService.GenerateToken(user);

            return new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString(),
                EmailConfirmed = user.EmailConfirmed,
                AuthProvider = user.AuthProvider
            };
        }

        private string BuildVerificationUrl(string email, string token)
        {
            var frontendBaseUrl = (_configuration["Frontend:BaseUrl"] ?? "http://localhost:3000").TrimEnd('/');

            if (_environment.IsProduction() &&
                frontendBaseUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(
                    "Frontend:BaseUrl is still localhost in Production. Verification links in email will be broken.");
            }

            return
                $"{frontendBaseUrl}/verify-email?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";
        }
    }
}
