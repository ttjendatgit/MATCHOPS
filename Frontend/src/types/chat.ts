export interface Participant {
  userId: string;
  fullName: string;
  avatar: string | null;
  isOnline?: boolean;
}

export interface Conversation {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  lastMessage?: string | { content?: string };
  lastMessageAt?: string;
  unreadCount: number;
  participants: Participant[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface SendMessageDto {
  conversationId?: string;
  targetUserId?: string;
  content: string;
}
