namespace MATCHOP.API.Services
{
    public interface ICurrentUserService
    {
        Guid? UserId { get; }

        string? Email { get; }

        string? Role { get; }

        bool IsAuthenticated { get; }
    }
}