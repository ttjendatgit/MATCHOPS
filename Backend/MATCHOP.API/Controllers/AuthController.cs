using System.Security.Claims;
using MATCHOP.API.DTOs.Auth;
using MATCHOP.API.Helpers;
using MATCHOP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MATCHOP.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequestDto dto)
        {
            await _authService.RegisterAsync(dto);

            return Ok(ApiResponse<object>.Ok(
                "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."));
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail(VerifyEmailRequestDto dto)
        {
            await _authService.VerifyEmailAsync(dto);

            return Ok(ApiResponse<object>.Ok(
                "Xác thực email thành công."));
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerificationEmail(ResendVerificationEmailRequestDto dto)
        {
            await _authService.ResendVerificationEmailAsync(dto);

            return Ok(ApiResponse<object>.Ok(
                "Email xác thực đã được gửi lại."));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequestDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Đăng nhập thành công."));
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin(GoogleLoginRequestDto dto)
        {
            var result = await _authService.GoogleLoginAsync(dto);

            return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Đăng nhập Google thành công."));
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdValue))
            {
                throw new AppException(ErrorCodes.AuthRequired, "Bạn chưa đăng nhập.", StatusCodes.Status401Unauthorized);
            }

            var userId = Guid.Parse(userIdValue);

            var result = await _authService.GetMeAsync(userId);

            return Ok(ApiResponse<AuthResponseDto>.Ok(result));
        }
    }
}