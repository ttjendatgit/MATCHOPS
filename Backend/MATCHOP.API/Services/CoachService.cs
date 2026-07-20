using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public class CoachService : ICoachService
{
    private readonly ApplicationDbContext _context;

    public CoachService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CoachProfileMeResponseDto> ApplyAsync(Guid userId, CoachApplyRequestDto dto)
    {
        var existing = await _context.CoachProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (existing is not null)
        {
            throw new AppException(
                ErrorCodes.CoachProfileAlreadyExists,
                "Bạn đã có hồ sơ huấn luyện viên hoặc đơn đăng ký đang chờ duyệt.",
                StatusCodes.Status409Conflict);
        }

        var sportIds = (dto.SportIds ?? new List<Guid>()).Distinct().ToList();
        await EnsureSportsExistAsync(sportIds);

        var profile = new CoachProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DisplayName = string.IsNullOrWhiteSpace(dto.DisplayName) ? null : dto.DisplayName.Trim(),
            Bio = string.IsNullOrWhiteSpace(dto.Bio) ? null : dto.Bio.Trim(),
            ExperienceYears = dto.ExperienceYears,
            HourlyRate = dto.HourlyRate,
            City = dto.City.Trim(),
            District = dto.District.Trim(),
            Status = CoachProfileStatus.PENDING_APPROVAL,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CoachProfiles.Add(profile);

        foreach (var sportId in sportIds)
        {
            _context.CoachSports.Add(new CoachSport
            {
                Id = Guid.NewGuid(),
                CoachProfileId = profile.Id,
                SportId = sportId,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        return await GetMyProfileAsync(userId);
    }

    public async Task<CoachProfileMeResponseDto> GetMyProfileAsync(Guid userId)
    {
        var profile = await GetOwnProfileOrThrowAsync(userId, tracking: false);
        return MapToResponse(profile);
    }

    public async Task<CoachProfileMeResponseDto> UpdateMyProfileAsync(Guid userId, CoachUpdateMyProfileRequestDto dto)
    {
        var profile = await GetOwnProfileOrThrowAsync(userId, tracking: true);

        if (profile.Status == CoachProfileStatus.SUSPENDED)
        {
            throw new AppException(
                ErrorCodes.CoachProfileSuspended,
                "Hồ sơ huấn luyện viên đang bị tạm khóa, không thể chỉnh sửa.",
                StatusCodes.Status403Forbidden);
        }

        if (dto.DisplayName is not null)
        {
            profile.DisplayName = string.IsNullOrWhiteSpace(dto.DisplayName) ? null : dto.DisplayName.Trim();
        }

        if (dto.Bio is not null)
        {
            profile.Bio = string.IsNullOrWhiteSpace(dto.Bio) ? null : dto.Bio.Trim();
        }

        if (dto.ExperienceYears.HasValue)
        {
            profile.ExperienceYears = dto.ExperienceYears.Value;
        }

        if (dto.HourlyRate.HasValue)
        {
            profile.HourlyRate = dto.HourlyRate.Value;
        }

        if (dto.City is not null)
        {
            profile.City = dto.City.Trim();
        }

        if (dto.District is not null)
        {
            profile.District = dto.District.Trim();
        }

        if (dto.SportIds is not null)
        {
            var requestedSportIds = dto.SportIds.Distinct().ToList();
            await EnsureSportsExistAsync(requestedSportIds);

            var requestedSet = requestedSportIds.ToHashSet();
            var existingSportIds = profile.CoachSports.Select(cs => cs.SportId).ToHashSet();

            var toRemove = profile.CoachSports
                .Where(cs => !requestedSet.Contains(cs.SportId))
                .ToList();

            if (toRemove.Count > 0)
            {
                _context.CoachSports.RemoveRange(toRemove);
            }

            var toAdd = requestedSportIds.Where(sportId => !existingSportIds.Contains(sportId));

            foreach (var sportId in toAdd)
            {
                _context.CoachSports.Add(new CoachSport
                {
                    Id = Guid.NewGuid(),
                    CoachProfileId = profile.Id,
                    SportId = sportId,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        if (profile.Status == CoachProfileStatus.REJECTED)
        {
            profile.Status = CoachProfileStatus.PENDING_APPROVAL;
            profile.RejectionReason = null;
        }

        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetMyProfileAsync(userId);
    }

    private async Task<CoachProfile> GetOwnProfileOrThrowAsync(Guid userId, bool tracking)
    {
        var query = _context.CoachProfiles
            .Include(x => x.CoachSports)
            .ThenInclude(x => x.Sport)
            .AsQueryable();

        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        var profile = await query.FirstOrDefaultAsync(x => x.UserId == userId);

        if (profile is null)
        {
            throw new AppException(
                ErrorCodes.CoachProfileNotFound,
                "Bạn chưa có hồ sơ huấn luyện viên.",
                StatusCodes.Status404NotFound);
        }

        return profile;
    }

    private async Task EnsureSportsExistAsync(List<Guid> sportIds)
    {
        if (sportIds.Count == 0)
        {
            throw new AppException(
                ErrorCodes.ValidationError,
                "Vui lòng chọn ít nhất một môn thể thao.");
        }

        var existingCount = await _context.Sports
            .CountAsync(x => sportIds.Contains(x.Id));

        if (existingCount != sportIds.Count)
        {
            throw new AppException(
                ErrorCodes.SportNotFound,
                "Một hoặc nhiều môn thể thao không tồn tại.");
        }
    }

    private static CoachProfileMeResponseDto MapToResponse(CoachProfile profile)
    {
        return new CoachProfileMeResponseDto
        {
            Id = profile.Id,
            DisplayName = profile.DisplayName,
            Bio = profile.Bio,
            ExperienceYears = profile.ExperienceYears,
            HourlyRate = profile.HourlyRate,
            City = profile.City,
            District = profile.District,
            Status = profile.Status.ToString(),
            RejectionReason = profile.RejectionReason,
            ApprovedAt = profile.ApprovedAt,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt,
            Sports = profile.CoachSports.Select(cs => new CoachSportResponseDto
            {
                SportId = cs.SportId,
                SportName = cs.Sport?.Name ?? "Unknown"
            }).ToList()
        };
    }
}
