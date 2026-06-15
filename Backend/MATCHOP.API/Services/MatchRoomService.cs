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
    public class MatchRoomService : IMatchRoomService
    {
        private readonly IMatchRoomRepository _matchRoomRepository;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IChatRepository _chatRepository;

        public MatchRoomService(
            IMatchRoomRepository matchRoomRepository,
            IHubContext<ChatHub> hubContext,
            IChatRepository chatRepository)
        {
            _matchRoomRepository = matchRoomRepository;
            _hubContext = hubContext;
            _chatRepository = chatRepository;
        }

        public async Task<MatchRoomResponseDto> GetRoomByIdAsync(Guid roomId, Guid requestingUserId)
        {
            var room = await _matchRoomRepository.GetByIdAsync(roomId);
            if (room == null)
                throw new AppException(ErrorCodes.ValidationError, "Không tìm thấy phòng.", StatusCodes.Status404NotFound);

            if (!room.Players.Any(p => p.UserId == requestingUserId))
                throw new AppException(ErrorCodes.ValidationError, "Bạn không có quyền xem phòng này.", StatusCodes.Status403Forbidden);

            return await MapToResponseAsync(room);
        }

        public async Task<List<MatchRoomResponseDto>> GetUserRoomsAsync(Guid userId)
        {
            var rooms = await _matchRoomRepository.GetUserRoomsAsync(userId);
            var results = new List<MatchRoomResponseDto>();
            foreach (var room in rooms)
            {
                results.Add(await MapToResponseAsync(room));
            }
            return results;
        }

        public async Task AcceptMatchAsync(Guid userId, Guid roomId)
        {
            var player = await _matchRoomRepository.GetPlayerAsync(roomId, userId);
            if (player == null) throw new AppException(ErrorCodes.ValidationError, "Bạn không có trong phòng này.");
            
            player.Status = MatchRoomPlayerStatus.ACCEPTED;
            await _matchRoomRepository.UpdatePlayerAsync(player);

            // If all players accepted, confirm the room
            var room = await _matchRoomRepository.GetByIdAsync(roomId);
            if (room != null && room.Players.All(p => p.Status == MatchRoomPlayerStatus.ACCEPTED))
            {
                room.Status = MatchRoomStatus.CONFIRMED;
                await _matchRoomRepository.UpdateAsync(room);

                // Create a conversation for the players
                var participantIds = room.Players.Select(p => p.UserId).ToList();
                var conversation = await _chatRepository.GetOrCreatePrivateConversationAsync(participantIds[0], participantIds[1]);

                // Notify all players
                foreach (var playerId in participantIds)
                {
                    var connections = await _chatRepository.GetUserConnectionsAsync(playerId);
                    foreach (var conn in connections)
                    {
                        await _hubContext.Clients.Client(conn).SendAsync("MatchConfirmed", new 
                        { 
                            roomId = room.Id, 
                            conversationId = conversation.Id 
                        });
                    }
                }
            }
        }

        public async Task RejectMatchAsync(Guid userId, Guid roomId)
        {
            var player = await _matchRoomRepository.GetPlayerAsync(roomId, userId);
            if (player == null) throw new AppException(ErrorCodes.ValidationError, "Bạn không có trong phòng này.");

            player.Status = MatchRoomPlayerStatus.REJECTED;
            await _matchRoomRepository.UpdatePlayerAsync(player);

            var room = await _matchRoomRepository.GetByIdAsync(roomId);
            if (room != null)
            {
                room.Status = MatchRoomStatus.CANCELLED;
                await _matchRoomRepository.UpdateAsync(room);
            }
        }

        private async Task<MatchRoomResponseDto> MapToResponseAsync(MatchRoom room)
        {
            Guid? conversationId = null;
            if (room.Status == MatchRoomStatus.CONFIRMED && room.Players.Count >= 2)
            {
                var playerIds = room.Players.Select(p => p.UserId).ToList();
                var conversation = await _chatRepository.GetOrCreatePrivateConversationAsync(playerIds[0], playerIds[1]);
                conversationId = conversation.Id;
            }

            var post = room.MatchPost;
            var hostPlayer = room.Players.FirstOrDefault(p => p.IsHost);

            return new MatchRoomResponseDto
            {
                Id = room.Id,
                SportId = room.SportId,
                SportName = room.Sport?.Name ?? post?.Sport?.Name ?? string.Empty,
                MatchPostId = room.MatchPostId,
                ConversationId = conversationId,
                Status = room.Status.ToString(),
                CreatedAt = room.CreatedAt,
                // Post-linked fields (empty/zero for queue-based rooms)
                PostCity = post?.City ?? string.Empty,
                PostDistrict = post?.District ?? string.Empty,
                PostPreferredTime = post?.PreferredTime,
                PostMinSkillLevel = post?.MinSkillLevel.ToString() ?? string.Empty,
                PostMaxSkillLevel = post?.MaxSkillLevel.ToString() ?? string.Empty,
                SlotsNeeded = post?.SlotsNeeded ?? 0,
                SlotsFilled = post?.SlotsFilled ?? 0,
                PostStatus = post?.Status.ToString() ?? string.Empty,
                OwnerUserId = hostPlayer?.UserId ?? post?.CreatorId,
                OwnerName = hostPlayer?.User?.FullName ?? post?.Creator?.FullName ?? string.Empty,
                Players = room.Players.Select(p => new MatchRoomPlayerDto
                {
                    UserId = p.UserId,
                    FullName = p.User?.FullName ?? string.Empty,
                    Avatar = p.User?.AvatarUrl,
                    IsHost = p.IsHost,
                    Status = p.Status.ToString(),
                    JoinedAt = p.JoinedAt
                }).ToList()
            };
        }
    }
}
