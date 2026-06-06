using FluentValidation;
using MATCHOP.API.DTOs.Bookings;

namespace MATCHOP.API.Validators;

public class CreateBookingDtoValidator : AbstractValidator<CreateBookingDto>
{
    public CreateBookingDtoValidator()
    {
        AddBookingTimeRules();

        RuleFor(x => x.Note)
            .MaximumLength(1000)
            .WithMessage("Ghi chú không được vượt quá 1000 ký tự.")
            .When(x => x.Note is not null);
    }

    private void AddBookingTimeRules()
    {
        RuleFor(x => x.CourtId)
            .NotEmpty()
            .WithMessage("CourtId là bắt buộc.");

        RuleFor(x => x.BookingDate)
            .Must(date => date != default)
            .WithMessage("Ngày đặt sân là bắt buộc.");

        RuleFor(x => x)
            .Must(x => x.StartTime < x.EndTime)
            .OverridePropertyName("startTime")
            .WithMessage("StartTime phải nhỏ hơn EndTime.");
    }
}

public class CreateOfflineBookingDtoValidator : AbstractValidator<CreateOfflineBookingDto>
{
    public CreateOfflineBookingDtoValidator()
    {
        RuleFor(x => x.CourtId)
            .NotEmpty()
            .WithMessage("CourtId là bắt buộc.");

        RuleFor(x => x.BookingDate)
            .Must(date => date != default)
            .WithMessage("Ngày đặt sân là bắt buộc.");

        RuleFor(x => x)
            .Must(x => x.StartTime < x.EndTime)
            .OverridePropertyName("startTime")
            .WithMessage("StartTime phải nhỏ hơn EndTime.");

        RuleFor(x => x.CustomerName)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Tên khách hàng là bắt buộc.")
            .Must(value => value!.Trim().Length <= 200)
            .WithMessage("Tên khách hàng không được vượt quá 200 ký tự.");

        RuleFor(x => x.CustomerPhone)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Số điện thoại khách hàng là bắt buộc.")
            .MaximumLength(20)
            .WithMessage("Số điện thoại không được vượt quá 20 ký tự.")
            .Matches(@"^\+?[0-9\s().-]{8,20}$")
            .WithMessage("Số điện thoại không đúng định dạng.");

        RuleFor(x => x.Note)
            .MaximumLength(1000)
            .WithMessage("Ghi chú không được vượt quá 1000 ký tự.")
            .When(x => x.Note is not null);
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);
}

public class MockPaymentRequestDtoValidator : AbstractValidator<MockPaymentRequestDto>
{
    public MockPaymentRequestDtoValidator()
    {
        RuleFor(x => x.TransactionCode)
            .MaximumLength(100)
            .WithMessage("Mã giao dịch không được vượt quá 100 ký tự.")
            .When(x => x.TransactionCode is not null);
    }
}

public class CancelBookingDtoValidator : AbstractValidator<CancelBookingDto>
{
    public CancelBookingDtoValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .WithMessage("Lý do hủy không được vượt quá 500 ký tự.")
            .When(x => x.Reason is not null);
    }
}
