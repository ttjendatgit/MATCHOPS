using FluentValidation;
using MATCHOP.API.DTOs.Coaches;

namespace MATCHOP.API.Validators;

public class CreateCoachSessionRequestDtoValidator : AbstractValidator<CreateCoachSessionRequestDto>
{
    public CreateCoachSessionRequestDtoValidator()
    {
        RuleFor(x => x.PreferredDate)
            .GreaterThanOrEqualTo(_ => DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Ngày mong muốn không được ở trong quá khứ.")
            .When(x => x.PreferredDate.HasValue);

        RuleFor(x => x.PreferredTimeSlot)
            .MaximumLength(100)
            .WithMessage("Khung giờ mong muốn không được vượt quá 100 ký tự.")
            .When(x => x.PreferredTimeSlot is not null);

        RuleFor(x => x.DurationMinutes)
            .InclusiveBetween(30, 240)
            .WithMessage("Thời lượng buổi tập phải từ 30 đến 240 phút.")
            .When(x => x.DurationMinutes.HasValue);

        RuleFor(x => x.LocationNote)
            .MaximumLength(500)
            .WithMessage("Ghi chú địa điểm không được vượt quá 500 ký tự.")
            .When(x => x.LocationNote is not null);

        RuleFor(x => x.Message)
            .MaximumLength(1000)
            .WithMessage("Lời nhắn không được vượt quá 1000 ký tự.")
            .When(x => x.Message is not null);
    }
}

public class CoachRespondSessionRequestDtoValidator : AbstractValidator<CoachRespondSessionRequestDto>
{
    public CoachRespondSessionRequestDtoValidator()
    {
        RuleFor(x => x.ResponseMessage)
            .MaximumLength(1000)
            .WithMessage("Phản hồi không được vượt quá 1000 ký tự.")
            .When(x => x.ResponseMessage is not null);
    }
}
