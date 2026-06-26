using MATCHOP.API.DTOs.Auth;

namespace MATCHOP.API.Services
{
    public interface IAuthService
    {
        Task RegisterAsync(RegisterRequestDto dto, CancellationToken cancellationToken = default);

        Task VerifyEmailAsync(VerifyEmailRequestDto dto, CancellationToken cancellationToken = default);

        Task ResendVerificationEmailAsync(ResendVerificationEmailRequestDto dto, CancellationToken cancellationToken = default);

        Task<AuthResponseDto> LoginAsync(LoginRequestDto dto, CancellationToken cancellationToken = default);

        Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto dto, CancellationToken cancellationToken = default);

        Task<AuthResponseDto> GetMeAsync(Guid userId, CancellationToken cancellationToken = default);
    }
}