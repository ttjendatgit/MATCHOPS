using MATCHOP.API.DTOs.Auth;

namespace MATCHOP.API.Services
{
    public interface IAuthService
    {
        Task RegisterAsync(RegisterRequestDto dto);

        Task VerifyEmailAsync(VerifyEmailRequestDto dto);

        Task ResendVerificationEmailAsync(ResendVerificationEmailRequestDto dto);

        Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);

        Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto dto);

        Task<AuthResponseDto> GetMeAsync(Guid userId);
    }
}