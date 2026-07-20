using FluentValidation;
using MATCHOP.API.DTOs.Coaches;

namespace MATCHOP.API.Validators;

public class RejectCoachProfileRequestDtoValidator : AbstractValidator<RejectCoachProfileRequestDto>
{
    public RejectCoachProfileRequestDtoValidator()
    {
        RuleFor(x => x.RejectionReason)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Lý do từ chối là bắt buộc.")
            .Must(value => HasTrimmedLengthAtMost(value, 500))
            .WithMessage("Lý do từ chối không được vượt quá 500 ký tự.");
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);

    private static bool HasTrimmedLengthAtMost(string? value, int maxLength) =>
        value is not null && value.Trim().Length <= maxLength;
}

public class SuspendCoachProfileRequestDtoValidator : AbstractValidator<SuspendCoachProfileRequestDto>
{
    public SuspendCoachProfileRequestDtoValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .WithMessage("Lý do tạm khóa không được vượt quá 500 ký tự.")
            .When(x => x.Reason is not null);
    }
}
