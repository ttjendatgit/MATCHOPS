using MATCHOP.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MATCHOP.API.Repositories
{
    public interface IChatRepository
    {
        Task<Conversation?> GetConversationAsync(Guid id);
        Task<List<Conversation>> GetUserConversationsAsync(Guid userId);
        Task<List<Message>> GetMessagesAsync(Guid conversationId, int skip, int take);
        Task<Conversation> CreateConversationAsync(Conversation conversation);
        Task AddMessageAsync(Message message);
        Task AddParticipantAsync(ConversationParticipant participant);
        Task<ConversationParticipant?> GetParticipantAsync(Guid conversationId, Guid userId);
        Task UpdateParticipantAsync(ConversationParticipant participant);
        Task<List<string>> GetUserConnectionsAsync(Guid userId);
        Task AddConnectionAsync(UserConnection connection);
        Task RemoveConnectionAsync(string connectionId);
        Task<List<Notification>> GetUserNotificationsAsync(Guid userId);
        Task AddNotificationAsync(Notification notification);
        Task UpdateNotificationAsync(Notification notification);
    }

    public class ChatRepository : IChatRepository
    {
        private readonly ApplicationDbContext _context;

        public ChatRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Conversation?> GetConversationAsync(Guid id)
        {
            return await _context.Conversations
                .Include(c => c.Participants).ThenInclude(p => p.User)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<List<Conversation>> GetUserConversationsAsync(Guid userId)
        {
            return await _context.Conversations
                .Include(c => c.Participants).ThenInclude(p => p.User)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .Where(c => c.Participants.Any(p => p.UserId == userId))
                .OrderByDescending(c => c.LastMessageAt)
                .ToListAsync();
        }

        public async Task<List<Message>> GetMessagesAsync(Guid conversationId, int skip, int take)
        {
            return await _context.Messages
                .Where(m => m.ConversationId == conversationId)
                .OrderByDescending(m => m.CreatedAt)
                .Skip(skip)
                .Take(take)
                .Include(m => m.Sender)
                .ToListAsync();
        }

        public async Task<Conversation> CreateConversationAsync(Conversation conversation)
        {
            await _context.Conversations.AddAsync(conversation);
            await _context.SaveChangesAsync();
            return conversation;
        }

        public async Task AddMessageAsync(Message message)
        {
            await _context.Messages.AddAsync(message);
            var conversation = await _context.Conversations.FindAsync(message.ConversationId);
            if (conversation != null)
            {
                conversation.LastMessageAt = message.CreatedAt;
            }
            await _context.SaveChangesAsync();
        }

        public async Task AddParticipantAsync(ConversationParticipant participant)
        {
            await _context.ConversationParticipants.AddAsync(participant);
            await _context.SaveChangesAsync();
        }

        public async Task<ConversationParticipant?> GetParticipantAsync(Guid conversationId, Guid userId)
        {
            return await _context.ConversationParticipants
                .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId);
        }

        public async Task UpdateParticipantAsync(ConversationParticipant participant)
        {
            _context.ConversationParticipants.Update(participant);
            await _context.SaveChangesAsync();
        }

        public async Task<List<string>> GetUserConnectionsAsync(Guid userId)
        {
            return await _context.UserConnections
                .Where(c => c.UserId == userId)
                .Select(c => c.ConnectionId)
                .ToListAsync();
        }

        public async Task AddConnectionAsync(UserConnection connection)
        {
            await _context.UserConnections.AddAsync(connection);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveConnectionAsync(string connectionId)
        {
            var connection = await _context.UserConnections.FirstOrDefaultAsync(c => c.ConnectionId == connectionId);
            if (connection != null)
            {
                _context.UserConnections.Remove(connection);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Notification>> GetUserNotificationsAsync(Guid userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task AddNotificationAsync(Notification notification)
        {
            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateNotificationAsync(Notification notification)
        {
            _context.Notifications.Update(notification);
            await _context.SaveChangesAsync();
        }
    }
}
