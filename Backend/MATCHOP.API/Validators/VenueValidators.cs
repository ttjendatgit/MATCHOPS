using FluentValidation;
using MATCHOP.API.DTOs.Venues;

namespace MATCHOP.API.Validators;

public class CreateVenueDtoValidator : AbstractValidator<CreateVenueDto>
{
    public CreateVenueDtoValidator()
    {
        RuleFor(x => x.Name)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Tên venue là bắt buộc.")
            .Must(value => HasTrimmedLengthAtLeast(value, 2))
            .WithMessage("Tên venue phải có ít nhất 2 ký tự.")
            .Must(value => HasTrimmedLengthAtMost(value, 200))
            .WithMessage("Tên venue không được vượt quá 200 ký tự.");

        RuleFor(x => x.Address)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Địa chỉ là bắt buộc.")
            .Must(value => HasTrimmedLengthAtLeast(value, 5))
            .WithMessage("Địa chỉ phải có ít nhất 5 ký tự.")
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

        RuleFor(x => x.Ward)
            .MaximumLength(100)
            .WithMessage("Phường/xã không được vượt quá 100 ký tự.")
            .When(x => x.Ward is not null);

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90m, 90m)
            .WithMessage("Vĩ độ phải nằm trong khoảng -90 đến 90.")
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180m, 180m)
            .WithMessage("Kinh độ phải nằm trong khoảng -180 đến 180.")
            .When(x => x.Longitude.HasValue);

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .WithMessage("Mô tả không được vượt quá 2000 ký tự.")
            .When(x => x.Description is not null);

        RuleFor(x => x.OpeningTime)
            .Must((dto, openingTime) => openingTime < dto.ClosingTime)
            .WithMessage("Giờ mở cửa phải nhỏ hơn giờ đóng cửa.");

        AddImageRules(RuleFor(x => x.CoverImage));
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);

    private static bool HasTrimmedLengthAtLeast(string? value, int minLength) =>
        !string.IsNullOrWhiteSpace(value) && value.Trim().Length >= minLength;

    private static bool HasTrimmedLengthAtMost(string? value, int maxLength) =>
        value is not null && value.Trim().Length <= maxLength;

    private static void AddImageRules(IRuleBuilderInitial<CreateVenueDto, IFormFile?> rule)
    {
        rule.Cascade(CascadeMode.Stop)
            .Must(file => file is null || file.Length > 0)
            .WithMessage("Ảnh bìa không được rỗng.")
            .Must(file => file is null || VenueImageRules.IsAllowedSize(file))
            .WithMessage("Ảnh bìa không được vượt quá 5MB.")
            .Must(file => file is null || VenueImageRules.IsAllowedExtension(file))
            .WithMessage("Ảnh bìa chỉ chấp nhận định dạng JPG, PNG hoặc WEBP.")
            .Must(file => file is null || VenueImageRules.IsAllowedContentType(file))
            .WithMessage("Content-Type của ảnh bìa không hợp lệ.");
    }
}

public class UpdateVenueDtoValidator : AbstractValidator<UpdateVenueDto>
{
    public UpdateVenueDtoValidator()
    {
        RuleFor(x => x)
            .Must(HasAtLeastOneChangedField)
            .OverridePropertyName("request")
            .WithMessage("Cần cung cấp ít nhất một thông tin để cập nhật.");

        RuleFor(x => x.Name)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Tên venue không được để trống.")
            .Must(value => HasTrimmedLengthAtLeast(value, 2))
            .WithMessage("Tên venue phải có ít nhất 2 ký tự.")
            .Must(value => HasTrimmedLengthAtMost(value, 200))
            .WithMessage("Tên venue không được vượt quá 200 ký tự.")
            .When(x => x.Name is not null);

        RuleFor(x => x.Address)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Địa chỉ không được để trống.")
            .Must(value => HasTrimmedLengthAtLeast(value, 5))
            .WithMessage("Địa chỉ phải có ít nhất 5 ký tự.")
            .Must(value => HasTrimmedLengthAtMost(value, 500))
            .WithMessage("Địa chỉ không được vượt quá 500 ký tự.")
            .When(x => x.Address is not null);

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

        RuleFor(x => x.Ward)
            .MaximumLength(100)
            .WithMessage("Phường/xã không được vượt quá 100 ký tự.")
            .When(x => x.Ward is not null);

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90m, 90m)
            .WithMessage("Vĩ độ phải nằm trong khoảng -90 đến 90.")
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180m, 180m)
            .WithMessage("Kinh độ phải nằm trong khoảng -180 đến 180.")
            .When(x => x.Longitude.HasValue);

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .WithMessage("Mô tả không được vượt quá 2000 ký tự.")
            .When(x => x.Description is not null);

        RuleFor(x => x)
            .Must(dto => !dto.OpeningTime.HasValue ||
                         !dto.ClosingTime.HasValue ||
                         dto.OpeningTime.Value < dto.ClosingTime.Value)
            .OverridePropertyName("openingTime")
            .WithMessage("Giờ mở cửa phải nhỏ hơn giờ đóng cửa.");

        AddImageRules(RuleFor(x => x.CoverImage));
    }

    private static bool HasAtLeastOneChangedField(UpdateVenueDto dto)
    {
        return dto.Name is not null ||
               dto.Address is not null ||
               dto.City is not null ||
               dto.District is not null ||
               dto.Ward is not null ||
               dto.Latitude.HasValue ||
               dto.Longitude.HasValue ||
               dto.Description is not null ||
               dto.OpeningTime.HasValue ||
               dto.ClosingTime.HasValue ||
               dto.CoverImage is not null;
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);

    private static bool HasTrimmedLengthAtLeast(string? value, int minLength) =>
        !string.IsNullOrWhiteSpace(value) && value.Trim().Length >= minLength;

    private static bool HasTrimmedLengthAtMost(string? value, int maxLength) =>
        value is not null && value.Trim().Length <= maxLength;

    private static void AddImageRules(IRuleBuilderInitial<UpdateVenueDto, IFormFile?> rule)
    {
        rule.Cascade(CascadeMode.Stop)
            .Must(file => file is null || file.Length > 0)
            .WithMessage("Ảnh bìa không được rỗng.")
            .Must(file => file is null || VenueImageRules.IsAllowedSize(file))
            .WithMessage("Ảnh bìa không được vượt quá 5MB.")
            .Must(file => file is null || VenueImageRules.IsAllowedExtension(file))
            .WithMessage("Ảnh bìa chỉ chấp nhận định dạng JPG, PNG hoặc WEBP.")
            .Must(file => file is null || VenueImageRules.IsAllowedContentType(file))
            .WithMessage("Content-Type của ảnh bìa không hợp lệ.");
    }
}

internal static class VenueImageRules
{
    private const long MaxSizeBytes = 5 * 1024 * 1024;

    private static readonly string[] AllowedExtensions =
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    private static readonly string[] AllowedContentTypes =
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

    public static bool IsAllowedSize(IFormFile file) => file.Length <= MaxSizeBytes;

    public static bool IsAllowedExtension(IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        return AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase);
    }

    public static bool IsAllowedContentType(IFormFile file)
    {
        return AllowedContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase);
    }
}
