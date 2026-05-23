namespace MATCHOP.API.Services
{
    public interface IEmailService
    {
        Task SendEmailVerificationAsync(string toEmail, string fullName, string verificationUrl);
    }
}