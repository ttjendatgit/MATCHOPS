using FluentValidation;
using MATCHOP.API.DTOs.PriceRules;

namespace MATCHOP.API.Validators;

public class CreatePriceRuleDtoValidator : AbstractValidator<CreatePriceRuleDto>
{
    public CreatePriceRuleDtoValidator()
    {
        RuleFor(x => x.CourtId)
            .NotEmpty()
            .WithMessage("CourtId là bắt buộc.");

        RuleFor(x => x.DayType)
            .IsInEnum()
            .WithMessage("Loại ngày áp dụng không hợp lệ.");

        RuleFor(x => x)
            .Must(x => x.StartTime < x.EndTime)
            .OverridePropertyName("startTime")
            .WithMessage("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");

        RuleFor(x => x.PricePerHour)
            .GreaterThan(0)
            .WithMessage("Giá theo giờ phải lớn hơn 0.")
            .LessThanOrEqualTo(10000000)
            .WithMessage("Giá theo giờ vượt quá giới hạn cho phép.");
    }
}

public class UpdatePriceRuleDtoValidator : AbstractValidator<UpdatePriceRuleDto>
{
    public UpdatePriceRuleDtoValidator()
    {
        RuleFor(x => x)
            .Must(HasAtLeastOneChangedField)
            .OverridePropertyName("request")
            .WithMessage("Cần cung cấp ít nhất một thông tin để cập nhật.");

        RuleFor(x => x.DayType)
            .IsInEnum()
            .WithMessage("Loại ngày áp dụng không hợp lệ.")
            .When(x => x.DayType.HasValue);

        RuleFor(x => x)
            .Must(x => !x.StartTime.HasValue || !x.EndTime.HasValue || x.StartTime.Value < x.EndTime.Value)
            .OverridePropertyName("startTime")
            .WithMessage("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");

        RuleFor(x => x.PricePerHour)
            .GreaterThan(0)
            .WithMessage("Giá theo giờ phải lớn hơn 0.")
            .LessThanOrEqualTo(10000000)
            .WithMessage("Giá theo giờ vượt quá giới hạn cho phép.")
            .When(x => x.PricePerHour.HasValue);
    }

    private static bool HasAtLeastOneChangedField(UpdatePriceRuleDto dto)
    {
        return dto.DayType.HasValue ||
               dto.StartTime.HasValue ||
               dto.EndTime.HasValue ||
               dto.PricePerHour.HasValue;
    }
}

public class UpdatePriceRuleStatusDtoValidator : AbstractValidator<UpdatePriceRuleStatusDto>
{
    public UpdatePriceRuleStatusDtoValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum()
            .WithMessage("Trạng thái bảng giá không hợp lệ.");
    }
}
