using MATCHOP.API.DTOs.Courts;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories.Interfaces;
using MATCHOP.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public class CourtService : ICourtService
{
    private readonly ApplicationDbContext _context;
    private readonly ICourtRepository _courtRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IMembershipService _membershipService;

    public CourtService(
        ApplicationDbContext context,
        ICourtRepository courtRepository,
        ICurrentUserService currentUserService,
        ICloudinaryService cloudinaryService,
        IMembershipService membershipService)
    {
        _context = context;
        _courtRepository = courtRepository;
        _currentUserService = currentUserService;
        _cloudinaryService = cloudinaryService;
        _membershipService = membershipService;
    }

    public async Task<List<CourtResponseDto>> GetPublicCourtsByVenueIdAsync(Guid venueId, CancellationToken cancellationToken = default)
    {
        if (venueId == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "VenueId không hợp lệ.");
        }

        var venue = await _context.Venues
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == venueId && x.Status == VenueStatus.ACTIVE, cancellationToken);

        if (venue == null)
        {
            throw new AppException(
                ErrorCodes.VenueNotFound,
                "Không tìm thấy địa điểm sân đang hoạt động.",
                StatusCodes.Status404NotFound);
        }

        var courts = await _courtRepository.GetPublicCourtsByVenueIdAsync(venueId, cancellationToken);

        return courts.Select(MapToResponse).ToList();
    }

    public async Task<CourtResponseDto> GetPublicCourtByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "CourtId không hợp lệ.");
        }

        var court = await _courtRepository.GetPublicCourtByIdAsync(id, cancellationToken);

        if (court == null)
        {
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân đang hoạt động.",
                StatusCodes.Status404NotFound);
        }

        return MapToResponse(court);
    }

    public async Task<List<CourtResponseDto>> GetMyCourtsAsync(CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();

        var courts = await _courtRepository.GetOwnerCourtsAsync(ownerId, cancellationToken);

        return courts.Select(MapToResponse).ToList();
    }

    public async Task<CourtResponseDto> GetMyCourtByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();

        if (id == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "CourtId không hợp lệ.");
        }

        var court = await _courtRepository.GetOwnerCourtByIdAsync(id, ownerId, cancellationToken);

        if (court == null)
        {
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân của bạn.",
                StatusCodes.Status404NotFound);
        }

        return MapToResponse(court);
    }

    public async Task<CourtResponseDto> CreateMyCourtAsync(CreateCourtDto dto, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();

        // Check membership limits before creating court
        await _membershipService.CheckCourtLimitAsync(ownerId, cancellationToken);

        ValidateCreateCourtDto(dto);

        var venue = await _context.Venues
            .FirstOrDefaultAsync(x => x.Id == dto.VenueId, cancellationToken);

        if (venue == null)
        {
            throw new AppException(
                ErrorCodes.VenueNotFound,
                "Không tìm thấy địa điểm sân.",
                StatusCodes.Status404NotFound);
        }

        if (venue.OwnerId != ownerId)
        {
            throw new AppException(
                ErrorCodes.PermissionDenied,
                "Bạn không có quyền tạo sân trong địa điểm này.",
                StatusCodes.Status403Forbidden);
        }

        // Membership quota: count courts across all venues owned by this owner
        var plan = await _membershipService.GetEffectivePlanAsync(ownerId, UserRole.OWNER);
        // Fall back to OWNER_FREE limit (3) when seed data is missing
        int? maxCourts = plan is null ? 3 : plan.MaxCourts;
        if (maxCourts is int courtLimit)
        {
            var courtCount = await _context.Courts
                .CountAsync(c => c.Venue.OwnerId == ownerId);
            if (courtCount >= courtLimit)
                throw new AppException(ErrorCodes.ValidationError,
                    $"Bạn đã đạt giới hạn {courtLimit} sân của gói hiện tại. Nâng cấp gói Chủ sân để tiếp tục.");
        }

        if (venue.Status == VenueStatus.SUSPENDED || venue.Status == VenueStatus.REJECTED)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Không thể tạo sân trong địa điểm đã bị khóa hoặc bị từ chối.");
        }

        var sport = await _context.Sports
            .FirstOrDefaultAsync(x => x.Id == dto.SportId, cancellationToken);

        if (sport == null)
        {
            throw new AppException(
                ErrorCodes.SportNotFound,
                "Không tìm thấy môn thể thao.",
                StatusCodes.Status404NotFound);
        }

        if (sport.Status != SportStatus.ACTIVE)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Môn thể thao này hiện không hoạt động.");
        }

        var name = dto.Name.Trim();

        var duplicate = await _courtRepository.ExistsByNameInVenueAsync(dto.VenueId, name, cancellationToken);

        if (duplicate)
        {
            throw new AppException(
                ErrorCodes.CourtNameAlreadyExists,
                "Tên sân đã tồn tại trong địa điểm này.");
        }

        var uploadedImages = await _cloudinaryService.UploadImagesAsync(
            dto.Images,
            "courts",
            maxCount: 5,
            cancellationToken);

        try
        {
            var primaryIndex = dto.PrimaryImageIndex ?? 0;

            var primaryImage = uploadedImages.Count > 0
                ? uploadedImages[primaryIndex]
                : null;

            var court = new Court
            {
                Id = Guid.NewGuid(),
                VenueId = dto.VenueId,
                SportId = dto.SportId,
                Name = name,
                Type = ValidationHelper.NormalizeOptionalText(dto.Type),
                Capacity = dto.Capacity,
                LocationNote = ValidationHelper.NormalizeOptionalText(dto.LocationNote),
                Description = ValidationHelper.NormalizeOptionalText(dto.Description),
                ImageUrl = primaryImage?.Url,
                ImagePublicId = primaryImage?.PublicId,
                Status = CourtStatus.ACTIVE,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            for (var i = 0; i < uploadedImages.Count; i++)
            {
                var uploadedImage = uploadedImages[i];

                court.Images.Add(new CourtImage
                {
                    Id = Guid.NewGuid(),
                    CourtId = court.Id,
                    ImageUrl = uploadedImage.Url,
                    PublicId = uploadedImage.PublicId,
                    IsPrimary = i == primaryIndex,
                    SortOrder = i,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _courtRepository.AddAsync(court, cancellationToken);
            await _courtRepository.SaveChangesAsync(cancellationToken);

            var created = await _courtRepository.GetByIdAsync(court.Id, cancellationToken);

            return MapToResponse(created!);
        }
        catch
        {
            await _cloudinaryService.DeleteImagesByPublicIdsAsync(
                uploadedImages.Select(x => x.PublicId),
                cancellationToken);

            throw;
        }
    }

    public async Task<CourtResponseDto> UpdateMyCourtAsync(Guid id, UpdateCourtDto dto, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();

        if (id == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "CourtId không hợp lệ.");
        }

        var court = await _courtRepository.GetOwnerCourtByIdAsync(id, ownerId, cancellationToken);

        if (court == null)
        {
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân của bạn.",
                StatusCodes.Status404NotFound);
        }

        if (dto.SportId.HasValue)
        {
            if (dto.SportId.Value == Guid.Empty)
            {
                throw new AppException(ErrorCodes.ValidationError, "SportId không hợp lệ.");
            }

            var sport = await _context.Sports
                .FirstOrDefaultAsync(x => x.Id == dto.SportId.Value, cancellationToken);

            if (sport == null)
            {
                throw new AppException(
                    ErrorCodes.SportNotFound,
                    "Không tìm thấy môn thể thao.",
                    StatusCodes.Status404NotFound);
            }

            if (sport.Status != SportStatus.ACTIVE)
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    "Môn thể thao này hiện không hoạt động.");
            }

            court.SportId = dto.SportId.Value;
        }

        if (dto.Name != null)
        {
            ValidationHelper.ValidateRequiredText(
                dto.Name,
                "Tên sân",
                minLength: 2,
                maxLength: 200);

            var newName = dto.Name.Trim();

            var duplicate = await _courtRepository.ExistsByNameInVenueExceptAsync(
                court.VenueId,
                court.Id,
                newName,
                cancellationToken);

            if (duplicate)
            {
                throw new AppException(
                    ErrorCodes.CourtNameAlreadyExists,
                    "Tên sân đã tồn tại trong địa điểm này.");
            }

            court.Name = newName;
        }

        if (dto.Type != null)
        {
            ValidationHelper.ValidateOptionalDescription(
                dto.Type,
                "Loại sân",
                maxLength: 100);

            court.Type = ValidationHelper.NormalizeOptionalText(dto.Type);
        }

        if (dto.Capacity.HasValue)
        {
            ValidationHelper.ValidatePositiveNumber(dto.Capacity, "Sức chứa");

            court.Capacity = dto.Capacity;
        }

        if (dto.LocationNote != null)
        {
            ValidationHelper.ValidateOptionalDescription(
                dto.LocationNote,
                "Vị trí nội bộ của sân",
                maxLength: 300);

            court.LocationNote = ValidationHelper.NormalizeOptionalText(dto.LocationNote);
        }
        if (dto.Description != null)
        {
            ValidationHelper.ValidateOptionalDescription(
                dto.Description,
                "Mô tả",
                maxLength: 2000);

            court.Description = ValidationHelper.NormalizeOptionalText(dto.Description);
        }

        court.UpdatedAt = DateTime.UtcNow;

        _courtRepository.Update(court);
        await _courtRepository.SaveChangesAsync(cancellationToken);

        var updated = await _courtRepository.GetByIdAsync(court.Id, cancellationToken);

        return MapToResponse(updated!);
    }

    public async Task<CourtResponseDto> UpdateMyCourtStatusAsync(Guid id, UpdateCourtStatusDto dto, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();

        if (id == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "CourtId không hợp lệ.");
        }

        if (!Enum.IsDefined(typeof(CourtStatus), dto.Status))
        {
            throw new AppException(ErrorCodes.InvalidCourtStatus, "Trạng thái sân không hợp lệ.");
        }

        var court = await _courtRepository.GetOwnerCourtByIdAsync(id, ownerId, cancellationToken);

        if (court == null)
        {
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân của bạn.",
                StatusCodes.Status404NotFound);
        }

        court.Status = dto.Status;
        court.UpdatedAt = DateTime.UtcNow;

        _courtRepository.Update(court);
        await _courtRepository.SaveChangesAsync(cancellationToken);

        var updated = await _courtRepository.GetByIdAsync(court.Id, cancellationToken);

        return MapToResponse(updated!);
    }

    private Guid GetCurrentUserIdOrThrow()
    {
        var userId = _currentUserService.UserId;

        if (userId == null)
        {
            throw new AppException(
                ErrorCodes.AuthRequired,
                "Bạn chưa đăng nhập.",
                StatusCodes.Status401Unauthorized);
        }

        return userId.Value;
    }

    private static void ValidateCreateCourtDto(CreateCourtDto dto)
    {
        if (dto.VenueId == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "VenueId không hợp lệ.");
        }

        if (dto.SportId == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "SportId không hợp lệ.");
        }

        ValidationHelper.ValidateRequiredText(
            dto.Name,
            "Tên sân",
            minLength: 2,
            maxLength: 200);

        ValidationHelper.ValidateOptionalDescription(
            dto.Type,
            "Loại sân",
            maxLength: 100);

        ValidationHelper.ValidatePositiveNumber(
            dto.Capacity,
            "Sức chứa");

        ValidationHelper.ValidateOptionalDescription(
            dto.LocationNote,
            "Vị trí nội bộ của sân",
            maxLength: 300);

        ValidationHelper.ValidateOptionalDescription(
            dto.Description,
            "Mô tả",
            maxLength: 2000);

        ValidateImagesInput(dto.Images, dto.PrimaryImageIndex);
    }

    private static void ValidateImagesInput(List<IFormFile>? images, int? primaryImageIndex)
    {
        if (images == null || images.Count == 0)
        {
            if (primaryImageIndex.HasValue)
            {
                throw new AppException(
                    ErrorCodes.ValidationError,
                    "Không thể chọn ảnh đại diện khi chưa tải ảnh.");
            }

            return;
        }

        if (images.Count > 5)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Chỉ được tải tối đa 5 ảnh cho mỗi sân.");
        }

        if (primaryImageIndex.HasValue &&
            (primaryImageIndex.Value < 0 || primaryImageIndex.Value >= images.Count))
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Ảnh đại diện được chọn không hợp lệ.");
        }
    }

    public async Task<List<CourtResponseDto>> GetAllCourtsForAdminAsync(CancellationToken cancellationToken = default)
    {
        var courts = await _courtRepository.GetAllAsync(cancellationToken);
        return courts.Select(MapToResponse).ToList();
    }

    public async Task<CourtResponseDto> GetCourtByIdForAdminAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new AppException(ErrorCodes.ValidationError, "CourtId không hợp lệ.");

        var court = await _courtRepository.GetByIdAsync(id, cancellationToken);
        if (court == null)
            throw new AppException(ErrorCodes.CourtNotFound, "Không tìm thấy sân.", StatusCodes.Status404NotFound);

        return MapToResponse(court);
    }

    public async Task<CourtResponseDto> UpdateCourtStatusForAdminAsync(Guid id, UpdateCourtStatusDto dto, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new AppException(ErrorCodes.ValidationError, "CourtId không hợp lệ.");

        if (!Enum.IsDefined(typeof(CourtStatus), dto.Status))
            throw new AppException(ErrorCodes.InvalidCourtStatus, "Trạng thái sân không hợp lệ.");

        var court = await _courtRepository.GetByIdAsync(id, cancellationToken);
        if (court == null)
            throw new AppException(ErrorCodes.CourtNotFound, "Không tìm thấy sân.", StatusCodes.Status404NotFound);

        court.Status = dto.Status;
        court.UpdatedAt = DateTime.UtcNow;
        _courtRepository.Update(court);
        await _courtRepository.SaveChangesAsync(cancellationToken);

        var updated = await _courtRepository.GetByIdAsync(court.Id, cancellationToken);
        return MapToResponse(updated!);
    }

    private static CourtResponseDto MapToResponse(Court court)
    {
        return new CourtResponseDto
        {
            Id = court.Id,
            VenueId = court.VenueId,
            VenueName = court.Venue?.Name ?? string.Empty,
            VenueAddress = court.Venue?.Address ?? string.Empty,
            VenueCity = court.Venue?.City ?? string.Empty,
            VenueDistrict = court.Venue?.District ?? string.Empty,
            VenueWard = court.Venue?.Ward,
            VenueLatitude = court.Venue?.Latitude,
            VenueLongitude = court.Venue?.Longitude,
            SportId = court.SportId,
            SportName = court.Sport?.Name ?? string.Empty,
            Name = court.Name,
            Type = court.Type,
            Capacity = court.Capacity,
            LocationNote = court.LocationNote,
            Description = court.Description,
            ImageUrl = court.ImageUrl,
            Images = court.Images
                .OrderBy(x => x.SortOrder)
                .Select(x => new CourtImageResponseDto
                {
                    Id = x.Id,
                    ImageUrl = x.ImageUrl,
                    IsPrimary = x.IsPrimary,
                    SortOrder = x.SortOrder
                })
                .ToList(),
            Status = court.Status.ToString(),
            CreatedAt = court.CreatedAt,
            UpdatedAt = court.UpdatedAt
        };
    }
}