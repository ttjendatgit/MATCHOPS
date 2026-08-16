"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { 
  Send, Search, MoreVertical, 
  User, Loader2, MessageSquare,
  ChevronLeft, Phone, Video,
  Paperclip, Smile
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getStoredToken, getStoredUser } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useSignalR } from "@/providers/SignalRProvider";
import { useSearchParams } from "next/navigation";

interface Conversation {
  id: string;
  title: string | null;
  type: string;
  lastMessageAt: string;
  lastMessage?: string | { content?: string };
  unreadCount: number;
  participants: Participant[];
}

interface Participant {
  userId: string;
  fullName: string;
  avatar: string | null;
  isOnline?: boolean;
  isTyping?: boolean;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const convIdFromUrl = searchParams.get("convId");
  
  const { connection, isConnected } = useSignalR();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = getStoredUser();
  const startedPrivateChatRef = useRef<Set<string>>(new Set()); // Track userIds we already started chat with

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversations.length === 0) return;

    const userId = searchParams.get("userId");
    const convId = searchParams.get("convId");

    if (convId) {
      const found = conversations.find(c => c.id === convId);
      if (found) setSelectedConv(found);
    } else if (userId) {
      // Check if conversation with this user already exists
      const existing = conversations.find(c => 
        c.type === "PRIVATE" && c.participants.some(p => p.userId === userId)
      );
      if (existing) {
        setSelectedConv(existing);
      } else if (!startedPrivateChatRef.current.has(userId)) {
        // Start new private conversation only if we haven't tried before
        startedPrivateChatRef.current.add(userId);
        startPrivateChat(userId);
      }
    }
  }, [conversations, searchParams]);

  const startPrivateChat = async (targetUserId: string) => {
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<Conversation>>(`/chat/conversations/private/${targetUserId}`, {
        method: "POST",
        token
      });
      if (res.success && res.data) {
        // Remove duplicates and add new one to front
        setConversations(prev => {
          const filtered = prev.filter(c => c.id !== res.data!.id);
          return [res.data!, ...filtered];
        });
        setSelectedConv(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể bắt đầu trò chuyện");
    }
  };

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      // Mark as read via SignalR
      if (isConnected && connection) {
        connection.invoke("MarkAsRead", selectedConv.id).catch(console.error);
      }
    }
  }, [selectedConv, isConnected, connection]);

  useEffect(() => {
    if (!connection) return;

    connection.on("ReceiveMessage", (message: Message) => {
      if (selectedConv?.id === message.conversationId) {
        setMessages(prev => {
          // Prevent duplicate messages
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      } else {
        // Update unread count in conversations list
        setConversations(prev => prev.map(c => 
          c.id === message.conversationId 
            ? { ...c, unreadCount: c.unreadCount + 1, lastMessage: { content: message.content }, lastMessageAt: message.createdAt }
            : c
        ));
      }
    });

    connection.on("UserTyping", (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (selectedConv?.id === data.conversationId) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: data.isTyping }));
      }
    });

    connection.on("UserOnline", (userId: string) => {
      setConversations(prev => prev.map(c => ({
        ...c,
        participants: c.participants.map(p => p.userId === userId ? { ...p, isOnline: true } : p)
      })));
    });

    connection.on("UserOffline", (userId: string) => {
      setConversations(prev => prev.map(c => ({
        ...c,
        participants: c.participants.map(p => p.userId === userId ? { ...p, isOnline: false } : p)
      })));
    });

    return () => {
      connection.off("ReceiveMessage");
      connection.off("UserTyping");
      connection.off("UserOnline");
      connection.off("UserOffline");
    };
  }, [connection, selectedConv]);

  const scrollToBottom = () => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (messages.length === 0) return;
    scrollToBottom();
  }, [messages, typingUsers]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!connection || !selectedConv) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    connection.invoke("SendTyping", selectedConv.id, true).catch(console.error);
    
    typingTimeoutRef.current = setTimeout(() => {
      connection.invoke("SendTyping", selectedConv.id, false).catch(console.error);
    }, 3000);
  };

  const fetchConversations = async () => {
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<Conversation[]>>("/chat/conversations", { token });
      if (res.success && res.data) {
        // Remove duplicates
        const unique = Array.from(new Map(res.data.map(c => [c.id, c])).values());
        setConversations(unique);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách hội thoại");
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    setLoadingMsg(true);
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<Message[]>>(`/chat/conversations/${convId}/messages`, { token });
      if (res.success && res.data) {
        // Remove duplicates
        const unique = Array.from(new Map(res.data.map(m => [m.id, m])).values());
        setMessages(unique.reverse()); // Show oldest first
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải tin nhắn");
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || !currentUser) return;

    const token = getStoredToken();
    const content = newMessage;
    setNewMessage("");

    // Stop typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    connection?.invoke("SendTyping", selectedConv.id, false).catch(console.error);

    try {
      await apiFetch("/chat/send", {
        method: "POST",
        token,
        body: JSON.stringify({
          conversationId: selectedConv.id,
          content: content
        })
      });
    } catch (err) {
      console.error(err);
      toast.error("Không thể gửi tin nhắn");
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    if (!currentUser) return null;
    return conv.participants.find(p => p.userId !== currentUser.id);
  };

  const isOtherTyping = selectedConv?.participants.some(p => p.userId !== currentUser?.id && typingUsers[p.userId]);

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-[#030303]">
      {/* Sidebar */}
      <div className={cn(
        "flex w-full flex-col border-r border-white/5 bg-slate-950/50 md:w-80 lg:w-96",
        selectedConv && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-white/5">
          <h1 className="text-xl font-bold text-white mb-4">Tin nhắn</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Tìm kiếm hội thoại..." 
              className="pl-10 bg-slate-900 border-white/5 text-white focus:border-[#FF8000]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConv ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF8000]" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">Chưa có hội thoại nào</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={cn(
                    "flex w-full items-center gap-3 p-4 transition-colors hover:bg-white/5",
                    selectedConv?.id === conv.id && "bg-white/5"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 border border-white/10">
                      <AvatarImage src={other?.avatar || ""} />
                      <AvatarFallback className="bg-[#FF8000]/10 text-[#FF8000]">
                        {other?.fullName.slice(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    {other?.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#030303] bg-[#86D232]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-white truncate">{conv.title || other?.fullName}</p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {typeof conv.lastMessage === "string"
                        ? conv.lastMessage
                        : conv.lastMessage?.content || "Chưa có tin nhắn"}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="h-2 w-2 rounded-full bg-[#FF8000]" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex flex-1 flex-col",
        !selectedConv && "hidden md:flex items-center justify-center"
      )}>
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden text-slate-400"
                  onClick={() => setSelectedConv(null)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Avatar className="h-10 w-10 border border-white/10">
                  <AvatarImage src={getOtherParticipant(selectedConv)?.avatar || ""} />
                  <AvatarFallback className="bg-[#FF8000]/10 text-[#FF8000]">
                    {getOtherParticipant(selectedConv)?.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-white text-sm">
                    {selectedConv.title || getOtherParticipant(selectedConv)?.fullName}
                  </p>
                  <p className="text-[10px] text-[#86D232]">Đang hoạt động</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMsg ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#FF8000]" />
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.senderId === currentUser?.id;
                  return (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex flex-col max-w-[80%]",
                        isMine ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className={cn(
                        "rounded-2xl px-4 py-2 text-sm",
                        isMine 
                          ? "bg-[#FF8000] text-white rounded-tr-none" 
                          : "bg-slate-900 text-slate-200 rounded-tl-none border border-white/5"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-600 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              {isOtherTyping && (
                <div className="mr-auto flex items-center gap-2 text-xs text-slate-500 italic">
                  <div className="flex gap-1">
                    <span className="h-1 w-1 rounded-full bg-slate-500 animate-bounce" />
                    <span className="h-1 w-1 rounded-full bg-slate-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1 w-1 rounded-full bg-slate-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  Đang soạn tin...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-950/50 border-t border-white/5">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="text-slate-500 hover:text-white">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <div className="relative flex-1">
                  <Input 
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Nhập tin nhắn..." 
                    className="bg-slate-900 border-white/5 text-white pr-10 focus:border-[#FF8000]"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white h-8 w-8">
                    <Smile className="h-5 w-5" />
                  </Button>
                </div>
                <Button type="submit" size="icon" className="bg-[#FF8000] hover:bg-[#FF8000]/90 text-white shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12">
            <div className="h-20 w-20 rounded-full bg-[#FF8000]/10 border border-[#FF8000]/20 flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 text-[#FF8000]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Trò chuyện với mọi người</h2>
            <p className="text-slate-400 max-w-sm">
              Chọn một hội thoại bên trái hoặc bắt đầu tìm trận để trò chuyện với những người chơi khác.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-[#FF8000]" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
