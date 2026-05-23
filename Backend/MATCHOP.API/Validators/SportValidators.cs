using FluentValidation;
using MATCHOP.API.DTOs.Sports;

namespace MATCHOP.API.Validators;

public class CreateSportDtoValidator : AbstractValidator<CreateSportDto>
{
    public CreateSportDtoValidator()
    {
        RuleFor(x => x.Name)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Tên môn thể thao là bắt buộc.")
            .Must(value => HasTrimmedLengthAtLeast(value, 2))
            .WithMessage("Tên môn thể thao phải có ít nhất 2 ký tự.")
            .Must(value => HasTrimmedLengthAtMost(value, 100))
            .WithMessage("Tên môn thể thao không được vượt quá 100 ký tự.");

        RuleFor(x => x.Icon)
            .MaximumLength(500)
            .WithMessage("Icon không được vượt quá 500 ký tự.")
            .When(x => x.Icon is not null);

        RuleFor(x => x.Description)
            .MaximumLength(1000)
            .WithMessage("Mô tả không được vượt quá 1000 ký tự.")
            .When(x => x.Description is not null);
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);

    private static bool HasTrimmedLengthAtLeast(string? value, int minLength) =>
        !string.IsNullOrWhiteSpace(value) && value.Trim().Length >= minLength;

    private static bool HasTrimmedLengthAtMost(string? value, int maxLength) =>
        value is not null && value.Trim().Length <= maxLength;
}

public class UpdateSportDtoValidator : AbstractValidator<UpdateSportDto>
{
    public UpdateSportDtoValidator()
    {
        RuleFor(x => x)
            .Must(HasAtLeastOneChangedField)
            .OverridePropertyName("request")
            .WithMessage("Cần cung cấp ít nhất một thông tin để cập nhật.");

        RuleFor(x => x.Name)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Tên môn thể thao không được để trống.")
            .Must(value => HasTrimmedLengthAtLeast(value, 2))
            .WithMessage("Tên môn thể thao phải có ít nhất 2 ký tự.")
            .Must(value => HasTrimmedLengthAtMost(value, 100))
            .WithMessage("Tên môn thể thao không được vượt quá 100 ký tự.")
            .When(x => x.Name is not null);

        RuleFor(x => x.Icon)
            .MaximumLength(500)
            .WithMessage("Icon không được vượt quá 500 ký tự.")
            .When(x => x.Icon is not null);

        RuleFor(x => x.Description)
            .MaximumLength(1000)
            .WithMessage("Mô tả không được vượt quá 1000 ký tự.")
            .When(x => x.Description is not null);

        RuleFor(x => x.Status)
            .IsInEnum()
            .WithMessage("Trạng thái môn thể thao không hợp lệ.")
            .When(x => x.Status.HasValue);
    }

    private static bool HasAtLeastOneChangedField(UpdateSportDto dto)
    {
        return dto.Name is not null ||
               dto.Icon is not null ||
               dto.Description is not null ||
               dto.Status.HasValue;
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);

    private static bool HasTrimmedLengthAtLeast(string? value, int minLength) =>
        !string.IsNullOrWhiteSpace(value) && value.Trim().Length >= minLength;

    private static bool HasTrimmedLengthAtMost(string? value, int maxLength) =>
        value is not null && value.Trim().Length <= maxLength;
}
