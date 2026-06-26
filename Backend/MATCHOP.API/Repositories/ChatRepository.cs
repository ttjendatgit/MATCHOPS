using MATCHOP.API.Entities;
using MATCHOP.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories
{
    public interface IChatRepository
    {
        Task<Conversation?> GetConversationAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<Conversation>> GetUserConversationsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<List<Message>> GetMessagesAsync(Guid conversationId, int skip, int take, CancellationToken cancellationToken = default);
        Task<Conversation> CreateConversationAsync(Conversation conversation, CancellationToken cancellationToken = default);
        Task AddMessageAsync(Message message, CancellationToken cancellationToken = default);
        Task AddParticipantAsync(ConversationParticipant participant, CancellationToken cancellationToken = default);
        Task<ConversationParticipant?> GetParticipantAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default);
        Task UpdateParticipantAsync(ConversationParticipant participant, CancellationToken cancellationToken = default);
        Task<List<string>> GetUserConnectionsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task AddConnectionAsync(UserConnection connection, CancellationToken cancellationToken = default);
        Task RemoveConnectionAsync(string connectionId, CancellationToken cancellationToken = default);
        Task<List<Notification>> GetUserNotificationsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task AddNotificationAsync(Notification notification, CancellationToken cancellationToken = default);
        Task UpdateNotificationAsync(Notification notification, CancellationToken cancellationToken = default);
        Task<Conversation> GetOrCreatePrivateConversationAsync(Guid userId1, Guid userId2, CancellationToken cancellationToken = default);
    }

    public class ChatRepository : IChatRepository
    {
        private readonly ApplicationDbContext _context;

        public ChatRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Conversation?> GetConversationAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.Conversations
                .Include(c => c.Participants).ThenInclude(p => p.User)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        }

        public async Task<List<Conversation>> GetUserConversationsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.Conversations
                .Include(c => c.Participants).ThenInclude(p => p.User)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .Where(c => c.Participants.Any(p => p.UserId == userId))
                .OrderByDescending(c => c.LastMessageAt)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<Message>> GetMessagesAsync(Guid conversationId, int skip, int take, CancellationToken cancellationToken = default)
        {
            return await _context.Messages
                .Where(m => m.ConversationId == conversationId)
                .OrderByDescending(m => m.CreatedAt)
                .Skip(skip)
                .Take(take)
                .Include(m => m.Sender)
                .ToListAsync(cancellationToken);
        }

        public async Task<Conversation> CreateConversationAsync(Conversation conversation, CancellationToken cancellationToken = default)
        {
            await _context.Conversations.AddAsync(conversation, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return conversation;
        }

        public async Task AddMessageAsync(Message message, CancellationToken cancellationToken = default)
        {
            await _context.Messages.AddAsync(message, cancellationToken);
            var conversation = await _context.Conversations.FindAsync(new object?[] { message.ConversationId }, cancellationToken);
            if (conversation != null)
            {
                conversation.LastMessageAt = message.CreatedAt;
            }
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task AddParticipantAsync(ConversationParticipant participant, CancellationToken cancellationToken = default)
        {
            await _context.ConversationParticipants.AddAsync(participant, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<ConversationParticipant?> GetParticipantAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.ConversationParticipants
                .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId, cancellationToken);
        }

        public async Task UpdateParticipantAsync(ConversationParticipant participant, CancellationToken cancellationToken = default)
        {
            _context.ConversationParticipants.Update(participant);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<List<string>> GetUserConnectionsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.UserConnections
                .Where(c => c.UserId == userId)
                .Select(c => c.ConnectionId)
                .ToListAsync(cancellationToken);
        }

        public async Task AddConnectionAsync(UserConnection connection, CancellationToken cancellationToken = default)
        {
            await _context.UserConnections.AddAsync(connection, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task RemoveConnectionAsync(string connectionId, CancellationToken cancellationToken = default)
        {
            var connection = await _context.UserConnections.FirstOrDefaultAsync(c => c.ConnectionId == connectionId, cancellationToken);
            if (connection != null)
            {
                _context.UserConnections.Remove(connection);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        public async Task<List<Notification>> GetUserNotificationsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task AddNotificationAsync(Notification notification, CancellationToken cancellationToken = default)
        {
            await _context.Notifications.AddAsync(notification, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task UpdateNotificationAsync(Notification notification, CancellationToken cancellationToken = default)
        {
            _context.Notifications.Update(notification);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<Conversation> GetOrCreatePrivateConversationAsync(Guid userId1, Guid userId2, CancellationToken cancellationToken = default)
        {
            // Try to find existing private conversation between these two users
            var existingConversation = await _context.Conversations
                .Include(c => c.Participants)
                .FirstOrDefaultAsync(c => c.Type == ConversationType.PRIVATE && 
                    c.Participants.Count() == 2 && 
                    c.Participants.All(p => p.UserId == userId1 || p.UserId == userId2), cancellationToken);

            if (existingConversation != null)
            {
                return existingConversation;
            }

            // Create new conversation if not found
            var conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                Type = ConversationType.PRIVATE,
                CreatedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow
            };

            await _context.Conversations.AddAsync(conversation, cancellationToken);

            // Add both participants
            var participant1 = new ConversationParticipant
            {
                ConversationId = conversation.Id,
                UserId = userId1,
                JoinedAt = DateTime.UtcNow,
                LastReadAt = DateTime.UtcNow
            };
            var participant2 = new ConversationParticipant
            {
                ConversationId = conversation.Id,
                UserId = userId2,
                JoinedAt = DateTime.UtcNow,
                LastReadAt = DateTime.UtcNow
            };

            await _context.ConversationParticipants.AddAsync(participant1, cancellationToken);
            await _context.ConversationParticipants.AddAsync(participant2, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return conversation;
        }
    }
}
