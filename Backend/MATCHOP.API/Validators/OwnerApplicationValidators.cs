using FluentValidation;
using MATCHOP.API.DTOs.OwnerApplications;

namespace MATCHOP.API.Validators;

public class OwnerApplyRequestDtoValidator : AbstractValidator<OwnerApplyRequestDto>
{
    public OwnerApplyRequestDtoValidator()
    {
        RuleFor(x => x.BusinessName)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Tên cơ sở/doanh nghiệp là bắt buộc.")
            .Must(value => HasTrimmedLengthAtMost(value, 200))
            .WithMessage("Tên cơ sở không được vượt quá 200 ký tự.");

        RuleFor(x => x.ContactPhone)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Số điện thoại liên hệ là bắt buộc.")
            .Must(value => HasTrimmedLengthAtMost(value, 20))
            .WithMessage("Số điện thoại không hợp lệ.");

        RuleFor(x => x.Address)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Địa chỉ là bắt buộc.")
            .Must(value => HasTrimmedLengthAtMost(value, 500))
            .WithMessage("Địa chỉ không được vượt quá 500 ký tự.");

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

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .WithMessage("Mô tả không được vượt quá 2000 ký tự.")
            .When(x => x.Description is not null);

        RuleFor(x => x.BusinessLicenseNumber)
            .MaximumLength(100)
            .WithMessage("Mã giấy phép không được vượt quá 100 ký tự.")
            .When(x => x.BusinessLicenseNumber is not null);
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);

    private static bool HasTrimmedLengthAtMost(string? value, int max) =>
        value is null || value.Trim().Length <= max;
}

public class RejectOwnerApplicationRequestDtoValidator : AbstractValidator<RejectOwnerApplicationRequestDto>
{
    public RejectOwnerApplicationRequestDtoValidator()
    {
        RuleFor(x => x.RejectionReason)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Lý do từ chối là bắt buộc.")
            .Must(value => HasTrimmedLengthAtMost(value, 500))
            .WithMessage("Lý do từ chối không được vượt quá 500 ký tự.");
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);

    private static bool HasTrimmedLengthAtMost(string? value, int max) =>
        value is null || value.Trim().Length <= max;
}

public class UpdateUserRoleRequestDtoValidator : AbstractValidator<MATCHOP.API.DTOs.Profile.UpdateUserRoleRequestDto>
{
    public UpdateUserRoleRequestDtoValidator()
    {
        RuleFor(x => x.Role)
            .Must(role => role is "USER" or "OWNER")
            .WithMessage("Chỉ có thể đặt vai trò USER hoặc OWNER.");
    }
}
