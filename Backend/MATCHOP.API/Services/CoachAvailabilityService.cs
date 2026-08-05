using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public class CoachAvailabilityService : ICoachAvailabilityService
{
    private readonly ApplicationDbContext _context;

    public CoachAvailabilityService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CoachAvailabilitySlotResponseDto>> GetMyAvailabilityAsync(Guid userId)
    {
        var profile = await GetOwnCoachProfileOrThrowAsync(userId);

        var slots = await _context.CoachAvailabilitySlots
            .AsNoTracking()
            .Where(x => x.CoachProfileId == profile.Id)
            .OrderBy(x => x.DayOfWeek)
            .ThenBy(x => x.StartTime)
            .ToListAsync();

        return slots.Select(Map).ToList();
    }

    public async Task<List<CoachAvailabilitySlotResponseDto>> ReplaceMyAvailabilityAsync(
        Guid userId,
        UpdateCoachAvailabilityRequestDto dto)
    {
        var profile = await GetOwnCoachProfileOrThrowAsync(userId);

        if (profile.Status == CoachProfileStatus.SUSPENDED)
        {
            throw new AppException(
                ErrorCodes.CoachProfileSuspended,
                "Hồ sơ huấn luyện viên đang bị tạm khóa, không thể chỉnh sửa lịch rảnh.",
                StatusCodes.Status403Forbidden);
        }

        var existing = await _context.CoachAvailabilitySlots
            .Where(x => x.CoachProfileId == profile.Id)
            .ToListAsync();

        if (existing.Count > 0)
        {
            _context.CoachAvailabilitySlots.RemoveRange(existing);
        }

        var now = DateTime.UtcNow;
        var newSlots = dto.Slots.Select(s => new CoachAvailabilitySlot
        {
            Id = Guid.NewGuid(),
            CoachProfileId = profile.Id,
            DayOfWeek = s.DayOfWeek,
            StartTime = TimeOnly.Parse(s.StartTime),
            EndTime = TimeOnly.Parse(s.EndTime),
            IsEnabled = s.IsEnabled,
            CreatedAt = now
        }).ToList();

        if (newSlots.Count > 0)
        {
            _context.CoachAvailabilitySlots.AddRange(newSlots);
        }

        await _context.SaveChangesAsync();

        return await GetMyAvailabilityAsync(userId);
    }

    private async Task<CoachProfile> GetOwnCoachProfileOrThrowAsync(Guid userId)
    {
        var profile = await _context.CoachProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (profile is null)
        {
            throw new AppException(
                ErrorCodes.CoachProfileNotFound,
                "Bạn chưa có hồ sơ huấn luyện viên.",
                StatusCodes.Status404NotFound);
        }

        return profile;
    }

    private static CoachAvailabilitySlotResponseDto Map(CoachAvailabilitySlot slot)
    {
        return new CoachAvailabilitySlotResponseDto
        {
            Id = slot.Id,
            DayOfWeek = slot.DayOfWeek,
            StartTime = slot.StartTime.ToString("HH:mm"),
            EndTime = slot.EndTime.ToString("HH:mm"),
            IsEnabled = slot.IsEnabled,
            CreatedAt = slot.CreatedAt,
            UpdatedAt = slot.UpdatedAt
        };
    }
}
