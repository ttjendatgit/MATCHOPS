using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories;

using MATCHOP.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace MATCHOP.API.Services
{
    public class MatchQueueService : IMatchQueueService
    {
        private readonly IMatchQueueRepository _matchQueueRepository;
        private readonly IUserSkillRepository _userSkillRepository;
        private readonly IMatchRoomRepository _matchRoomRepository;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IChatRepository _chatRepository;

        public MatchQueueService(
            IMatchQueueRepository matchQueueRepository,
            IUserSkillRepository userSkillRepository,
            IMatchRoomRepository matchRoomRepository,
            IHubContext<ChatHub> hubContext,
            IChatRepository chatRepository)
        {
            _matchQueueRepository = matchQueueRepository;
            _userSkillRepository = userSkillRepository;
            _matchRoomRepository = matchRoomRepository;
            _hubContext = hubContext;
            _chatRepository = chatRepository;
        }

        public async Task JoinQueueAsync(Guid userId, JoinQueueDto dto, CancellationToken cancellationToken = default)
        {
            var userSkill = await _userSkillRepository.GetAsync(userId, dto.SportId, cancellationToken);
            if (userSkill == null)
            {
                throw new AppException(ErrorCodes.ValidationError, "Bạn cần cập nhật trình độ cho môn thể thao này trước khi vào hàng chờ.");
            }

            var existing = await _matchQueueRepository.GetByUserAndSportAsync(userId, dto.SportId, cancellationToken);
            if (existing != null)
            {
                throw new AppException(ErrorCodes.ValidationError, "Bạn đã ở trong hàng chờ cho môn thể thao này rồi.");
            }

            var queueItem = new MatchQueue
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                SportId = dto.SportId,
                SkillLevel = userSkill.Level,
                City = dto.City,
                District = dto.District,
                PreferredTimeStart = dto.PreferredTimeStart,
                PreferredTimeEnd = dto.PreferredTimeEnd,
                JoinedAt = DateTime.UtcNow
            };

            await _matchQueueRepository.AddAsync(queueItem, cancellationToken);

            // Trigger auto-matching algorithm
            await TryMatchAsync(queueItem, cancellationToken);
        }

        public async Task LeaveQueueAsync(Guid userId, Guid sportId, CancellationToken cancellationToken = default)
        {
            var existing = await _matchQueueRepository.GetByUserAndSportAsync(userId, sportId, cancellationToken);
            if (existing != null)
            {
                await _matchQueueRepository.RemoveAsync(existing, cancellationToken);
            }
        }

        public async Task<MatchQueueResponseDto?> GetUserQueueStatusAsync(Guid userId, Guid sportId, CancellationToken cancellationToken = default)
        {
            var item = await _matchQueueRepository.GetByUserAndSportAsync(userId, sportId, cancellationToken);
            if (item == null) return null;

            return new MatchQueueResponseDto
            {
                Id = item.Id,
                UserId = item.UserId,
                SportId = item.SportId,
                SkillLevel = item.SkillLevel.ToString(),
                City = item.City,
                District = item.District,
                PreferredTimeStart = item.PreferredTimeStart,
                PreferredTimeEnd = item.PreferredTimeEnd,
                JoinedAt = item.JoinedAt
            };
        }

        private async Task TryMatchAsync(MatchQueue item, CancellationToken cancellationToken = default)
        {
            var matches = await _matchQueueRepository.FindMatchesAsync(item, cancellationToken);
            if (matches.Any())
            {
                // Simple logic: Match with the first one found
                var match = matches.First();

                // Create a Match Room
                var room = new MatchRoom
                {
                    Id = Guid.NewGuid(),
                    SportId = item.SportId,
                    Status = MatchRoomStatus.WAITING,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _matchRoomRepository.AddAsync(room, cancellationToken);

                // Add both players
                await _matchRoomRepository.AddPlayerAsync(new MatchRoomPlayer
                {
                    Id = Guid.NewGuid(),
                    RoomId = room.Id,
                    UserId = item.UserId,
                    IsHost = true,
                    JoinedAt = DateTime.UtcNow,
                    Status = MatchRoomPlayerStatus.ACCEPTED
                }, cancellationToken);

                await _matchRoomRepository.AddPlayerAsync(new MatchRoomPlayer
                {
                    Id = Guid.NewGuid(),
                    RoomId = room.Id,
                    UserId = match.UserId,
                    IsHost = false,
                    JoinedAt = DateTime.UtcNow,
                    Status = MatchRoomPlayerStatus.PENDING
                }, cancellationToken);

                // Remove both from queue
                await _matchQueueRepository.RemoveAsync(item, cancellationToken);
                await _matchQueueRepository.RemoveAsync(match, cancellationToken);

                // Notify both players via SignalR
                var connections1 = await _chatRepository.GetUserConnectionsAsync(item.UserId, cancellationToken);
                var connections2 = await _chatRepository.GetUserConnectionsAsync(match.UserId, cancellationToken);

                foreach (var conn in connections1.Concat(connections2))
                {
                    await _hubContext.Clients.Client(conn).SendAsync("MatchFound", new { roomId = room.Id }, cancellationToken);
                }
            }
        }
    }
}
