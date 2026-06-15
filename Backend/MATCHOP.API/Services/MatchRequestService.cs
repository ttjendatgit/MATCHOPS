using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
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
        Task<List<MatchRequestResponseDto>> GetSentRequestsAsync(Guid userId);
        Task AcceptRequestAsync(Guid userId, Guid requestId);
        Task RejectRequestAsync(Guid userId, Guid requestId);
    }

    public class MatchRequestService : IMatchRequestService
    {
        private readonly IMatchRequestRepository _requestRepo;
        private readonly IMatchPostRepository _matchPostRepo;
        private readonly IChatService _chatService;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IChatRepository _chatRepo;

        public MatchRequestService(
            IMatchRequestRepository requestRepo,
            IMatchPostRepository matchPostRepo,
            IChatService chatService,
            IHubContext<ChatHub> hubContext,
            IChatRepository chatRepo)
        {
            _requestRepo = requestRepo;
            _matchPostRepo = matchPostRepo;
            _chatService = chatService;
            _hubContext = hubContext;
            _chatRepo = chatRepo;
        }

        public async Task<MatchRequestResponseDto> CreateRequestAsync(Guid senderId, CreateMatchRequestDto dto)
        {
            var post = await _matchPostRepo.GetByIdAsync(dto.PostId);
            if (post == null)
                throw new AppException(ErrorCodes.ValidationError, "Bài đăng không tồn tại.", StatusCodes.Status404NotFound);

            if (post.CreatorId == senderId)
                throw new AppException(ErrorCodes.ValidationError, "Bạn không thể tham gia bài đăng do chính mình tạo.");

            if (post.Status != MatchPostStatus.OPEN)
                throw new AppException(ErrorCodes.ValidationError, "Bài đăng này không còn mở để tham gia.");

            if (post.PreferredTime <= DateTime.UtcNow)
                throw new AppException(ErrorCodes.ValidationError, "Bài đăng này đã hết hạn.");

            if (post.SlotsFilled >= post.SlotsNeeded)
                throw new AppException(ErrorCodes.ValidationError, "Bài đăng này đã đủ người tham gia.");

            if (await _requestRepo.ExistsAsync(dto.PostId, senderId))
                throw new AppException(ErrorCodes.ValidationError, "Bạn đã gửi yêu cầu tham gia trận này rồi.");

            var request = new MatchRequest
            {
                Id = Guid.NewGuid(),
                PostId = dto.PostId,
                SenderUserId = senderId,
                ReceiverUserId = post.CreatorId,
                Status = MatchRequestStatus.PENDING,
                CreatedAt = DateTime.UtcNow
            };

            await _requestRepo.AddAsync(request);

            var result = await _requestRepo.GetByIdAsync(request.Id);
            var response = MapToDto(result!);

            var connections = await _chatRepo.GetUserConnectionsAsync(post.CreatorId);
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

        public async Task<List<MatchRequestResponseDto>> GetSentRequestsAsync(Guid userId)
        {
            var requests = await _requestRepo.GetSentRequestsAsync(userId);
            return requests.Select(MapToDto).ToList();
        }

        public async Task AcceptRequestAsync(Guid userId, Guid requestId)
        {
            var request = await _requestRepo.GetByIdAsync(requestId);
            if (request == null || request.ReceiverUserId != userId)
                throw new AppException(ErrorCodes.ValidationError, "Yêu cầu không tồn tại.", StatusCodes.Status404NotFound);

            if (request.Status == MatchRequestStatus.ACCEPTED)
                throw new AppException(ErrorCodes.ValidationError, "Yêu cầu này đã được chấp nhận trước đó.");

            if (request.Status != MatchRequestStatus.PENDING)
                throw new AppException(ErrorCodes.ValidationError, "Chỉ có thể chấp nhận yêu cầu đang ở trạng thái chờ xử lý.");

            var post = await _matchPostRepo.GetByIdAsync(request.PostId);
            if (post == null)
                throw new AppException(ErrorCodes.ValidationError, "Bài đăng liên quan không còn tồn tại.", StatusCodes.Status404NotFound);

            if (post.Status != MatchPostStatus.OPEN)
                throw new AppException(ErrorCodes.ValidationError, "Bài đăng này không còn mở để chấp nhận thêm người.");

            if (post.PreferredTime <= DateTime.UtcNow)
                throw new AppException(ErrorCodes.ValidationError, "Bài đăng này đã hết hạn, không thể chấp nhận thêm.");

            if (post.SlotsFilled >= post.SlotsNeeded)
                throw new AppException(ErrorCodes.ValidationError, "Bài đăng đã đủ người, không thể chấp nhận thêm yêu cầu.");

            // Update both atomically in a single SaveChanges
            request.Status = MatchRequestStatus.ACCEPTED;
            request.RespondedAt = DateTime.UtcNow;

            post.SlotsFilled += 1;
            if (post.SlotsFilled >= post.SlotsNeeded)
                post.Status = MatchPostStatus.FILLED;

            await _requestRepo.AcceptWithPostUpdateAsync(request, post);

            var conversation = await _chatService.CreatePrivateConversationAsync(request.SenderUserId, request.ReceiverUserId);

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

            if (request.Status != MatchRequestStatus.PENDING)
                throw new AppException(ErrorCodes.ValidationError, "Chỉ có thể từ chối yêu cầu đang ở trạng thái chờ xử lý.");

            request.Status = MatchRequestStatus.REJECTED;
            request.RespondedAt = DateTime.UtcNow;
            await _requestRepo.UpdateAsync(request);

            var connections = await _chatRepo.GetUserConnectionsAsync(request.SenderUserId);
            foreach (var conn in connections)
            {
                await _hubContext.Clients.Client(conn).SendAsync("MatchRequestRejected", requestId);
            }
        }

        private static MatchRequestResponseDto MapToDto(MatchRequest r)
        {
            return new MatchRequestResponseDto
            {
                Id = r.Id,
                PostId = r.PostId,
                SportName = r.Post?.Sport?.Name ?? string.Empty,
                SenderUserId = r.SenderUserId,
                SenderFullName = r.SenderUser?.FullName ?? string.Empty,
                SenderAvatar = r.SenderUser?.AvatarUrl,
                ReceiverUserId = r.ReceiverUserId,
                ReceiverFullName = r.ReceiverUser?.FullName ?? string.Empty,
                ReceiverAvatar = r.ReceiverUser?.AvatarUrl,
                PostDistrict = r.Post?.District ?? string.Empty,
                PostCity = r.Post?.City ?? string.Empty,
                PostPreferredTime = r.Post?.PreferredTime ?? DateTime.MinValue,
                Status = r.Status.ToString(),
                CreatedAt = r.CreatedAt
            };
        }
    }
}
