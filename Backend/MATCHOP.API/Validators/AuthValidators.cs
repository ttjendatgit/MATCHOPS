using FluentValidation;
using MATCHOP.API.DTOs.Auth;

namespace MATCHOP.API.Validators;

public class RegisterRequestDtoValidator : AbstractValidator<RegisterRequestDto>
{
    public RegisterRequestDtoValidator()
    {
        RuleFor(x => x.FullName)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Họ tên là bắt buộc.")
            .Must(value => value.Trim().Length >= 2)
            .WithMessage("Họ tên phải có ít nhất 2 ký tự.")
            .Must(value => value.Trim().Length <= 200)
            .WithMessage("Họ tên không được vượt quá 200 ký tự.");

        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Email là bắt buộc.")
            .MaximumLength(200)
            .WithMessage("Email không được vượt quá 200 ký tự.")
            .EmailAddress()
            .WithMessage("Email không đúng định dạng.");

        RuleFor(x => x.Phone)
            .MaximumLength(20)
            .WithMessage("Số điện thoại không được vượt quá 20 ký tự.")
            .Matches(@"^\+?[0-9\s().-]{8,20}$")
            .WithMessage("Số điện thoại không đúng định dạng.")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone));

        RuleFor(x => x.Password)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Mật khẩu là bắt buộc.")
            .MinimumLength(8)
            .WithMessage("Mật khẩu phải có ít nhất 8 ký tự.")
            .MaximumLength(100)
            .WithMessage("Mật khẩu không được vượt quá 100 ký tự.")
            .Matches("[A-Z]")
            .WithMessage("Mật khẩu phải có ít nhất 1 chữ hoa.")
            .Matches("[a-z]")
            .WithMessage("Mật khẩu phải có ít nhất 1 chữ thường.")
            .Matches("[0-9]")
            .WithMessage("Mật khẩu phải có ít nhất 1 chữ số.");
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);
}

public class LoginRequestDtoValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestDtoValidator()
    {
        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Email là bắt buộc.")
            .MaximumLength(200)
            .WithMessage("Email không được vượt quá 200 ký tự.")
            .EmailAddress()
            .WithMessage("Email không đúng định dạng.");

        RuleFor(x => x.Password)
            .Must(NotBlank)
            .WithMessage("Mật khẩu là bắt buộc.");
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);
}

public class VerifyEmailRequestDtoValidator : AbstractValidator<VerifyEmailRequestDto>
{
    public VerifyEmailRequestDtoValidator()
    {
        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Email là bắt buộc.")
            .MaximumLength(200)
            .WithMessage("Email không được vượt quá 200 ký tự.")
            .EmailAddress()
            .WithMessage("Email không đúng định dạng.");

        RuleFor(x => x.Token)
            .Must(NotBlank)
            .WithMessage("Token xác thực là bắt buộc.");
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);
}

public class ResendVerificationEmailRequestDtoValidator : AbstractValidator<ResendVerificationEmailRequestDto>
{
    public ResendVerificationEmailRequestDtoValidator()
    {
        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Email là bắt buộc.")
            .MaximumLength(200)
            .WithMessage("Email không được vượt quá 200 ký tự.")
            .EmailAddress()
            .WithMessage("Email không đúng định dạng.");
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);
}

public class GoogleLoginRequestDtoValidator : AbstractValidator<GoogleLoginRequestDto>
{
    public GoogleLoginRequestDtoValidator()
    {
        RuleFor(x => x.IdToken)
            .Must(NotBlank)
            .WithMessage("Google idToken là bắt buộc.");
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);
}
