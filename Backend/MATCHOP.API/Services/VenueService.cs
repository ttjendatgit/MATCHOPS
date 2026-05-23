using MATCHOP.API.DTOs.Venues;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories;

namespace MATCHOP.API.Services;

public class VenueService : IVenueService
{
    private readonly IVenueRepository _venueRepo;
    private readonly ICurrentUserService _currentUser;
    private readonly ICloudinaryService _cloudinary;
    private readonly ILogger<VenueService> _logger;

    public VenueService(
        IVenueRepository venueRepo,
        ICurrentUserService currentUser,
        ICloudinaryService cloudinary,
        ILogger<VenueService> logger)
    {
        _venueRepo = venueRepo;
        _currentUser = currentUser;
        _cloudinary = cloudinary;
        _logger = logger;
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private static VenueResponseDto ToDto(Venue v) => new()
    {
        Id = v.Id,
        OwnerId = v.OwnerId,
        OwnerName = v.Owner?.FullName ?? string.Empty,
        Name = v.Name,
        Address = v.Address,
        City = v.City,
        District = v.District,
        Ward = v.Ward,
        Latitude = v.Latitude,
        Longitude = v.Longitude,
        Description = v.Description,
        CoverImageUrl = v.CoverImageUrl,
        OpeningTime = v.OpeningTime,
        ClosingTime = v.ClosingTime,
        Status = v.Status.ToString(),
        CreatedAt = v.CreatedAt,
        UpdatedAt = v.UpdatedAt
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Guid GetCurrentUserId()
    {
        if (_currentUser.UserId is null)
            throw new AppException(
                ErrorCodes.UNAUTHORIZED,
                "Không xác định được người dùng.",
                401);

        return _currentUser.UserId.Value;
    }

    private static void ValidateOpeningClosingTime(TimeOnly opening, TimeOnly closing)
    {
        if (opening >= closing)
            throw new AppException(
                ErrorCodes.INVALID_TIME_RANGE,
                "OpeningTime phải nhỏ hơn ClosingTime.",
                400);
    }

    private async Task<Venue> GetVenueOrThrowAsync(Guid id)
    {
        var venue = await _venueRepo.GetByIdAsync(id);

        if (venue is null)
            throw new AppException(
                ErrorCodes.VENUE_NOT_FOUND,
                "Venue không tồn tại.",
                404);

        return venue;
    }

    private async Task SafeDeleteImageAsync(string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return;
        }

        try
        {
            await _cloudinary.DeleteImageAsync(imageUrl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete venue cover image {ImageUrl}", imageUrl);
        }
    }

    private async Task<Venue> GetOwnedVenueOrThrowAsync(Guid id)
    {
        var venue = await GetVenueOrThrowAsync(id);
        var ownerId = GetCurrentUserId();

        if (venue.OwnerId != ownerId)
            throw new AppException(
                ErrorCodes.FORBIDDEN,
                "Bạn không có quyền thao tác venue này.",
                403);

        return venue;
    }

    // ── Public ────────────────────────────────────────────────────────────────

    public async Task<List<VenueResponseDto>> GetActiveVenuesAsync(
        string? city,
        string? district,
        Guid? sportId,
        string? keyword)
    {
        var venues = await _venueRepo.GetActiveVenuesAsync(city, district, sportId, keyword);
        return venues.Select(ToDto).ToList();
    }

    public async Task<VenueResponseDto> GetActiveVenueByIdAsync(Guid id)
    {
        var venue = await _venueRepo.GetActiveByIdAsync(id);

        if (venue is null)
            throw new AppException(
                ErrorCodes.VENUE_NOT_FOUND,
                "Venue không tồn tại hoặc chưa được kích hoạt.",
                404);

        return ToDto(venue);
    }

    // ── Owner ─────────────────────────────────────────────────────────────────

    public async Task<VenueResponseDto> CreateVenueAsync(CreateVenueDto dto)
    {
        ValidateOpeningClosingTime(dto.OpeningTime, dto.ClosingTime);

        var ownerId = GetCurrentUserId();
        string? coverImageUrl = null;

        try
        {
            if (dto.CoverImage is not null)
            {
                coverImageUrl = await _cloudinary.UploadImageAsync(dto.CoverImage, "venues");
            }

            var venue = new Venue
            {
                Id = Guid.NewGuid(),
                OwnerId = ownerId,
                Name = dto.Name.Trim(),
                Address = dto.Address.Trim(),
                City = dto.City.Trim(),
                District = dto.District.Trim(),
                Ward = string.IsNullOrWhiteSpace(dto.Ward) ? null : dto.Ward.Trim(),
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                CoverImageUrl = coverImageUrl,
                OpeningTime = dto.OpeningTime,
                ClosingTime = dto.ClosingTime,
                Status = VenueStatus.PENDING_APPROVAL,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var created = await _venueRepo.CreateAsync(venue);
            return ToDto(created);
        }
        catch
        {
            await SafeDeleteImageAsync(coverImageUrl);
            throw;
        }
    }

    public async Task<List<VenueResponseDto>> GetOwnerVenuesAsync()
    {
        var ownerId = GetCurrentUserId();
        var venues = await _venueRepo.GetByOwnerIdAsync(ownerId);
        return venues.Select(ToDto).ToList();
    }

    public async Task<VenueResponseDto> GetOwnerVenueByIdAsync(Guid id)
    {
        var venue = await GetOwnedVenueOrThrowAsync(id);
        return ToDto(venue);
    }

    public async Task<VenueResponseDto> UpdateVenueAsync(Guid id, UpdateVenueDto dto)
    {
        var venue = await GetOwnedVenueOrThrowAsync(id);

        // Validate thời gian với giá trị hiện tại nếu chỉ update 1 trong 2
        var opening = dto.OpeningTime ?? venue.OpeningTime;
        var closing = dto.ClosingTime ?? venue.ClosingTime;
        ValidateOpeningClosingTime(opening, closing);

        var oldCoverImageUrl = venue.CoverImageUrl;
        string? newCoverImageUrl = null;

        try
        {
            if (dto.CoverImage is not null)
            {
                newCoverImageUrl = await _cloudinary.UploadImageAsync(dto.CoverImage, "venues");
            }

            // Chỉ update field nào được truyền vào (partial update)
            if (dto.Name is not null) venue.Name = dto.Name.Trim();
            if (dto.Address is not null) venue.Address = dto.Address.Trim();
            if (dto.City is not null) venue.City = dto.City.Trim();
            if (dto.District is not null) venue.District = dto.District.Trim();
            if (dto.Ward is not null) venue.Ward = string.IsNullOrWhiteSpace(dto.Ward) ? null : dto.Ward.Trim();
            if (dto.Latitude.HasValue) venue.Latitude = dto.Latitude;
            if (dto.Longitude.HasValue) venue.Longitude = dto.Longitude;
            if (dto.Description is not null) venue.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            if (dto.OpeningTime.HasValue) venue.OpeningTime = dto.OpeningTime.Value;
            if (dto.ClosingTime.HasValue) venue.ClosingTime = dto.ClosingTime.Value;
            if (newCoverImageUrl is not null) venue.CoverImageUrl = newCoverImageUrl;

            var updated = await _venueRepo.UpdateAsync(venue);

            if (newCoverImageUrl is not null &&
                !string.Equals(oldCoverImageUrl, newCoverImageUrl, StringComparison.OrdinalIgnoreCase))
            {
                await SafeDeleteImageAsync(oldCoverImageUrl);
            }

            return ToDto(updated);
        }
        catch
        {
            await SafeDeleteImageAsync(newCoverImageUrl);
            throw;
        }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    public async Task<VenueResponseDto> ApproveVenueAsync(Guid id)
    {
        var venue = await GetVenueOrThrowAsync(id);
        venue.Status = VenueStatus.ACTIVE;
        var updated = await _venueRepo.UpdateAsync(venue);
        return ToDto(updated);
    }

    public async Task<VenueResponseDto> RejectVenueAsync(Guid id)
    {
        var venue = await GetVenueOrThrowAsync(id);
        venue.Status = VenueStatus.REJECTED;
        var updated = await _venueRepo.UpdateAsync(venue);
        return ToDto(updated);
    }

    public async Task<VenueResponseDto> SuspendVenueAsync(Guid id)
    {
        var venue = await GetVenueOrThrowAsync(id);
        venue.Status = VenueStatus.SUSPENDED;
        var updated = await _venueRepo.UpdateAsync(venue);
        return ToDto(updated);
    }
}
