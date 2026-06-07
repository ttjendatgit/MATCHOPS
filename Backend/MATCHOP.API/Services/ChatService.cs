using MATCHOP.API.DTOs.Chat;
using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using MATCHOP.API.Hubs;
using MATCHOP.API.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace MATCHOP.API.Services
{
    public interface IChatService
    {
        Task<List<ConversationDto>> GetUserConversationsAsync(Guid userId);
        Task<List<MessageDto>> GetConversationMessagesAsync(Guid conversationId, int skip, int take);
        Task<ConversationDto> CreatePrivateConversationAsync(Guid user1Id, Guid user2Id);
        Task<NotificationDto> SendNotificationAsync(Guid userId, string title, string content, NotificationType type, string? metadata = null);
    }

    public class ChatService : IChatService
    {
        private readonly IChatRepository _chatRepository;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatService(IChatRepository chatRepository, IHubContext<ChatHub> hubContext)
        {
            _chatRepository = chatRepository;
            _hubContext = hubContext;
        }

        public async Task<List<ConversationDto>> GetUserConversationsAsync(Guid userId)
        {
            var conversations = await _chatRepository.GetUserConversationsAsync(userId);
            return conversations.Select(c => new ConversationDto
            {
                Id = c.Id,
                Title = c.Title,
                Type = c.Type,
                LastMessageAt = c.LastMessageAt,
                LastMessage = c.Messages.Select(m => new MessageDto
                {
                    Id = m.Id,
                    Content = m.Content,
                    CreatedAt = m.CreatedAt,
                    SenderId = m.SenderId
                }).FirstOrDefault(),
                Participants = c.Participants.Select(p => new ParticipantDto
                {
                    UserId = p.UserId,
                    FullName = p.User.FullName,
                    Avatar = p.User.AvatarUrl
                }).ToList()
            }).ToList();
        }

        public async Task<List<MessageDto>> GetConversationMessagesAsync(Guid conversationId, int skip, int take)
        {
            var messages = await _chatRepository.GetMessagesAsync(conversationId, skip, take);
            return messages.Select(m => new MessageDto
            {
                Id = m.Id,
                ConversationId = m.ConversationId,
                SenderId = m.SenderId,
                SenderName = m.Sender.FullName,
                Content = m.Content,
                CreatedAt = m.CreatedAt,
                IsRead = m.IsRead
            }).ToList();
        }

        public async Task<ConversationDto> CreatePrivateConversationAsync(Guid user1Id, Guid user2Id)
        {
            // Check if exists
            var user1Convs = await _chatRepository.GetUserConversationsAsync(user1Id);
            var existing = user1Convs.FirstOrDefault(c => 
                c.Type == ConversationType.PRIVATE && 
                c.Participants.Any(p => p.UserId == user2Id));

            if (existing != null) return (await GetUserConversationsAsync(user1Id)).First(c => c.Id == existing.Id);

            var conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                Type = ConversationType.PRIVATE
            };

            await _chatRepository.CreateConversationAsync(conversation);

            await _chatRepository.AddParticipantAsync(new ConversationParticipant { ConversationId = conversation.Id, UserId = user1Id });
            await _chatRepository.AddParticipantAsync(new ConversationParticipant { ConversationId = conversation.Id, UserId = user2Id });

            // Notify user2 via SignalR about new conversation if online
            var connections = await _chatRepository.GetUserConnectionsAsync(user2Id);
            foreach (var conn in connections)
            {
                // In real app, we might need a dedicated NotificationHub or use ChatHub
                await _hubContext.Clients.Client(conn).SendAsync("NewConversation", conversation.Id);
            }

            return (await GetUserConversationsAsync(user1Id)).First(c => c.Id == conversation.Id);
        }

        public async Task<NotificationDto> SendNotificationAsync(Guid userId, string title, string content, NotificationType type, string? metadata = null)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Content = content,
                Type = type,
                Metadata = metadata,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _chatRepository.AddNotificationAsync(notification);

            var dto = new NotificationDto
            {
                Id = notification.Id,
                Title = notification.Title,
                Content = notification.Content,
                Type = notification.Type,
                Metadata = notification.Metadata,
                IsRead = false,
                CreatedAt = notification.CreatedAt
            };

            // Real-time via SignalR
            var connections = await _chatRepository.GetUserConnectionsAsync(userId);
            foreach (var conn in connections)
            {
                await _hubContext.Clients.Client(conn).SendAsync("ReceiveNotification", dto);
            }

            return dto;
        }
    }
}
