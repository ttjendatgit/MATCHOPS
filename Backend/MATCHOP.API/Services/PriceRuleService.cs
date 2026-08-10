using MATCHOP.API.DTOs.PriceRules;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories.Interfaces;
using MATCHOP.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public class PriceRuleService : IPriceRuleService
{
    private readonly ApplicationDbContext _context;
    private readonly IPriceRuleRepository _priceRuleRepository;
    private readonly ICurrentUserService _currentUserService;

    private const decimal MaxPricePerHour = 10000000;

    public PriceRuleService(
        ApplicationDbContext context,
        IPriceRuleRepository priceRuleRepository,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _priceRuleRepository = priceRuleRepository;
        _currentUserService = currentUserService;
    }

    public async Task<PriceRuleResponseDto> CreateAsync(CreatePriceRuleDto dto, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();

        ValidateCreateDto(dto);

        var court = await _context.Courts
            .Include(x => x.Venue)
            .FirstOrDefaultAsync(x => x.Id == dto.CourtId, cancellationToken);

        if (court == null)
        {
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân.",
                StatusCodes.Status404NotFound);
        }

        if (court.Venue.OwnerId != ownerId)
        {
            throw new AppException(
                ErrorCodes.PermissionDenied,
                "Bạn không có quyền tạo bảng giá cho sân này.",
                StatusCodes.Status403Forbidden);
        }

        if (court.Status != CourtStatus.ACTIVE)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Chỉ có thể tạo bảng giá cho sân đang hoạt động.");
        }

        var hasOverlap = await _priceRuleRepository.HasOverlapAsync(
            dto.CourtId,
            dto.DayType,
            dto.StartTime,
            dto.EndTime,
            cancellationToken: cancellationToken);

        if (hasOverlap)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Khung giờ giá bị trùng với bảng giá đã tồn tại.");
        }

        var priceRule = new PriceRule
        {
            Id = Guid.NewGuid(),
            CourtId = dto.CourtId,
            DayType = dto.DayType,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            PricePerHour = dto.PricePerHour,
            Status = PriceRuleStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _priceRuleRepository.AddAsync(priceRule, cancellationToken);
        await _priceRuleRepository.SaveChangesAsync(cancellationToken);

        var created = await _priceRuleRepository.GetByIdAsync(priceRule.Id, cancellationToken);

        return MapToResponse(created!);
    }

    public async Task<List<PriceRuleResponseDto>> GetOwnerCourtPriceRulesAsync(Guid courtId, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();

        if (courtId == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "CourtId không hợp lệ.");
        }

        var court = await _context.Courts
            .Include(x => x.Venue)
            .FirstOrDefaultAsync(x => x.Id == courtId, cancellationToken);

        if (court == null)
        {
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân.",
                StatusCodes.Status404NotFound);
        }

        if (court.Venue.OwnerId != ownerId)
        {
            throw new AppException(
                ErrorCodes.PermissionDenied,
                "Bạn không có quyền xem bảng giá của sân này.",
                StatusCodes.Status403Forbidden);
        }

        var priceRules = await _priceRuleRepository.GetOwnerCourtPriceRulesAsync(courtId, ownerId, cancellationToken);

        return priceRules.Select(MapToResponse).ToList();
    }

    public async Task<List<PriceRuleResponseDto>> GetPublicCourtPriceRulesAsync(Guid courtId, CancellationToken cancellationToken = default)
    {
        if (courtId == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "CourtId không hợp lệ.");
        }

        var court = await _context.Courts
            .Include(x => x.Venue)
            .FirstOrDefaultAsync(x =>
                x.Id == courtId &&
                x.Status == CourtStatus.ACTIVE &&
                x.Venue.Status == VenueStatus.ACTIVE, cancellationToken);

        if (court == null)
        {
            throw new AppException(
                ErrorCodes.CourtNotFound,
                "Không tìm thấy sân đang hoạt động.",
                StatusCodes.Status404NotFound);
        }

        var priceRules = await _priceRuleRepository.GetPublicCourtPriceRulesAsync(courtId, cancellationToken);

        return priceRules.Select(MapToResponse).ToList();
    }

    public async Task<PriceRuleResponseDto> UpdateAsync(Guid id, UpdatePriceRuleDto dto, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();

        if (id == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "PriceRuleId không hợp lệ.");
        }

        var priceRule = await _priceRuleRepository.GetOwnerPriceRuleByIdAsync(id, ownerId, cancellationToken);

        if (priceRule == null)
        {
            throw new AppException(
                ErrorCodes.PriceRuleNotFound,
                "Không tìm thấy bảng giá của bạn.",
                StatusCodes.Status404NotFound);
        }

        var newDayType = dto.DayType ?? priceRule.DayType;
        var newStartTime = dto.StartTime ?? priceRule.StartTime;
        var newEndTime = dto.EndTime ?? priceRule.EndTime;
        var newPrice = dto.PricePerHour ?? priceRule.PricePerHour;

        ValidatePriceRuleValues(newDayType, newStartTime, newEndTime, newPrice);

        var hasOverlap = await _priceRuleRepository.HasOverlapAsync(
            priceRule.CourtId,
            newDayType,
            newStartTime,
            newEndTime,
            excludeId: priceRule.Id,
            cancellationToken: cancellationToken);

        if (hasOverlap)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Khung giờ giá bị trùng với bảng giá đã tồn tại.");
        }

        priceRule.DayType = newDayType;
        priceRule.StartTime = newStartTime;
        priceRule.EndTime = newEndTime;
        priceRule.PricePerHour = newPrice;
        priceRule.UpdatedAt = DateTime.UtcNow;

        _priceRuleRepository.Update(priceRule);
        await _priceRuleRepository.SaveChangesAsync(cancellationToken);

        var updated = await _priceRuleRepository.GetByIdAsync(priceRule.Id, cancellationToken);

        return MapToResponse(updated!);
    }

    public async Task<PriceRuleResponseDto> UpdateStatusAsync(Guid id, UpdatePriceRuleStatusDto dto, CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserIdOrThrow();

        if (id == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "PriceRuleId không hợp lệ.");
        }

        if (!Enum.IsDefined(typeof(PriceRuleStatus), dto.Status))
        {
            throw new AppException(ErrorCodes.ValidationError, "Trạng thái bảng giá không hợp lệ.");
        }

        var priceRule = await _priceRuleRepository.GetOwnerPriceRuleByIdAsync(id, ownerId, cancellationToken);

        if (priceRule == null)
        {
            throw new AppException(
                ErrorCodes.PriceRuleNotFound,
                "Không tìm thấy bảng giá của bạn.",
                StatusCodes.Status404NotFound);
        }

        priceRule.Status = dto.Status;
        priceRule.UpdatedAt = DateTime.UtcNow;

        _priceRuleRepository.Update(priceRule);
        await _priceRuleRepository.SaveChangesAsync(cancellationToken);

        var updated = await _priceRuleRepository.GetByIdAsync(priceRule.Id, cancellationToken);

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

    private static void ValidateCreateDto(CreatePriceRuleDto dto)
    {
        if (dto.CourtId == Guid.Empty)
        {
            throw new AppException(ErrorCodes.ValidationError, "CourtId không hợp lệ.");
        }

        ValidatePriceRuleValues(
            dto.DayType,
            dto.StartTime,
            dto.EndTime,
            dto.PricePerHour);
    }

    private static void ValidatePriceRuleValues(
        DayType dayType,
        TimeOnly startTime,
        TimeOnly endTime,
        decimal pricePerHour)
    {
        if (!Enum.IsDefined(typeof(DayType), dayType))
        {
            throw new AppException(ErrorCodes.ValidationError, "Loại ngày áp dụng không hợp lệ.");
        }

        if (startTime >= endTime)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
        }

        if (pricePerHour <= 0)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Giá theo giờ phải lớn hơn 0.");
        }

        if (pricePerHour > MaxPricePerHour)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Giá theo giờ vượt quá giới hạn cho phép.");
        }
    }

    private static PriceRuleResponseDto MapToResponse(PriceRule priceRule)
    {
        return new PriceRuleResponseDto
        {
            Id = priceRule.Id,
            CourtId = priceRule.CourtId,
            CourtName = priceRule.Court?.Name ?? string.Empty,
            DayType = priceRule.DayType.ToString(),
            StartTime = priceRule.StartTime,
            EndTime = priceRule.EndTime,
            PricePerHour = priceRule.PricePerHour,
            Status = priceRule.Status.ToString(),
            CreatedAt = priceRule.CreatedAt,
            UpdatedAt = priceRule.UpdatedAt
        };
    }
}