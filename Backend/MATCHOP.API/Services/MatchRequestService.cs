using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Entities;
using MATCHOP.API.Helpers;
using MATCHOP.API.Hubs;
using MATCHOP.API.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;

namespace MATCHOP.API.Services
{
    public interface IMatchRequestService
    {
        Task<MatchRequestResponseDto> CreateRequestAsync(Guid senderId, CreateMatchRequestDto dto);
        Task<List<MatchRequestResponseDto>> GetPendingRequestsAsync(Guid userId);
        Task AcceptRequestAsync(Guid userId, Guid requestId);
        Task RejectRequestAsync(Guid userId, Guid requestId);
    }

    public class MatchRequestService : IMatchRequestService
    {
        private readonly IMatchRequestRepository _requestRepo;
        private readonly IChatService _chatService;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IChatRepository _chatRepo;

        public MatchRequestService(
            IMatchRequestRepository requestRepo, 
            IChatService chatService,
            IHubContext<ChatHub> hubContext,
            IChatRepository chatRepo)
        {
            _requestRepo = requestRepo;
            _chatService = chatService;
            _hubContext = hubContext;
            _chatRepo = chatRepo;
        }

        public async Task<MatchRequestResponseDto> CreateRequestAsync(Guid senderId, CreateMatchRequestDto dto)
        {
            if (await _requestRepo.ExistsAsync(dto.PostId, senderId))
                throw new AppException(ErrorCodes.ValidationError, "Bạn đã gửi yêu cầu tham gia trận này rồi.");

            var request = new MatchRequest
            {
                Id = Guid.NewGuid(),
                PostId = dto.PostId,
                SenderUserId = senderId,
                ReceiverUserId = dto.ReceiverUserId,
                Status = MatchRequestStatus.PENDING,
                CreatedAt = DateTime.UtcNow
            };

            await _requestRepo.AddAsync(request);

            var result = await _requestRepo.GetByIdAsync(request.Id);
            var response = MapToDto(result!);

            // SignalR Notification to receiver
            var connections = await _chatRepo.GetUserConnectionsAsync(dto.ReceiverUserId);
            foreach (var conn in connections)
            {
                await _hubContext.Clients.Client(conn).SendAsync("ReceiveMatchRequest", response);
            }

            return response;
        }

        public async Task<List<MatchRequestResponseDto>> GetPendingRequestsAsync(Guid userId)
        {
            var requests = await _requestRepo.GetPendingRequestsForUserAsync(userId);
            return requests.Select(MapToDto).ToList();
        }

        public async Task AcceptRequestAsync(Guid userId, Guid requestId)
        {
            var request = await _requestRepo.GetByIdAsync(requestId);
            if (request == null || request.ReceiverUserId != userId)
                throw new AppException(ErrorCodes.ValidationError, "Yêu cầu không tồn tại.", StatusCodes.Status404NotFound);

            if (request.Status != MatchRequestStatus.PENDING)
                throw new AppException(ErrorCodes.ValidationError, "Yêu cầu này đã được xử lý.");

            request.Status = MatchRequestStatus.ACCEPTED;
            request.RespondedAt = DateTime.UtcNow;
            await _requestRepo.UpdateAsync(request);

            // Create private conversation
            var conversation = await _chatService.CreatePrivateConversationAsync(request.SenderUserId, request.ReceiverUserId);

            // Notify both via SignalR
            var senderConnections = await _chatRepo.GetUserConnectionsAsync(request.SenderUserId);
            var receiverConnections = await _chatRepo.GetUserConnectionsAsync(request.ReceiverUserId);

            foreach (var conn in senderConnections)
            {
                await _hubContext.Clients.Client(conn).SendAsync("MatchRequestAccepted", new { requestId, conversationId = conversation.Id });
            }
            foreach (var conn in receiverConnections)
            {
                await _hubContext.Clients.Client(conn).SendAsync("MatchRequestAccepted", new { requestId, conversationId = conversation.Id });
            }
        }

        public async Task RejectRequestAsync(Guid userId, Guid requestId)
        {
            var request = await _requestRepo.GetByIdAsync(requestId);
            if (request == null || request.ReceiverUserId != userId)
                throw new AppException(ErrorCodes.ValidationError, "Yêu cầu không tồn tại.", StatusCodes.Status404NotFound);

            request.Status = MatchRequestStatus.REJECTED;
            request.RespondedAt = DateTime.UtcNow;
            await _requestRepo.UpdateAsync(request);

            // Notify sender
            var connections = await _chatRepo.GetUserConnectionsAsync(request.SenderUserId);
            foreach (var conn in connections)
            {
                await _hubContext.Clients.Client(conn).SendAsync("MatchRequestRejected", requestId);
            }
        }

        private MatchRequestResponseDto MapToDto(MatchRequest r)
        {
            return new MatchRequestResponseDto
            {
                Id = r.Id,
                PostId = r.PostId,
                SportName = r.Post.Sport.Name,
                SenderUserId = r.SenderUserId,
                SenderFullName = r.SenderUser.FullName,
                SenderAvatar = r.SenderUser.AvatarUrl,
                Status = r.Status.ToString(),
                CreatedAt = r.CreatedAt
            };
        }
    }
}
