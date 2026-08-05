using FluentValidation;
using MATCHOP.API.DTOs.Coaches;

namespace MATCHOP.API.Validators;

public class PayCoachSessionRequestDtoValidator : AbstractValidator<PayCoachSessionRequestDto>
{
    public PayCoachSessionRequestDtoValidator()
    {
        RuleFor(x => x.TransactionCode)
            .MaximumLength(100)
            .WithMessage("Mã giao dịch không được vượt quá 100 ký tự.")
            .When(x => x.TransactionCode is not null);
    }
}
