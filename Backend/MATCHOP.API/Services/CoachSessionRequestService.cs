using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public class CoachSessionRequestService : ICoachSessionRequestService
{
    private readonly ApplicationDbContext _context;

    public CoachSessionRequestService(ApplicationDbContext context)
    {
        _context = context;
    }

    // ── Requester ─────────────────────────────────────────────────────────────

    public async Task<CoachSessionRequestResponseDto> CreateAsync(
        Guid requesterId,
        Guid coachProfileId,
        CreateCoachSessionRequestDto dto)
    {
        var profile = await _context.CoachProfiles
            .Include(x => x.User)
            .Include(x => x.CoachSports)
            .FirstOrDefaultAsync(x => x.Id == coachProfileId);

        if (profile is null)
        {
            throw new AppException(
                ErrorCodes.CoachProfileNotFound,
                "Không tìm thấy huấn luyện viên.",
                StatusCodes.Status404NotFound);
        }

        if (profile.Status == CoachProfileStatus.SUSPENDED)
        {
            throw new AppException(
                ErrorCodes.CoachProfileSuspended,
                "Huấn luyện viên này hiện không nhận yêu cầu buổi huấn luyện.",
                StatusCodes.Status403Forbidden);
        }

        if (profile.Status != CoachProfileStatus.ACTIVE)
        {
            throw new AppException(
                ErrorCodes.CoachProfileNotActive,
                "Huấn luyện viên này chưa sẵn sàng nhận yêu cầu buổi huấn luyện.",
                StatusCodes.Status400BadRequest);
        }

        if (profile.UserId == requesterId)
        {
            throw new AppException(
                ErrorCodes.CoachCannotRequestOwnProfile,
                "Bạn không thể gửi yêu cầu buổi huấn luyện cho chính hồ sơ của mình.",
                StatusCodes.Status400BadRequest);
        }

        if (dto.SportId.HasValue && !profile.CoachSports.Any(cs => cs.SportId == dto.SportId.Value))
        {
            throw new AppException(
                ErrorCodes.CoachSportNotOffered,
                "Huấn luyện viên này không dạy môn thể thao đã chọn.",
                StatusCodes.Status400BadRequest);
        }

        // Spam guard: only one active PENDING request per requester/coach for
        // a given preferred date (including "no date specified" as one
        // bucket). A different preferred date is treated as a distinct,
        // legitimate request.
        var duplicate = await _context.CoachSessionRequests
            .Where(x =>
                x.RequesterId == requesterId &&
                x.CoachProfileId == coachProfileId &&
                x.Status == CoachSessionRequestStatus.PENDING &&
                x.PreferredDate == dto.PreferredDate)
            .AnyAsync();

        if (duplicate)
        {
            throw new AppException(
                ErrorCodes.CoachSessionRequestDuplicate,
                "Bạn đã có một yêu cầu đang chờ xử lý với huấn luyện viên này cho thời gian tương tự.",
                StatusCodes.Status409Conflict);
        }

        var request = new CoachSessionRequest
        {
            Id = Guid.NewGuid(),
            CoachProfileId = profile.Id,
            RequesterId = requesterId,
            SportId = dto.SportId,
            PreferredDate = dto.PreferredDate,
            PreferredTimeSlot = string.IsNullOrWhiteSpace(dto.PreferredTimeSlot) ? null : dto.PreferredTimeSlot.Trim(),
            DurationMinutes = dto.DurationMinutes,
            LocationNote = string.IsNullOrWhiteSpace(dto.LocationNote) ? null : dto.LocationNote.Trim(),
            Message = string.IsNullOrWhiteSpace(dto.Message) ? null : dto.Message.Trim(),
            Status = CoachSessionRequestStatus.PENDING,
            CreatedAt = DateTime.UtcNow
        };

        _context.CoachSessionRequests.Add(request);
        await _context.SaveChangesAsync();

        var created = await GetOwnSentRequestOrThrowAsync(requesterId, request.Id);
        return MapForRequester(created);
    }

    public async Task<List<CoachSessionRequestResponseDto>> GetMySentRequestsAsync(Guid requesterId)
    {
        var requests = await _context.CoachSessionRequests
            .Include(x => x.CoachProfile)
            .ThenInclude(cp => cp.User)
            .Include(x => x.Sport)
            .AsNoTracking()
            .Where(x => x.RequesterId == requesterId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return requests.Select(MapForRequester).ToList();
    }

    public async Task<CoachSessionRequestResponseDto> CancelMyRequestAsync(Guid requesterId, Guid requestId)
    {
        var request = await GetOwnSentRequestOrThrowAsync(requesterId, requestId, tracking: true);

        if (request.Status != CoachSessionRequestStatus.PENDING)
        {
            throw new AppException(
                ErrorCodes.CoachSessionRequestNotPending,
                "Chỉ có thể huỷ yêu cầu đang chờ xử lý.",
                StatusCodes.Status400BadRequest);
        }

        request.Status = CoachSessionRequestStatus.CANCELLED;
        request.CancelledAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapForRequester(request);
    }

    // ── Coach (own profile) ──────────────────────────────────────────────────

    public async Task<List<CoachSessionRequestResponseDto>> GetMyIncomingRequestsAsync(Guid coachUserId)
    {
        var profile = await GetOwnCoachProfileOrThrowAsync(coachUserId);

        var requests = await _context.CoachSessionRequests
            .Include(x => x.CoachProfile)
            .ThenInclude(cp => cp.User)
            .Include(x => x.Requester)
            .Include(x => x.Sport)
            .AsNoTracking()
            .Where(x => x.CoachProfileId == profile.Id)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return requests.Select(MapForCoach).ToList();
    }

    public async Task<CoachSessionRequestResponseDto> AcceptRequestAsync(
        Guid coachUserId,
        Guid requestId,
        CoachRespondSessionRequestDto dto)
    {
        var request = await RespondToRequestAsync(coachUserId, requestId, CoachSessionRequestStatus.ACCEPTED, dto);
        return MapForCoach(request);
    }

    public async Task<CoachSessionRequestResponseDto> DeclineRequestAsync(
        Guid coachUserId,
        Guid requestId,
        CoachRespondSessionRequestDto dto)
    {
        var request = await RespondToRequestAsync(coachUserId, requestId, CoachSessionRequestStatus.DECLINED, dto);
        return MapForCoach(request);
    }

    private async Task<CoachSessionRequest> RespondToRequestAsync(
        Guid coachUserId,
        Guid requestId,
        CoachSessionRequestStatus resolution,
        CoachRespondSessionRequestDto dto)
    {
        var profile = await GetOwnCoachProfileOrThrowAsync(coachUserId);

        var request = await _context.CoachSessionRequests
            .Include(x => x.CoachProfile)
            .ThenInclude(cp => cp.User)
            .Include(x => x.Requester)
            .Include(x => x.Sport)
            .FirstOrDefaultAsync(x => x.Id == requestId && x.CoachProfileId == profile.Id);

        if (request is null)
        {
            throw new AppException(
                ErrorCodes.CoachSessionRequestNotFound,
                "Không tìm thấy yêu cầu buổi huấn luyện.",
                StatusCodes.Status404NotFound);
        }

        if (request.Status != CoachSessionRequestStatus.PENDING)
        {
            throw new AppException(
                ErrorCodes.CoachSessionRequestNotPending,
                "Yêu cầu này không còn ở trạng thái chờ xử lý.",
                StatusCodes.Status400BadRequest);
        }

        request.Status = resolution;
        request.CoachResponseMessage = string.IsNullOrWhiteSpace(dto.ResponseMessage) ? null : dto.ResponseMessage.Trim();
        request.RespondedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return request;
    }

    // ── Shared lookups ───────────────────────────────────────────────────────

    private async Task<CoachSessionRequest> GetOwnSentRequestOrThrowAsync(Guid requesterId, Guid requestId, bool tracking = false)
    {
        var query = _context.CoachSessionRequests
            .Include(x => x.CoachProfile)
            .ThenInclude(cp => cp.User)
            .Include(x => x.Sport)
            .AsQueryable();

        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        // Not-found (rather than forbidden) for requests the caller doesn't
        // own, so request IDs can't be enumerated to probe other users' data.
        var request = await query.FirstOrDefaultAsync(x => x.Id == requestId && x.RequesterId == requesterId);

        if (request is null)
        {
            throw new AppException(
                ErrorCodes.CoachSessionRequestNotFound,
                "Không tìm thấy yêu cầu buổi huấn luyện.",
                StatusCodes.Status404NotFound);
        }

        return request;
    }

    private async Task<CoachProfile> GetOwnCoachProfileOrThrowAsync(Guid coachUserId)
    {
        var profile = await _context.CoachProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == coachUserId);

        if (profile is null)
        {
            throw new AppException(
                ErrorCodes.CoachProfileNotFound,
                "Bạn chưa có hồ sơ huấn luyện viên.",
                StatusCodes.Status404NotFound);
        }

        return profile;
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    private static CoachSessionRequestResponseDto MapForRequester(CoachSessionRequest request) =>
        Map(request, includeRequesterContact: false);

    private static CoachSessionRequestResponseDto MapForCoach(CoachSessionRequest request) =>
        Map(request, includeRequesterContact: true);

    private static CoachSessionRequestResponseDto Map(CoachSessionRequest request, bool includeRequesterContact)
    {
        return new CoachSessionRequestResponseDto
        {
            Id = request.Id,
            CoachProfileId = request.CoachProfileId,
            CoachDisplayName = ResolveCoachDisplayName(request.CoachProfile),
            RequesterId = request.RequesterId,
            RequesterName = request.Requester?.FullName ?? string.Empty,
            RequesterEmail = includeRequesterContact ? request.Requester?.Email : null,
            RequesterPhoneNumber = includeRequesterContact ? request.Requester?.PhoneNumber : null,
            SportId = request.SportId,
            SportName = request.Sport?.Name,
            PreferredDate = request.PreferredDate,
            PreferredTimeSlot = request.PreferredTimeSlot,
            DurationMinutes = request.DurationMinutes,
            LocationNote = request.LocationNote,
            Message = request.Message,
            Status = request.Status.ToString(),
            CoachResponseMessage = request.CoachResponseMessage,
            CreatedAt = request.CreatedAt,
            UpdatedAt = request.UpdatedAt,
            RespondedAt = request.RespondedAt,
            CancelledAt = request.CancelledAt
        };
    }

    private static string ResolveCoachDisplayName(CoachProfile? profile)
    {
        if (profile is null) return string.Empty;
        return !string.IsNullOrWhiteSpace(profile.DisplayName) ? profile.DisplayName! : (profile.User?.FullName ?? string.Empty);
    }
}
