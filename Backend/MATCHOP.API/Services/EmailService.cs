using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace MATCHOP.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailVerificationAsync(string toEmail, string fullName, string verificationUrl)
        {
            var enableSending = _configuration.GetValue("Email:EnableSending", true);
            if (!enableSending)
            {
                _logger.LogWarning(
                    "Email:EnableSending=false — skipped verification email to {Email}. Url={Url}",
                    toEmail, verificationUrl);
                return;
            }

            var host = _configuration["Smtp:Host"];
            var port = int.Parse(_configuration["Smtp:Port"] ?? "587");
            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            var fromEmail = _configuration["Smtp:FromEmail"];
            var fromName = _configuration["Smtp:FromName"] ?? "MATCHOP";

            if (string.IsNullOrWhiteSpace(host))
            {
                throw new InvalidOperationException("SMTP Host is missing in appsettings.json.");
            }

            if (string.IsNullOrWhiteSpace(username))
            {
                throw new InvalidOperationException("SMTP Username is missing in appsettings.json.");
            }

            if (string.IsNullOrWhiteSpace(password))
            {
                throw new InvalidOperationException("SMTP Password is missing in appsettings.json.");
            }

            if (string.IsNullOrWhiteSpace(fromEmail))
            {
                throw new InvalidOperationException("SMTP FromEmail is missing in appsettings.json.");
            }

            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(new MailboxAddress(fullName, toEmail));
            message.Subject = "Xác thực tài khoản MATCHOP";

            message.Body = new TextPart("html")
            {
                Text = $@"
                    <h2>Xin chào {fullName},</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản MATCHOP.</p>
                    <p>Vui lòng bấm vào liên kết bên dưới để xác thực email:</p>
                    <p>
                        <a href='{verificationUrl}' target='_blank'>
                            Xác thực tài khoản
                        </a>
                    </p>
                    <p>Nếu nút không hoạt động, hãy copy link sau vào trình duyệt:</p>
                    <p>{verificationUrl}</p>
                    <p>Liên kết xác thực sẽ hết hạn sau 24 giờ.</p>
                    <p>Nếu bạn không tạo tài khoản MATCHOP, vui lòng bỏ qua email này.</p>
                    <br/>
                    <p>Trân trọng,<br/>Đội ngũ MATCHOP</p>
                "
            };

            using var client = new SmtpClient();

            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Verification email sent to {Email}", toEmail);
        }
    }
}