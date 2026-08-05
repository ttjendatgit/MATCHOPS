using MATCHOP.API.DTOs.Coaches;
using MATCHOP.API.Entities;

namespace MATCHOP.API.Services;

public interface ICoachSessionService
{
    /// <summary>
    /// Idempotently creates the CoachSession for a just-accepted request
    /// (returns the existing one if already created). Called internally by
    /// CoachSessionRequestService right after a request transitions to
    /// ACCEPTED — not exposed as its own endpoint. Does NOT call
    /// SaveChangesAsync — the caller is responsible for persisting this
    /// together with its own tracked changes in one transaction.
    /// </summary>
    Task<CoachSession> CreateForAcceptedRequestAsync(CoachSessionRequest request, CoachProfile coachProfile);

    // Requester
    Task<List<CoachSessionResponseDto>> GetMySessionsAsync(Guid requesterId);
    Task<CoachSessionResponseDto> PayAsync(Guid requesterId, Guid sessionId, PayCoachSessionRequestDto dto);

    // Coach (own profile)
    Task<List<CoachSessionResponseDto>> GetMyCoachSessionsAsync(Guid coachUserId);
    Task<CoachSessionResponseDto> CompleteAsync(Guid coachUserId, Guid sessionId);

    // Shared, owner-scoped (either the requester or the coach)
    Task<CoachSessionResponseDto> GetSessionForUserAsync(Guid userId, Guid sessionId);
}
