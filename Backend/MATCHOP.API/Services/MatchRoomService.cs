using MATCHOP.API.DTOs.Matching;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Helpers;
using MATCHOP.API.Repositories;

namespace MATCHOP.API.Services
{
    public class MatchRoomService : IMatchRoomService
    {
        private readonly IMatchRoomRepository _matchRoomRepository;

        public MatchRoomService(IMatchRoomRepository matchRoomRepository)
        {
            _matchRoomRepository = matchRoomRepository;
        }

        public async Task<MatchRoomResponseDto> GetRoomByIdAsync(Guid roomId)
        {
            var room = await _matchRoomRepository.GetByIdAsync(roomId);
            if (room == null) throw new AppException(ErrorCodes.ValidationError, "Không tìm thấy phòng.");
            return MapToResponse(room);
        }

        public async Task<List<MatchRoomResponseDto>> GetUserRoomsAsync(Guid userId)
        {
            var rooms = await _matchRoomRepository.GetUserRoomsAsync(userId);
            return rooms.Select(MapToResponse).ToList();
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

        private static MatchRoomResponseDto MapToResponse(MatchRoom room)
        {
            return new MatchRoomResponseDto
            {
                Id = room.Id,
                SportId = room.SportId,
                SportName = room.Sport?.Name ?? "Unknown",
                MatchPostId = room.MatchPostId,
                Status = room.Status.ToString(),
                CreatedAt = room.CreatedAt,
                Players = room.Players.Select(p => new MatchRoomPlayerDto
                {
                    UserId = p.UserId,
                    FullName = p.User?.FullName ?? "Unknown",
                    Avatar = p.User?.AvatarUrl,
                    IsHost = p.IsHost,
                    Status = p.Status.ToString(),
                    JoinedAt = p.JoinedAt
                }).ToList()
            };
        }
    }
}
