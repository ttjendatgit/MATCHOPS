using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Services;

public class CoachSessionService : ICoachSessionService
{
    private readonly ApplicationDbContext _context;

    public CoachSessionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CoachSession> CreateForAcceptedRequestAsync(CoachSessionRequest request, CoachProfile coachProfile)
    {
        var existing = await _context.CoachSessions
            .FirstOrDefaultAsync(x => x.CoachSessionRequestId == request.Id);

        if (existing is not null)
        {
            return existing;
        }

        var session = new CoachSession
        {
            Id = Guid.NewGuid(),
            CoachSessionRequestId = request.Id,
            CoachProfileId = request.CoachProfileId,
            RequesterId = request.RequesterId,
            SportId = request.SportId,
            ScheduledDate = request.PreferredDate,
            ScheduledTimeSlot = request.PreferredTimeSlot,
            DurationMinutes = request.DurationMinutes,
            LocationNote = request.LocationNote,
            PriceAmount = CalculatePrice(coachProfile.HourlyRate, request.DurationMinutes),
            Currency = "VND",
            Status = CoachSessionStatus.AWAITING_PAYMENT,
            PaymentStatus = CoachSessionPaymentStatus.UNPAID,
            CreatedAt = DateTime.UtcNow
        };

        // Intentionally no SaveChangesAsync here — the caller
        // (CoachSessionRequestService.RespondToRequestAsync) persists this
        // together with the request's status change in a single
        // SaveChangesAsync call, so both writes commit atomically.
        _context.CoachSessions.Add(session);

        return session;
    }

    // ── Requester ─────────────────────────────────────────────────────────────

    public async Task<List<CoachSessionResponseDto>> GetMySessionsAsync(Guid requesterId)
    {
        var sessions = await _context.CoachSessions
            .Include(x => x.CoachProfile).ThenInclude(cp => cp.User)
            .Include(x => x.Requester)
            .Include(x => x.Sport)
            .AsNoTracking()
            .Where(x => x.RequesterId == requesterId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return sessions.Select(MapForRequester).ToList();
    }

    public async Task<CoachSessionResponseDto> PayAsync(Guid requesterId, Guid sessionId, PayCoachSessionRequestDto dto)
    {
        var session = await _context.CoachSessions
            .Include(x => x.CoachProfile).ThenInclude(cp => cp.User)
            .Include(x => x.Requester)
            .Include(x => x.Sport)
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.RequesterId == requesterId);

        if (session is null)
        {
            throw new AppException(
                ErrorCodes.CoachSessionNotFound,
                "Không tìm thấy buổi huấn luyện.",
                StatusCodes.Status404NotFound);
        }

        var payable = session.Status == CoachSessionStatus.AWAITING_PAYMENT &&
            (session.PaymentStatus == CoachSessionPaymentStatus.UNPAID ||
             session.PaymentStatus == CoachSessionPaymentStatus.FAILED);

        if (!payable)
        {
            throw new AppException(
                ErrorCodes.CoachSessionPaymentNotAllowed,
                "Buổi huấn luyện này không ở trạng thái chờ thanh toán.",
                StatusCodes.Status400BadRequest);
        }

        if (session.PriceAmount is null || session.PriceAmount <= 0)
        {
            throw new AppException(
                ErrorCodes.CoachSessionPaymentNotAllowed,
                "Buổi huấn luyện chưa có giá thanh toán.",
                StatusCodes.Status400BadRequest);
        }

        // MOCK payment confirmation — mirrors this project's existing, established
        // mock booking-payment pattern (BookingService.PayMyBookingMockAsync):
        // synchronous, server-side, ownership + status guarded, no external
        // gateway call. Real VNPay gateway integration is tightly coupled to
        // Booking (bookingId is embedded in vnp_OrderInfo and correlated back
        // to the Bookings table) and was not safely extendable to a second
        // payable entity within this change — see report.
        //
        // TransactionCode is always generated server-side — a client-supplied
        // value is never trusted for a payment confirmation record, even in
        // mock mode. `dto` is accepted only for request-shape compatibility;
        // its value is intentionally unused here.
        var transactionCode = $"MOCK-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}-{session.Id}";

        session.PaymentStatus = CoachSessionPaymentStatus.PAID;
        session.Status = CoachSessionStatus.PAID;
        session.PaymentTransactionCode = transactionCode;
        session.PaidAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapForRequester(session);
    }

    // ── Coach (own profile) ──────────────────────────────────────────────────

    public async Task<List<CoachSessionResponseDto>> GetMyCoachSessionsAsync(Guid coachUserId)
    {
        var profile = await GetOwnCoachProfileOrThrowAsync(coachUserId);

        var sessions = await _context.CoachSessions
            .Include(x => x.CoachProfile).ThenInclude(cp => cp.User)
            .Include(x => x.Requester)
            .Include(x => x.Sport)
            .AsNoTracking()
            .Where(x => x.CoachProfileId == profile.Id)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return sessions.Select(MapForCoach).ToList();
    }

    public async Task<CoachSessionResponseDto> CompleteAsync(Guid coachUserId, Guid sessionId)
    {
        var profile = await GetOwnCoachProfileOrThrowAsync(coachUserId);

        var session = await _context.CoachSessions
            .Include(x => x.CoachProfile).ThenInclude(cp => cp.User)
            .Include(x => x.Requester)
            .Include(x => x.Sport)
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.CoachProfileId == profile.Id);

        if (session is null)
        {
            throw new AppException(
                ErrorCodes.CoachSessionNotFound,
                "Không tìm thấy buổi huấn luyện.",
                StatusCodes.Status404NotFound);
        }

        if (session.Status != CoachSessionStatus.PAID || session.PaymentStatus != CoachSessionPaymentStatus.PAID)
        {
            throw new AppException(
                ErrorCodes.CoachSessionCompleteNotAllowed,
                "Chỉ có thể đánh dấu hoàn thành sau khi buổi huấn luyện đã được thanh toán.",
                StatusCodes.Status400BadRequest);
        }

        session.Status = CoachSessionStatus.COMPLETED;
        session.CompletedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapForCoach(session);
    }

    // ── Shared, owner-scoped detail ──────────────────────────────────────────

    public async Task<CoachSessionResponseDto> GetSessionForUserAsync(Guid userId, Guid sessionId)
    {
        var session = await _context.CoachSessions
            .Include(x => x.CoachProfile).ThenInclude(cp => cp.User)
            .Include(x => x.Requester)
            .Include(x => x.Sport)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == sessionId);

        if (session is null)
        {
            throw new AppException(
                ErrorCodes.CoachSessionNotFound,
                "Không tìm thấy buổi huấn luyện.",
                StatusCodes.Status404NotFound);
        }

        if (session.RequesterId == userId)
        {
            return MapForRequester(session);
        }

        if (session.CoachProfile.UserId == userId)
        {
            return MapForCoach(session);
        }

        // Not the owner on either side — 404, not 403, so session IDs can't
        // be enumerated to probe other users' data.
        throw new AppException(
            ErrorCodes.CoachSessionNotFound,
            "Không tìm thấy buổi huấn luyện.",
            StatusCodes.Status404NotFound);
    }

    // ── Shared lookups / helpers ─────────────────────────────────────────────

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

    private static decimal? CalculatePrice(decimal? hourlyRate, int? durationMinutes)
    {
        if (hourlyRate is null || durationMinutes is null || durationMinutes <= 0)
        {
            return null;
        }

        return Math.Round(hourlyRate.Value * durationMinutes.Value / 60m, 0, MidpointRounding.AwayFromZero);
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    private static CoachSessionResponseDto MapForRequester(CoachSession session) =>
        Map(session, includeRequesterContact: false);

    private static CoachSessionResponseDto MapForCoach(CoachSession session) =>
        Map(session, includeRequesterContact: true);

    private static CoachSessionResponseDto Map(CoachSession session, bool includeRequesterContact)
    {
        return new CoachSessionResponseDto
        {
            Id = session.Id,
            CoachSessionRequestId = session.CoachSessionRequestId,
            CoachProfileId = session.CoachProfileId,
            CoachDisplayName = ResolveCoachDisplayName(session.CoachProfile),
            RequesterId = session.RequesterId,
            RequesterName = session.Requester?.FullName ?? string.Empty,
            RequesterEmail = includeRequesterContact ? session.Requester?.Email : null,
            RequesterPhoneNumber = includeRequesterContact ? session.Requester?.PhoneNumber : null,
            SportId = session.SportId,
            SportName = session.Sport?.Name,
            ScheduledDate = session.ScheduledDate,
            ScheduledTimeSlot = session.ScheduledTimeSlot,
            DurationMinutes = session.DurationMinutes,
            LocationNote = session.LocationNote,
            PriceAmount = session.PriceAmount,
            Currency = session.Currency,
            RequiresManualPricing = session.PriceAmount is null,
            Status = session.Status.ToString(),
            PaymentStatus = session.PaymentStatus.ToString(),
            PaymentTransactionCode = session.PaymentTransactionCode,
            CreatedAt = session.CreatedAt,
            UpdatedAt = session.UpdatedAt,
            PaidAt = session.PaidAt,
            CancelledAt = session.CancelledAt,
            CompletedAt = session.CompletedAt
        };
    }

    private static string ResolveCoachDisplayName(CoachProfile? profile)
    {
        if (profile is null) return string.Empty;
        return !string.IsNullOrWhiteSpace(profile.DisplayName) ? profile.DisplayName! : (profile.User?.FullName ?? string.Empty);
    }
}
