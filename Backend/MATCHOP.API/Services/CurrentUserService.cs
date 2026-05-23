using System.Security.Claims;

namespace MATCHOP.API.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public bool IsAuthenticated =>
            _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

        public Guid? UserId
        {
            get
            {
                var userIdValue = _httpContextAccessor.HttpContext?.User
                    ?.FindFirstValue(ClaimTypes.NameIdentifier);

                if (Guid.TryParse(userIdValue, out var userId))
                {
                    return userId;
                }

                return null;
            }
        }

        public string? Email =>
            _httpContextAccessor.HttpContext?.User
                ?.FindFirstValue(ClaimTypes.Email);

        public string? Role =>
            _httpContextAccessor.HttpContext?.User
                ?.FindFirstValue(ClaimTypes.Role);
    }
}