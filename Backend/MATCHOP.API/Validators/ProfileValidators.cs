using FluentValidation;
using MATCHOP.API.DTOs.Profile;

namespace MATCHOP.API.Validators
{
    public class UpdateProfileRequestDtoValidator : AbstractValidator<UpdateProfileRequestDto>
    {
        public UpdateProfileRequestDtoValidator()
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

            RuleFor(x => x.PhoneNumber)
                .MaximumLength(20)
                .WithMessage("Số điện thoại không được vượt quá 20 ký tự.")
                .Matches(@"^\+?[0-9\s().-]{8,20}$")
                .WithMessage("Số điện thoại không đúng định dạng.")
                .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

            RuleFor(x => x.PreferredPlayingArea)
                .MaximumLength(200)
                .WithMessage("PreferredPlayingArea không được vượt quá 200 ký tự.");

            RuleFor(x => x.SkillLevel)
                .IsInEnum()
                .WithMessage("SkillLevel không hợp lệ.");
        }

        private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);
    }

    public class UploadAvatarRequestDtoValidator : AbstractValidator<UploadAvatarRequestDto>
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

        public UploadAvatarRequestDtoValidator()
        {
            RuleFor(x => x.Avatar)
                .NotNull()
                .WithMessage("Avatar là bắt buộc.");

            RuleFor(x => x.Avatar.FileName)
                .Must(fileName =>
                {
                    var ext = Path.GetExtension(fileName ?? string.Empty);
                    return AllowedExtensions.Contains(ext);
                })
                .WithMessage("File không đúng định dạng. Chỉ hỗ trợ jpg, jpeg, png, webp.")
                .When(x => x.Avatar != null);
        }
    }

    public class ChangePasswordRequestDtoValidator : AbstractValidator<ChangePasswordRequestDto>
    {
        public ChangePasswordRequestDtoValidator()
        {
            RuleFor(x => x.CurrentPassword)
                .Must(NotBlank)
                .WithMessage("Mật khẩu hiện tại là bắt buộc.");

            RuleFor(x => x.NewPassword)
                .Cascade(CascadeMode.Stop)
                .Must(NotBlank)
                .WithMessage("Mật khẩu mới là bắt buộc.")
                .MinimumLength(8)
                .WithMessage("Mật khẩu mới phải có ít nhất 8 ký tự.")
                .MaximumLength(100)
                .WithMessage("Mật khẩu mới không được vượt quá 100 ký tự.")
                .Matches("[A-Z]")
                .WithMessage("Mật khẩu mới phải có ít nhất 1 chữ hoa.")
                .Matches("[a-z]")
                .WithMessage("Mật khẩu mới phải có ít nhất 1 chữ thường.")
                .Matches("[0-9]")
                .WithMessage("Mật khẩu mới phải có ít nhất 1 chữ số.");
        }

        private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);
    }

    public class UpdateFavoriteSportsRequestDtoValidator : AbstractValidator<UpdateFavoriteSportsRequestDto>
    {
        public UpdateFavoriteSportsRequestDtoValidator()
        {
            RuleFor(x => x.SportTypes)
                .NotNull()
                .WithMessage("SportTypes là bắt buộc.");

            RuleForEach(x => x.SportTypes)
                .IsInEnum()
                .WithMessage("SportType không hợp lệ.");

            RuleFor(x => x.SportTypes)
                .Must(list => list.Distinct().Count() == list.Count)
                .WithMessage("SportTypes không được trùng lặp.")
                .When(x => x.SportTypes != null);
        }
    }
}

