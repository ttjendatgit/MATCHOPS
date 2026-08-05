using FluentValidation;
using MATCHOP.API.DTOs.Coaches;

namespace MATCHOP.API.Validators;

public class CoachApplyRequestDtoValidator : AbstractValidator<CoachApplyRequestDto>
{
    public CoachApplyRequestDtoValidator()
    {
        RuleFor(x => x.DisplayName)
            .MaximumLength(200)
            .WithMessage("Tên hiển thị không được vượt quá 200 ký tự.")
            .When(x => x.DisplayName is not null);

        RuleFor(x => x.Bio)
            .MaximumLength(2000)
            .WithMessage("Giới thiệu không được vượt quá 2000 ký tự.")
            .When(x => x.Bio is not null);

        RuleFor(x => x.Achievements)
            .MaximumLength(2000)
            .WithMessage("Thành tích/chứng chỉ không được vượt quá 2000 ký tự.")
            .When(x => x.Achievements is not null);

        RuleFor(x => x.ExperienceYears)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Số năm kinh nghiệm không được nhỏ hơn 0.");

        RuleFor(x => x.HourlyRate)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Giá theo giờ không được nhỏ hơn 0.");

        RuleFor(x => x.City)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Tỉnh/thành phố là bắt buộc.")
            .Must(value => HasTrimmedLengthAtMost(value, 100))
            .WithMessage("Tỉnh/thành phố không được vượt quá 100 ký tự.");

        RuleFor(x => x.District)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Quận/huyện là bắt buộc.")
            .Must(value => HasTrimmedLengthAtMost(value, 100))
            .WithMessage("Quận/huyện không được vượt quá 100 ký tự.");

        RuleFor(x => x.SportIds)
            .NotEmpty()
            .WithMessage("Vui lòng chọn ít nhất một môn thể thao.");
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);

    private static bool HasTrimmedLengthAtMost(string? value, int maxLength) =>
        value is not null && value.Trim().Length <= maxLength;
}

public class CoachUpdateMyProfileRequestDtoValidator : AbstractValidator<CoachUpdateMyProfileRequestDto>
{
    public CoachUpdateMyProfileRequestDtoValidator()
    {
        RuleFor(x => x.DisplayName)
            .MaximumLength(200)
            .WithMessage("Tên hiển thị không được vượt quá 200 ký tự.")
            .When(x => x.DisplayName is not null);

        RuleFor(x => x.Bio)
            .MaximumLength(2000)
            .WithMessage("Giới thiệu không được vượt quá 2000 ký tự.")
            .When(x => x.Bio is not null);

        RuleFor(x => x.Achievements)
            .MaximumLength(2000)
            .WithMessage("Thành tích/chứng chỉ không được vượt quá 2000 ký tự.")
            .When(x => x.Achievements is not null);

        RuleFor(x => x.ExperienceYears)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Số năm kinh nghiệm không được nhỏ hơn 0.")
            .When(x => x.ExperienceYears.HasValue);

        RuleFor(x => x.HourlyRate)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Giá theo giờ không được nhỏ hơn 0.")
            .When(x => x.HourlyRate.HasValue);

        RuleFor(x => x.City)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Tỉnh/thành phố không được để trống.")
            .Must(value => HasTrimmedLengthAtMost(value, 100))
            .WithMessage("Tỉnh/thành phố không được vượt quá 100 ký tự.")
            .When(x => x.City is not null);

        RuleFor(x => x.District)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Quận/huyện không được để trống.")
            .Must(value => HasTrimmedLengthAtMost(value, 100))
            .WithMessage("Quận/huyện không được vượt quá 100 ký tự.")
            .When(x => x.District is not null);

        RuleFor(x => x.SportIds)
            .NotEmpty()
            .WithMessage("Vui lòng chọn ít nhất một môn thể thao.")
            .When(x => x.SportIds is not null);
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);

    private static bool HasTrimmedLengthAtMost(string? value, int maxLength) =>
        value is not null && value.Trim().Length <= maxLength;
}

public class UploadCoachProofRequestDtoValidator : AbstractValidator<UploadCoachProofRequestDto>
{
    public UploadCoachProofRequestDtoValidator()
    {
        RuleFor(x => x.Files)
            .NotEmpty()
            .WithMessage("Vui lòng chọn ít nhất một ảnh minh chứng.");

        RuleFor(x => x.ProofType)
            .IsInEnum()
            .WithMessage("Loại minh chứng không hợp lệ.");
    }
}

public class UploadCoachVerificationDocumentRequestDtoValidator : AbstractValidator<UploadCoachVerificationDocumentRequestDto>
{
    public UploadCoachVerificationDocumentRequestDtoValidator()
    {
        RuleFor(x => x.Files)
            .NotEmpty()
            .WithMessage("Vui lòng chọn ít nhất một tài liệu xác minh.");

        RuleFor(x => x.DocumentType)
            .IsInEnum()
            .WithMessage("Loại tài liệu xác minh không hợp lệ.");
    }
}

public class UploadCoachPortfolioImageRequestDtoValidator : AbstractValidator<UploadCoachPortfolioImageRequestDto>
{
    public UploadCoachPortfolioImageRequestDtoValidator()
    {
        RuleFor(x => x.Files)
            .NotEmpty()
            .WithMessage("Vui lòng chọn ít nhất một ảnh portfolio.");

        RuleFor(x => x.Caption)
            .MaximumLength(300)
            .WithMessage("Chú thích không được vượt quá 300 ký tự.")
            .When(x => x.Caption is not null);
    }
}
