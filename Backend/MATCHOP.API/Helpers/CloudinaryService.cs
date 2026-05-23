using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using MATCHOP.API.DTOs.Uploads;

namespace MATCHOP.API.Helpers;

public interface ICloudinaryService
{
    // Giữ method cũ để Venue hiện tại không bị lỗi
    Task<string> UploadImageAsync(IFormFile file, string folder);

    Task DeleteImageAsync(string? imageUrl);

    // Method mới dùng cho production
    Task<UploadImageResultDto> UploadImageWithResultAsync(IFormFile file, string folder);

    Task<List<UploadImageResultDto>> UploadImagesAsync(
        List<IFormFile>? files,
        string folder,
        int maxCount = 5);

    Task DeleteImageByPublicIdAsync(string? publicId);

    Task DeleteImagesByPublicIdsAsync(IEnumerable<string?> publicIds);
}

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;

    private static readonly string[] AllowedExtensions =
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private static readonly string[] AllowedContentTypes =
    {
        "image/jpeg", "image/png", "image/webp"
    };

    private const long MaxSizeBytes = 5 * 1024 * 1024; // 5MB
    private const long MaxTotalSizeBytes = 20 * 1024 * 1024; // 20MB

    public CloudinaryService(IConfiguration config)
    {
        var section = config.GetSection("Cloudinary");
        var cloudName = section["CloudName"];
        var apiKey = section["ApiKey"];
        var apiSecret = section["ApiSecret"];

        if (string.IsNullOrWhiteSpace(cloudName) ||
            string.IsNullOrWhiteSpace(apiKey) ||
            string.IsNullOrWhiteSpace(apiSecret))
        {
            throw new InvalidOperationException("Cloudinary configuration is missing in appsettings.json.");
        }

        var account = new Account(cloudName, apiKey, apiSecret);

        _cloudinary = new Cloudinary(account);
        _cloudinary.Api.Secure = true;
    }

    public async Task<string> UploadImageAsync(IFormFile file, string folder)
    {
        var result = await UploadImageWithResultAsync(file, folder);

        return result.Url;
    }

    public async Task<UploadImageResultDto> UploadImageWithResultAsync(IFormFile file, string folder)
    {
        ValidateImage(file);

        await using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = $"matchop/{folder}",
            UseFilename = false,
            UniqueFilename = true,
            Overwrite = false,
            Transformation = new Transformation()
                .Quality("auto")
                .FetchFormat("auto")
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error is not null)
        {
            throw new AppException(
                ErrorCodes.UPLOAD_FAILED,
                $"Upload ảnh thất bại: {result.Error.Message}",
                500);
        }

        if (result.SecureUrl is null || string.IsNullOrWhiteSpace(result.PublicId))
        {
            throw new AppException(
                ErrorCodes.UPLOAD_FAILED,
                "Upload ảnh thất bại: Cloudinary không trả về đủ thông tin.",
                500);
        }

        return new UploadImageResultDto
        {
            Url = result.SecureUrl.ToString(),
            PublicId = result.PublicId
        };
    }

    public async Task<List<UploadImageResultDto>> UploadImagesAsync(
        List<IFormFile>? files,
        string folder,
        int maxCount = 5)
    {
        if (files == null || files.Count == 0)
        {
            return new List<UploadImageResultDto>();
        }

        ValidateImages(files, maxCount);

        var uploadedResults = new List<UploadImageResultDto>();

        try
        {
            foreach (var file in files)
            {
                var result = await UploadImageWithResultAsync(file, folder);
                uploadedResults.Add(result);
            }

            return uploadedResults;
        }
        catch
        {
            await DeleteImagesByPublicIdsAsync(uploadedResults.Select(x => x.PublicId));
            throw;
        }
    }

    public async Task DeleteImageAsync(string? imageUrl)
    {
        var publicId = ExtractPublicId(imageUrl);

        await DeleteImageByPublicIdAsync(publicId);
    }

    public async Task DeleteImageByPublicIdAsync(string? publicId)
    {
        if (string.IsNullOrWhiteSpace(publicId))
        {
            return;
        }

        var deleteParams = new DeletionParams(publicId);
        await _cloudinary.DestroyAsync(deleteParams);
    }

    public async Task DeleteImagesByPublicIdsAsync(IEnumerable<string?> publicIds)
    {
        foreach (var publicId in publicIds)
        {
            await DeleteImageByPublicIdAsync(publicId);
        }
    }

    private static void ValidateImages(List<IFormFile> files, int maxCount)
    {
        if (files.Count > maxCount)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                $"Chỉ được tải tối đa {maxCount} ảnh.",
                400);
        }

        var totalSize = files.Sum(x => x.Length);

        if (totalSize > MaxTotalSizeBytes)
        {
            throw new AppException(
                ErrorCodes.FILE_TOO_LARGE,
                "Tổng dung lượng ảnh không được vượt quá 20MB.",
                400);
        }

        foreach (var file in files)
        {
            ValidateImage(file);
        }
    }

    private static void ValidateImage(IFormFile file)
    {
        if (file == null || file.Length <= 0)
        {
            throw new AppException(
                ErrorCodes.INVALID_FILE_TYPE,
                "Ảnh không được rỗng.",
                400);
        }

        if (file.Length > MaxSizeBytes)
        {
            throw new AppException(
                ErrorCodes.FILE_TOO_LARGE,
                "Kích thước mỗi ảnh không được vượt quá 5MB.",
                400);
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!AllowedExtensions.Contains(ext))
        {
            throw new AppException(
                ErrorCodes.INVALID_FILE_TYPE,
                "Chỉ chấp nhận ảnh JPG, JPEG, PNG, WEBP.",
                400);
        }

        if (string.IsNullOrWhiteSpace(file.ContentType) ||
            !AllowedContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
        {
            throw new AppException(
                ErrorCodes.INVALID_FILE_TYPE,
                "Content-Type của ảnh không hợp lệ.",
                400);
        }
    }

    private static string? ExtractPublicId(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return null;
        }

        try
        {
            var uri = new Uri(url);
            var segments = uri.AbsolutePath.Split('/');
            var uploadIndex = Array.IndexOf(segments, "upload");

            if (uploadIndex < 0)
            {
                return null;
            }

            var afterUpload = segments.Skip(uploadIndex + 1).ToArray();

            if (afterUpload.Length > 0 &&
                afterUpload[0].StartsWith("v") &&
                int.TryParse(afterUpload[0][1..], out _))
            {
                afterUpload = afterUpload.Skip(1).ToArray();
            }

            var publicIdWithExt = string.Join("/", afterUpload);

            return Path.ChangeExtension(publicIdWithExt, null);
        }
        catch
        {
            return null;
        }
    }
}