using System.Security.Cryptography;
using System.Text;

namespace MATCHOP.API.Helpers
{
    public static class TokenHelper
    {
        public static string GenerateSecureToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
        }

        public static string HashToken(string token)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(token);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToHexString(hash);
        }

        public static bool VerifyToken(string token, string tokenHash)
        {
            var hash = HashToken(token);
            return string.Equals(hash, tokenHash, StringComparison.OrdinalIgnoreCase);
        }
    }
}