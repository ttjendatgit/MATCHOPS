using MATCHOP.API.DTOs.Coaches;

namespace MATCHOP.API.Services;

public interface ICoachSessionRequestService
{
    // Requester
    Task<CoachSessionRequestResponseDto> CreateAsync(Guid requesterId, Guid coachProfileId, CreateCoachSessionRequestDto dto);
    Task<List<CoachSessionRequestResponseDto>> GetMySentRequestsAsync(Guid requesterId);
    Task<CoachSessionRequestResponseDto> CancelMyRequestAsync(Guid requesterId, Guid requestId);

    // Coach (own profile)
    Task<List<CoachSessionRequestResponseDto>> GetMyIncomingRequestsAsync(Guid coachUserId);
    Task<CoachSessionRequestResponseDto> AcceptRequestAsync(Guid coachUserId, Guid requestId, CoachRespondSessionRequestDto dto);
    Task<CoachSessionRequestResponseDto> DeclineRequestAsync(Guid coachUserId, Guid requestId, CoachRespondSessionRequestDto dto);
}
