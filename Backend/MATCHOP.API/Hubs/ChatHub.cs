using MATCHOP.API.DTOs.Chat;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace MATCHOP.API.Hubs
{
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatRepository _chatRepository;

        public ChatHub(IChatRepository chatRepository)
        {
            _chatRepository = chatRepository;
        }

        public override async Task OnConnectedAsync()
        {
            var userIdStr = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdStr, out var userId))
            {
                await _chatRepository.AddConnectionAsync(new UserConnection
                {
                    UserId = userId,
                    ConnectionId = Context.ConnectionId
                });

                // Join groups for all user's conversations
                var conversations = await _chatRepository.GetUserConversationsAsync(userId);
                foreach (var conv in conversations)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, conv.Id.ToString());
                }
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await _chatRepository.RemoveConnectionAsync(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(SendMessageDto dto)
        {
            var userIdStr = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId)) return;

            var participant = await _chatRepository.GetParticipantAsync(dto.ConversationId, userId);
            if (participant == null) return;

            var message = new Message
            {
                Id = Guid.NewGuid(),
                ConversationId = dto.ConversationId,
                SenderId = userId,
                Content = dto.Content,
                CreatedAt = DateTime.UtcNow
            };

            await _chatRepository.AddMessageAsync(message);

            var messageDto = new MessageDto
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderId = userId,
                Content = message.Content,
                CreatedAt = message.CreatedAt,
                IsRead = false
            };

            await Clients.Group(dto.ConversationId.ToString()).SendAsync("ReceiveMessage", messageDto);
        }

        public async Task MarkAsRead(Guid conversationId)
        {
            var userIdStr = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId)) return;

            var participant = await _chatRepository.GetParticipantAsync(conversationId, userId);
            if (participant != null)
            {
                participant.LastReadAt = DateTime.UtcNow;
                await _chatRepository.UpdateParticipantAsync(participant);
            }
        }
    }
}
