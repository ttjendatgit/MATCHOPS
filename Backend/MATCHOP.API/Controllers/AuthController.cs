using System.Security.Claims;
using MATCHOP.API.DTOs.Auth;
using MATCHOP.API.DTOs.Profile;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using MATCHOP.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserService _userService;

        public AuthController(IAuthService authService, IUserService userService)
        {
            _authService = authService;
            _userService = userService;
        }

        [Authorize(Roles = "ADMIN")]
        [HttpGet("admin/users")]
        public async Task<IActionResult> GetAllUsers(CancellationToken cancellationToken = default)
        {
            var result = await _userService.GetAllUsersForAdminAsync(cancellationToken);
            return Ok(ApiResponse<List<UserAdminResponseDto>>.Ok(result));
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPatch("admin/users/{id:guid}/suspend")]
        public async Task<IActionResult> SuspendUser(Guid id, CancellationToken cancellationToken = default)
        {
            var result = await _userService.SuspendUserAsync(id, cancellationToken);
            return Ok(ApiResponse<UserAdminResponseDto>.Ok(result, "Người dùng đã bị khóa."));
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPatch("admin/users/{id:guid}/activate")]
        public async Task<IActionResult> ActivateUser(Guid id, CancellationToken cancellationToken = default)
        {
            var result = await _userService.ActivateUserAsync(id, cancellationToken);
            return Ok(ApiResponse<UserAdminResponseDto>.Ok(result, "Người dùng đã được mở khóa."));
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequestDto dto, CancellationToken cancellationToken = default)
        {
            await _authService.RegisterAsync(dto, cancellationToken);

            return Ok(ApiResponse<object>.Ok(
                "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."));
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail(VerifyEmailRequestDto dto, CancellationToken cancellationToken = default)
        {
            await _authService.VerifyEmailAsync(dto, cancellationToken);

            return Ok(ApiResponse<object>.Ok(
                "Xác thực email thành công."));
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerificationEmail(ResendVerificationEmailRequestDto dto, CancellationToken cancellationToken = default)
        {
            await _authService.ResendVerificationEmailAsync(dto, cancellationToken);

            return Ok(ApiResponse<object>.Ok(
                "Email xác thực đã được gửi lại."));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequestDto dto, CancellationToken cancellationToken = default)
        {
            var result = await _authService.LoginAsync(dto, cancellationToken);

            return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Đăng nhập thành công."));
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin(GoogleLoginRequestDto dto, CancellationToken cancellationToken = default)
        {
            var result = await _authService.GoogleLoginAsync(dto, cancellationToken);

            return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Đăng nhập Google thành công."));
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me(CancellationToken cancellationToken = default)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdValue))
            {
                throw new AppException(ErrorCodes.AuthRequired, "Bạn chưa đăng nhập.", StatusCodes.Status401Unauthorized);
            }

            var userId = Guid.Parse(userIdValue);

            var result = await _authService.GetMeAsync(userId, cancellationToken);

            return Ok(ApiResponse<AuthResponseDto>.Ok(result));
        }
    }
}