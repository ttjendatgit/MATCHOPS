"use client";

import { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, X, Send, 
  ChevronLeft, Loader2, MessageSquare,
  Minus, Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getStoredToken, getStoredUser, isAuthenticated } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { useSignalR } from "@/providers/SignalRProvider";
import { toast } from "sonner";
import Link from "next/link";

// Define local types matching the actual API response
interface Participant {
  userId: string;
  fullName: string;
  avatar: string | null;
  isOnline?: boolean;
}

interface Conversation {
  id: string;
  type: string;
  lastMessage?: string | { content?: string };
  lastMessageAt?: string;
  unreadCount: number;
  participants: Participant[];
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { connection, isConnected } = useSignalR();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = getStoredUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchConversations();
    }
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated()) {
      fetchConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      if (isConnected && connection) {
        connection.invoke("MarkAsRead", selectedConv.id).catch(console.error);
        
        // Update unread count locally
        setUnreadTotal(prev => Math.max(0, prev - selectedConv.unreadCount));
        setConversations(prev => prev.map(c => 
          c.id === selectedConv.id ? { ...c, unreadCount: 0 } : c
        ));
      }
    }
  }, [selectedConv, isConnected, connection]);

  useEffect(() => {
    if (!connection) return;

    const handleReceiveMessage = (message: ChatMessage) => {
      const isForSelected = selectedConv?.id === message.conversationId;
      
      if (isForSelected) {
        setMessages(prev => [...prev, message]);
        // Also mark as read if open
        if (isConnected && connection) {
          connection.invoke("MarkAsRead", message.conversationId).catch(console.error);
        }
      } else {
        setConversations(prev => prev.map(c => 
          c.id === message.conversationId 
            ? { ...c, unreadCount: c.unreadCount + 1, lastMessage: message.content, lastMessageAt: message.createdAt }
            : c
        ));
        setUnreadTotal(prev => prev + 1);
      }
    };

    connection.on("ReceiveMessage", handleReceiveMessage);

    return () => {
      connection.off("ReceiveMessage", handleReceiveMessage);
    };
  }, [connection, selectedConv, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<Conversation[]>>("/chat/conversations", { token });
      if (res.success && res.data) {
        setConversations(res.data);
        const total = res.data.reduce((acc, curr) => acc + curr.unreadCount, 0);
        setUnreadTotal(total);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convId: string) => {
    setLoading(true);
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<ChatMessage[]>>(`/chat/conversations/${convId}/messages`, { token });
      if (res.success && res.data) {
        setMessages(res.data.reverse());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    const token = getStoredToken();
    const content = newMessage;
    setNewMessage("");

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
      toast.error("Không thể gửi tin nhắn");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper to get the other participant (not current user)
  const getOtherParticipant = (conv: Conversation) => {
    if (!currentUser) return null;
    return conv.participants.find(p => p.userId !== currentUser.id);
  };

  if (!mounted || !isAuthenticated()) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      {/* Chat Window */}
      {isOpen && (
        <div className="flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 bg-[#FF8000]/10 p-4">
            <div className="flex items-center gap-3">
              {selectedConv ? (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-white"
                    onClick={() => setSelectedConv(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarImage src={getOtherParticipant(selectedConv)?.avatar || ""} />
                    <AvatarFallback className="bg-[#FF8000]/10 text-[10px] text-[#FF8000]">
                      {getOtherParticipant(selectedConv)?.fullName.slice(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{getOtherParticipant(selectedConv)?.fullName || "Người dùng"}</p>
                    <p className="text-[10px] text-[#86D232]">Đang hoạt động</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#FF8000]/20 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-[#FF8000]" />
                  </div>
                  <span className="font-bold text-white text-sm">Tin nhắn</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-white"
                asChild
              >
                <Link href="/chat">
                  <Maximize2 className="h-4 w-4" />
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedConv ? (
              /* Message List */
              <div className="flex flex-col gap-4 p-4">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#FF8000]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                    <p className="text-xs">Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === currentUser?.id;
                    return (
                      <div 
                        key={msg.id} 
                        className={cn(
                          "flex flex-col max-w-[85%]",
                          isMine ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                      >
                        <div className={cn(
                          "rounded-2xl px-3 py-2 text-xs",
                          isMine 
                            ? "bg-[#FF8000] text-white rounded-tr-none" 
                            : "bg-slate-900 text-slate-200 rounded-tl-none border border-white/5"
                        )}>
                          {msg.content}
                        </div>
                        <span className="text-[8px] text-slate-600 mt-1 uppercase tracking-tighter">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              /* Conversation List */
              <div className="flex flex-col">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-10" />
                    <p className="text-sm">Chưa có hội thoại nào</p>
                    <Button 
                      variant="link" 
                      className="text-[#FF8000] text-xs mt-2"
                      asChild
                    >
                      <Link href="/match">Tìm người chơi cùng</Link>
                    </Button>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const other = getOtherParticipant(conv);
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConv(conv)}
                        className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-white/5 text-left border-b border-white/5"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10 border border-white/10">
                            <AvatarImage src={other?.avatar || ""} />
                            <AvatarFallback className="bg-[#FF8000]/10 text-[#FF8000] text-xs">
                              {other?.fullName.slice(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                          {other?.isOnline && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-[#86D232]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <p className="font-bold text-white text-xs truncate">{other?.fullName || "Người dùng"}</p>
                            <span className="text-[9px] text-slate-500">
                              {new Date(conv.lastMessageAt || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate italic">
                            {typeof conv.lastMessage === 'string' 
                              ? conv.lastMessage 
                              : conv.lastMessage?.content || "Gửi lời chào..."}
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
            )}
          </div>

          {/* Input for selected conversation */}
          {selectedConv && (
            <div className="p-3 bg-slate-950 border-t border-white/5">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..." 
                  className="h-9 bg-slate-900 border-white/5 text-xs text-white focus:border-[#FF8000]"
                />
                <Button type="submit" size="icon" className="h-9 w-9 bg-[#FF8000] hover:bg-[#FF8000]/90 text-white shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110",
          isOpen ? "bg-slate-900 text-white" : "bg-[#FF8000] text-white"
        )}
      >
        {isOpen ? (
          <Minus className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {unreadTotal > 0 && (
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-4 ring-slate-950">
                {unreadTotal > 9 ? "9+" : unreadTotal}
              </span>
            )}
          </>
        )}
        
        {/* Glow Effect */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-[#FF8000] opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
        )}
      </button>
    </div>
  );
}