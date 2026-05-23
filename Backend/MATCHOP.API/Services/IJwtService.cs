using MATCHOP.API.Entities;

namespace MATCHOP.API.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
    }
}