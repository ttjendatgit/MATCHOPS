using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Hubs;
using MATCHOP.API.Repositories;
using MATCHOP.API.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;

namespace MATCHOP.API.Services
{
    public interface IMatchRequestService
    {
        Task<MatchRequestResponseDto> CreateRequestAsync(Guid senderId, CreateMatchRequestDto dto, CancellationToken cancellationToken = default);
        Task<List<MatchRequestResponseDto>> GetPendingRequestsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<List<MatchRequestResponseDto>> GetSentRequestsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task AcceptRequestAsync(Guid userId, Guid requestId, CancellationToken cancellationToken = default);
        Task RejectRequestAsync(Guid userId, Guid requestId, CancellationToken cancellationToken = default);
        Task<MatchRequestAdminListDto> GetAllRequestsAsync(Guid? postId, string? status, int page, int pageSize, CancellationToken cancellationToken = default);
    }

    public class MatchRequestAdminListDto
    {
        public List<MatchRequestResponseDto> Requests { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class MatchRequestService : IMatchRequestService
    {
        private readonly IMatchRequestRepository _requestRepo;
        private readonly IMatchPostRepository _matchPostRepo;
        private readonly IMatchRoomRepository _roomRepo;
        private readonly IChatService _chatService;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IChatRepository _chatRepo;
        private readonly IMembershipService _membershipService;

        public MatchRequestService(
            IMatchRequestRepository requestRepo,
            IMatchPostRepository matchPostRepo,
            IMatchRoomRepository roomRepo,
            IChatService chatService,
            IHubContext<ChatHub> hubContext,
            IChatRepository chatRepo,
            IMembershipService membershipService)
        {
            _requestRepo = requestRepo;
            _matchPostRepo = matchPostRepo;
            _roomRepo = roomRepo;
            _chatService = chatService;
            _hubContext = hubContext;
            _chatRepo = chatRepo;
            _membershipService = membershipService;
        }

        public async Task<MatchRequestResponseDto> CreateRequestAsync(Guid senderId, CreateMatchRequestDto dto, CancellationToken cancellationToken = default)
        {
            // Check membership limits before creating request
            await _membershipService.CheckJoinRequestLimitAsync(senderId, cancellationToken);

            var post = await _matchPostRepo.GetByIdAsync(dto.PostId, cancellationToken);
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

            if (await _requestRepo.ExistsAsync(dto.PostId, senderId, cancellationToken))
                throw new AppException(ErrorCodes.ValidationError, "Bạn đã gửi yêu cầu tham gia trận này rồi.");

            // Membership quota: count join requests created this calendar month (UTC)
            var plan = await _membershipService.GetEffectivePlanAsync(senderId, UserRole.USER);
            // Fall back to USER_FREE limit (5) when seed data is missing
            int? maxJoins = plan is null ? 5 : plan.MaxJoinRequestsPerMonth;
            if (maxJoins is int joinLimit)
            {
                var now = DateTime.UtcNow;
                var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                var nextMonthStart = monthStart.AddMonths(1);
                var joinCount = await _requestRepo.CountBySenderInMonthAsync(senderId, monthStart, nextMonthStart);
                if (joinCount >= joinLimit)
                    throw new AppException(ErrorCodes.ValidationError,
                        $"Bạn đã dùng hết {joinLimit} yêu cầu tham gia trong tháng này. Nâng cấp Pro để tiếp tục.");
            }

            var request = new MatchRequest
            {
                Id = Guid.NewGuid(),
                PostId = dto.PostId,
                SenderUserId = senderId,
                ReceiverUserId = post.CreatorId,
                Status = MatchRequestStatus.PENDING,
                CreatedAt = DateTime.UtcNow
            };

            await _requestRepo.AddAsync(request, cancellationToken);

            var result = await _requestRepo.GetByIdAsync(request.Id, cancellationToken);
            var response = MapToDto(result!);

            var connections = await _chatRepo.GetUserConnectionsAsync(post.CreatorId, cancellationToken);
            foreach (var conn in connections)
            {
                await _hubContext.Clients.Client(conn).SendAsync("ReceiveMatchRequest", response, cancellationToken);
            }

            return response;
        }

        public async Task<List<MatchRequestResponseDto>> GetPendingRequestsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var requests = await _requestRepo.GetPendingRequestsForUserAsync(userId, cancellationToken);
            return requests.Select(MapToDto).ToList();
        }

        public async Task<List<MatchRequestResponseDto>> GetSentRequestsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var requests = await _requestRepo.GetSentRequestsAsync(userId, cancellationToken);
            var result = new List<MatchRequestResponseDto>();
            foreach (var r in requests)
            {
                var dto = MapToDto(r);
                if (r.Status == MatchRequestStatus.ACCEPTED)
                {
                    var room = await _roomRepo.GetByMatchPostIdAsync(r.PostId, cancellationToken);
                    dto.RoomId = room?.Id;
                }
                result.Add(dto);
            }
            return result;
        }

        public async Task AcceptRequestAsync(Guid userId, Guid requestId, CancellationToken cancellationToken = default)
        {
            var request = await _requestRepo.GetByIdAsync(requestId, cancellationToken);
            if (request == null || request.ReceiverUserId != userId)
                throw new AppException(ErrorCodes.ValidationError, "Yêu cầu không tồn tại.", StatusCodes.Status404NotFound);

            if (request.Status == MatchRequestStatus.ACCEPTED)
                throw new AppException(ErrorCodes.ValidationError, "Yêu cầu này đã được chấp nhận trước đó.");

            if (request.Status != MatchRequestStatus.PENDING)
                throw new AppException(ErrorCodes.ValidationError, "Chỉ có thể chấp nhận yêu cầu đang ở trạng thái chờ xử lý.");

            var post = await _matchPostRepo.GetByIdAsync(request.PostId, cancellationToken);
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

            await _requestRepo.AcceptWithPostUpdateAsync(request, post, cancellationToken);

            // Create or update the MatchRoom for this post
            await EnsureRoomForPostAsync(post, request.SenderUserId, cancellationToken);

            var conversation = await _chatService.CreatePrivateConversationAsync(request.SenderUserId, request.ReceiverUserId, cancellationToken);

            var senderConnections = await _chatRepo.GetUserConnectionsAsync(request.SenderUserId, cancellationToken);
            var receiverConnections = await _chatRepo.GetUserConnectionsAsync(request.ReceiverUserId, cancellationToken);

            foreach (var conn in senderConnections)
            {
                await _hubContext.Clients.Client(conn).SendAsync("MatchRequestAccepted", new { requestId, conversationId = conversation.Id }, cancellationToken);
            }
            foreach (var conn in receiverConnections)
            {
                await _hubContext.Clients.Client(conn).SendAsync("MatchRequestAccepted", new { requestId, conversationId = conversation.Id }, cancellationToken);
            }
        }

        public async Task RejectRequestAsync(Guid userId, Guid requestId, CancellationToken cancellationToken = default)
        {
            var request = await _requestRepo.GetByIdAsync(requestId, cancellationToken);
            if (request == null || request.ReceiverUserId != userId)
                throw new AppException(ErrorCodes.ValidationError, "Yêu cầu không tồn tại.", StatusCodes.Status404NotFound);

            if (request.Status != MatchRequestStatus.PENDING)
                throw new AppException(ErrorCodes.ValidationError, "Chỉ có thể từ chối yêu cầu đang ở trạng thái chờ xử lý.");

            request.Status = MatchRequestStatus.REJECTED;
            request.RespondedAt = DateTime.UtcNow;
            await _requestRepo.UpdateAsync(request, cancellationToken);

            var connections = await _chatRepo.GetUserConnectionsAsync(request.SenderUserId, cancellationToken);
            foreach (var conn in connections)
            {
                await _hubContext.Clients.Client(conn).SendAsync("MatchRequestRejected", requestId, cancellationToken);
            }
        }

        public async Task<MatchRequestAdminListDto> GetAllRequestsAsync(Guid? postId, string? status, int page, int pageSize, CancellationToken cancellationToken = default)
        {
            var (requests, totalCount) = await _requestRepo.GetAllForAdminAsync(postId, status, page, pageSize, cancellationToken);

            return new MatchRequestAdminListDto
            {
                Requests = requests.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }

        private async Task EnsureRoomForPostAsync(MatchPost post, Guid acceptedSenderUserId, CancellationToken cancellationToken = default)
        {
            var room = await _roomRepo.GetByMatchPostIdAsync(post.Id, cancellationToken);

            if (room == null)
            {
                // First acceptance: create the room
                var newRoom = new MatchRoom
                {
                    Id = Guid.NewGuid(),
                    SportId = post.SportId,
                    MatchPostId = post.Id,
                    Status = post.Status == MatchPostStatus.FILLED
                        ? MatchRoomStatus.CONFIRMED
                        : MatchRoomStatus.WAITING,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _roomRepo.AddAsync(newRoom, cancellationToken);
                room = newRoom;
            }
            else if (post.Status == MatchPostStatus.FILLED && room.Status == MatchRoomStatus.WAITING)
            {
                // Post just became full: promote room to CONFIRMED
                room.Status = MatchRoomStatus.CONFIRMED;
                await _roomRepo.UpdateAsync(room, cancellationToken);
            }

            // Add owner/host player if not already present (idempotent)
            if (await _roomRepo.GetPlayerAsync(room.Id, post.CreatorId, cancellationToken) == null)
            {
                await _roomRepo.AddPlayerAsync(new MatchRoomPlayer
                {
                    Id = Guid.NewGuid(),
                    RoomId = room.Id,
                    UserId = post.CreatorId,
                    IsHost = true,
                    Status = MatchRoomPlayerStatus.ACCEPTED,
                    JoinedAt = DateTime.UtcNow
                }, cancellationToken);
            }

            // Add accepted requester if not already present (idempotent)
            if (await _roomRepo.GetPlayerAsync(room.Id, acceptedSenderUserId, cancellationToken) == null)
            {
                await _roomRepo.AddPlayerAsync(new MatchRoomPlayer
                {
                    Id = Guid.NewGuid(),
                    RoomId = room.Id,
                    UserId = acceptedSenderUserId,
                    IsHost = false,
                    Status = MatchRoomPlayerStatus.ACCEPTED,
                    JoinedAt = DateTime.UtcNow
                }, cancellationToken);
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
