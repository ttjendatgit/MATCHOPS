using FluentValidation;
using MATCHOP.API.DTOs.Courts;

namespace MATCHOP.API.Validators;

public class CreateCourtDtoValidator : AbstractValidator<CreateCourtDto>
{
    public CreateCourtDtoValidator()
    {
        RuleFor(x => x.VenueId)
            .NotEmpty()
            .WithMessage("VenueId là bắt buộc.");

        RuleFor(x => x.SportId)
            .NotEmpty()
            .WithMessage("SportId là bắt buộc.");

        RuleFor(x => x.Name)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Tên sân là bắt buộc.")
            .Must(value => HasTrimmedLengthAtLeast(value, 2))
            .WithMessage("Tên sân phải có ít nhất 2 ký tự.")
            .Must(value => HasTrimmedLengthAtMost(value, 200))
            .WithMessage("Tên sân không được vượt quá 200 ký tự.");

        AddOptionalCourtRules();
        AddImageRules();
    }

    private void AddOptionalCourtRules()
    {
        RuleFor(x => x.Type)
            .MaximumLength(100)
            .WithMessage("Loại sân không được vượt quá 100 ký tự.")
            .When(x => x.Type is not null);

        RuleFor(x => x.Capacity)
            .InclusiveBetween(1, 100000)
            .WithMessage("Sức chứa phải lớn hơn 0.")
            .When(x => x.Capacity.HasValue);

        RuleFor(x => x.LocationNote)
            .MaximumLength(300)
            .WithMessage("Vị trí nội bộ không được vượt quá 300 ký tự.")
            .When(x => x.LocationNote is not null);

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .WithMessage("Mô tả không được vượt quá 2000 ký tự.")
            .When(x => x.Description is not null);
    }

    private void AddImageRules()
    {
        RuleFor(x => x.Images)
            .Must(images => images is null || images.Count <= 5)
            .WithMessage("Chỉ được tải tối đa 5 ảnh cho mỗi sân.")
            .Must(images => images is null || images.Sum(file => file.Length) <= 20 * 1024 * 1024)
            .WithMessage("Tổng dung lượng ảnh không được vượt quá 20MB.");

        RuleForEach(x => x.Images)
            .Cascade(CascadeMode.Stop)
            .Must(file => file.Length > 0)
            .WithMessage("Ảnh không được rỗng.")
            .Must(file => file.Length <= 5 * 1024 * 1024)
            .WithMessage("Mỗi ảnh không được vượt quá 5MB.")
            .Must(IsAllowedImageExtension)
            .WithMessage("Ảnh chỉ chấp nhận định dạng JPG, PNG hoặc WEBP.")
            .Must(IsAllowedImageContentType)
            .WithMessage("Content-Type của ảnh không hợp lệ.")
            .When(x => x.Images is not null);

        RuleFor(x => x)
            .Must(x =>
                !x.PrimaryImageIndex.HasValue ||
                (x.Images is not null &&
                 x.PrimaryImageIndex.Value >= 0 &&
                 x.PrimaryImageIndex.Value < x.Images.Count))
            .OverridePropertyName("primaryImageIndex")
            .WithMessage("Ảnh đại diện được chọn không hợp lệ.");
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);

    private static bool HasTrimmedLengthAtLeast(string? value, int minLength) =>
        !string.IsNullOrWhiteSpace(value) && value.Trim().Length >= minLength;

    private static bool HasTrimmedLengthAtMost(string? value, int maxLength) =>
        value is not null && value.Trim().Length <= maxLength;

    private static bool IsAllowedImageExtension(IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        return new[] { ".jpg", ".jpeg", ".png", ".webp" }
            .Contains(extension, StringComparer.OrdinalIgnoreCase);
    }

    private static bool IsAllowedImageContentType(IFormFile file)
    {
        return new[] { "image/jpeg", "image/png", "image/webp" }
            .Contains(file.ContentType, StringComparer.OrdinalIgnoreCase);
    }
}

public class UpdateCourtDtoValidator : AbstractValidator<UpdateCourtDto>
{
    public UpdateCourtDtoValidator()
    {
        RuleFor(x => x)
            .Must(HasAtLeastOneChangedField)
            .OverridePropertyName("request")
            .WithMessage("Cần cung cấp ít nhất một thông tin để cập nhật.");

        RuleFor(x => x.SportId)
            .NotEmpty()
            .WithMessage("SportId không hợp lệ.")
            .When(x => x.SportId.HasValue);

        RuleFor(x => x.Name)
            .Cascade(CascadeMode.Stop)
            .Must(NotBlank)
            .WithMessage("Tên sân không được để trống.")
            .Must(value => HasTrimmedLengthAtLeast(value, 2))
            .WithMessage("Tên sân phải có ít nhất 2 ký tự.")
            .Must(value => HasTrimmedLengthAtMost(value, 200))
            .WithMessage("Tên sân không được vượt quá 200 ký tự.")
            .When(x => x.Name is not null);

        RuleFor(x => x.Type)
            .MaximumLength(100)
            .WithMessage("Loại sân không được vượt quá 100 ký tự.")
            .When(x => x.Type is not null);

        RuleFor(x => x.Capacity)
            .InclusiveBetween(1, 100000)
            .WithMessage("Sức chứa phải lớn hơn 0.")
            .When(x => x.Capacity.HasValue);

        RuleFor(x => x.LocationNote)
            .MaximumLength(300)
            .WithMessage("Vị trí nội bộ không được vượt quá 300 ký tự.")
            .When(x => x.LocationNote is not null);

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .WithMessage("Mô tả không được vượt quá 2000 ký tự.")
            .When(x => x.Description is not null);
    }

    private static bool HasAtLeastOneChangedField(UpdateCourtDto dto)
    {
        return dto.SportId.HasValue ||
               dto.Name is not null ||
               dto.Type is not null ||
               dto.Capacity.HasValue ||
               dto.LocationNote is not null ||
               dto.Description is not null;
    }

    private static bool NotBlank(string? value) => !string.IsNullOrWhiteSpace(value);

    private static bool HasTrimmedLengthAtLeast(string? value, int minLength) =>
        !string.IsNullOrWhiteSpace(value) && value.Trim().Length >= minLength;

    private static bool HasTrimmedLengthAtMost(string? value, int maxLength) =>
        value is not null && value.Trim().Length <= maxLength;
}

public class UpdateCourtStatusDtoValidator : AbstractValidator<UpdateCourtStatusDto>
{
    public UpdateCourtStatusDtoValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum()
            .WithMessage("Trạng thái sân không hợp lệ.");
    }
}

public class CreateCourtBlockDtoValidator : AbstractValidator<CreateCourtBlockDto>
{
    public CreateCourtBlockDtoValidator()
    {
        RuleFor(x => x.CourtId)
            .NotEmpty()
            .WithMessage("CourtId là bắt buộc.");

        RuleFor(x => x.BlockDate)
            .Must(date => date != default)
            .WithMessage("Ngày khóa sân là bắt buộc.");

        RuleFor(x => x)
            .Must(x => x.StartTime < x.EndTime)
            .OverridePropertyName("startTime")
            .WithMessage("StartTime phải nhỏ hơn EndTime.");

        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .WithMessage("Lý do khóa sân không được vượt quá 500 ký tự.")
            .When(x => x.Reason is not null);
    }
}

public class CancelCourtBlockDtoValidator : AbstractValidator<CancelCourtBlockDto>
{
    public CancelCourtBlockDtoValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .WithMessage("Lý do hủy không được vượt quá 500 ký tự.")
            .When(x => x.Reason is not null);
    }
}
