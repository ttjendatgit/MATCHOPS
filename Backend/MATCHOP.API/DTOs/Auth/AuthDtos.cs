using MATCHOP.API.Enums;

namespace MATCHOP.API.DTOs.Auth
{
    public class RegisterRequestDto
    {
        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? Phone { get; set; }

        public string Password { get; set; } = string.Empty;
    }

    public class LoginRequestDto
    {
        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }

    public class VerifyEmailRequestDto
    {
        public string Email { get; set; } = string.Empty;

        public string Token { get; set; } = string.Empty;
    }

    public class ResendVerificationEmailRequestDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class GoogleLoginRequestDto
    {
        public string IdToken { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;

        public Guid UserId { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public bool EmailConfirmed { get; set; }

        public string AuthProvider { get; set; } = string.Empty;
    }
}
