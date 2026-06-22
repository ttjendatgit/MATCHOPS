export interface AiChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AiChatRequest {
  message: string;
  conversationId?: string;
}

export interface AiChatResponse {
  id: string;
  response: string;
  conversationId: string;
  timestamp: Date;
}

export interface AiConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: AiChatMessage[];
}

export interface AiHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}
