using FluentValidation;
using MATCHOP.API.DTOs.Coaches;

namespace MATCHOP.API.Validators;

public class CoachAvailabilitySlotInputDtoValidator : AbstractValidator<CoachAvailabilitySlotInputDto>
{
    public CoachAvailabilitySlotInputDtoValidator()
    {
        RuleFor(x => x.DayOfWeek)
            .InclusiveBetween(0, 6)
            .WithMessage("Thứ trong tuần không hợp lệ (0 = Chủ nhật ... 6 = Thứ bảy).");

        RuleFor(x => x.StartTime)
            .Must(BeAValidTime)
            .WithMessage("Giờ bắt đầu không hợp lệ. Định dạng: HH:mm.");

        RuleFor(x => x.EndTime)
            .Must(BeAValidTime)
            .WithMessage("Giờ kết thúc không hợp lệ. Định dạng: HH:mm.");

        RuleFor(x => x)
            .Must(HaveStartBeforeEnd)
            .WithMessage("Giờ bắt đầu phải trước giờ kết thúc.")
            .When(x => BeAValidTime(x.StartTime) && BeAValidTime(x.EndTime));
    }

    internal static bool BeAValidTime(string value) => TimeOnly.TryParse(value, out _);

    private static bool HaveStartBeforeEnd(CoachAvailabilitySlotInputDto dto) =>
        TimeOnly.TryParse(dto.StartTime, out var start) &&
        TimeOnly.TryParse(dto.EndTime, out var end) &&
        start < end;
}

public class UpdateCoachAvailabilityRequestDtoValidator : AbstractValidator<UpdateCoachAvailabilityRequestDto>
{
    public UpdateCoachAvailabilityRequestDtoValidator()
    {
        RuleForEach(x => x.Slots).SetValidator(new CoachAvailabilitySlotInputDtoValidator());

        RuleFor(x => x.Slots)
            .Must(NotOverlapWithinSameDay)
            .WithMessage("Các khung giờ đang bật không được trùng nhau trong cùng một ngày.");
    }

    private static bool NotOverlapWithinSameDay(List<CoachAvailabilitySlotInputDto> slots)
    {
        var groups = slots
            .Where(s => s.IsEnabled &&
                        CoachAvailabilitySlotInputDtoValidator.BeAValidTime(s.StartTime) &&
                        CoachAvailabilitySlotInputDtoValidator.BeAValidTime(s.EndTime))
            .GroupBy(s => s.DayOfWeek);

        foreach (var group in groups)
        {
            var ordered = group
                .Select(s => (Start: TimeOnly.Parse(s.StartTime), End: TimeOnly.Parse(s.EndTime)))
                .OrderBy(s => s.Start)
                .ToList();

            for (var i = 1; i < ordered.Count; i++)
            {
                if (ordered[i].Start < ordered[i - 1].End) return false;
            }
        }

        return true;
    }
}
