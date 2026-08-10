using System.Text.RegularExpressions;

namespace MATCHOP.API.Helpers
{
    public static class ValidationHelper
    {
        private static readonly Regex SafeNameRegex = new(
            @"^[\p{L}\p{N}\s\.,\-_\&\(\)\/]+$",
            RegexOptions.Compiled | RegexOptions.CultureInvariant);

        private static readonly Regex DangerousContentRegex = new(
            @"(<\s*script|<\/\s*script|<[^>]+>|javascript:|onerror\s*=|onload\s*=|SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+|DROP\s+|ALTER\s+|--|;)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.CultureInvariant);

        public static void ValidateRequiredText(
            string? value,
            string fieldName,
            int minLength,
            int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} không được để trống.");
            }

            var normalized = value.Trim();

            if (normalized.Length < minLength)
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} phải có ít nhất {minLength} ký tự.");
            }

            if (normalized.Length > maxLength)
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} không được vượt quá {maxLength} ký tự.");
            }

            if (!SafeNameRegex.IsMatch(normalized))
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} chỉ được chứa chữ, số, khoảng trắng và các ký tự . , - _ & ( ) /.");
            }

            if (ContainsDangerousContent(normalized))
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} chứa nội dung không hợp lệ.");
            }
        }

        public static void ValidateOptionalName(
            string? value,
            string fieldName,
            int minLength,
            int maxLength)
        {
            if (value == null)
            {
                return;
            }

            ValidateRequiredText(value, fieldName, minLength, maxLength);
        }

        public static void ValidateOptionalDescription(
            string? value,
            string fieldName,
            int maxLength)
        {
            if (value == null)
            {
                return;
            }

            var normalized = value.Trim();

            if (string.IsNullOrWhiteSpace(normalized))
            {
                return;
            }

            if (normalized.Length > maxLength)
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} không được vượt quá {maxLength} ký tự.");
            }

            if (ContainsDangerousContent(normalized))
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} chứa nội dung không hợp lệ.");
            }
        }

        public static void ValidateOptionalUrl(
            string? value,
            string fieldName,
            int maxLength = 1000)
        {
            if (value == null)
            {
                return;
            }

            var normalized = value.Trim();

            if (string.IsNullOrWhiteSpace(normalized))
            {
                return;
            }

            if (normalized.Length > maxLength)
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} không được vượt quá {maxLength} ký tự.");
            }

            var isValidUrl = Uri.TryCreate(normalized, UriKind.Absolute, out var uri)
                             && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);

            if (!isValidUrl)
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} phải là URL hợp lệ bắt đầu bằng http hoặc https.");
            }

            if (ContainsDangerousContent(normalized))
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} chứa nội dung không hợp lệ.");
            }
        }

        public static void ValidatePositiveNumber(int? value, string fieldName)
        {
            if (value.HasValue && value.Value <= 0)
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} phải lớn hơn 0.");
            }
        }

        public static string? NormalizeOptionalText(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        public static string NormalizeRequiredText(string value)
        {
            return value.Trim();
        }

        public static bool ContainsDangerousContent(string value)
        {
            return DangerousContentRegex.IsMatch(value);
        }

        private static readonly Regex SafeAddressRegex = new(
    @"^[\p{L}\p{N}\s\.\-_,\/\(\)#]+$",
    RegexOptions.Compiled | RegexOptions.CultureInvariant);

        public static void ValidateRequiredAddress(
            string? value,
            string fieldName,
            int minLength,
            int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} không được để trống.");
            }

            var normalized = value.Trim();

            if (normalized.Length < minLength)
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} phải có ít nhất {minLength} ký tự.");
            }

            if (normalized.Length > maxLength)
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} không được vượt quá {maxLength} ký tự.");
            }

            if (!SafeAddressRegex.IsMatch(normalized))
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} chứa ký tự không hợp lệ.");
            }

            if (ContainsDangerousContent(normalized))
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    $"{fieldName} chứa nội dung không hợp lệ.");
            }
        }
    }
}