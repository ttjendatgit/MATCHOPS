"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, Bot, User, MessageSquare, Loader2, Plus, Trash2, ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { getStoredToken, isAuthenticated } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { AiChatMessage, AiChatRequest, AiChatResponse, AiHistoryItem } from "@/types/ai";
import { toast } from "sonner";

export default function AiChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AiHistoryItem[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/ai-chat");
    } else {
      fetchAiHistory();
    }
  }, [router]);

  // Fetch AI conversation history
  const fetchAiHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = getStoredToken();
      const response = await apiFetch<ApiResponse<AiHistoryItem[]>>("/ai/history", { token });
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AiChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const token = getStoredToken();
      const reqBody: AiChatRequest = {
        message: userInput,
        ...(currentConversationId ? { conversationId: currentConversationId } : {}),
      };
      const response = await apiFetch<ApiResponse<AiChatResponse>>("/ai/chat", {
        method: "POST",
        token,
        body: JSON.stringify(reqBody),
      });

      if (response.success && response.data) {
        const assistantMessage: AiChatMessage = {
          id: response.data.id,
          role: "assistant",
          content: response.data.response,
          timestamp: new Date(response.data.timestamp),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // If it's a new conversation, update the history list
        if (!currentConversationId) {
          setCurrentConversationId(response.data.conversationId);
          await fetchAiHistory();
        } else {
          // If existing, update last message locally
          setConversations(prev =>
            prev.map(c => c.id === response.data.conversationId
              ? { ...c, lastMessage: response.data.response, timestamp: new Date().toISOString() }
              : c
            )
          );
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle creating a new conversation
  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput("");
  };

  // Handle selecting a conversation from history
  const handleSelectConversation = async (id: string) => {
    setCurrentConversationId(id);
    // TODO: Load individual conversation messages if backend supports it
    toast.info("Đang tải cuộc trò chuyện...");
    setMessages([]);
  };

  // Handle deleting a conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = getStoredToken();
      // Backend has DELETE /api/ai/history
      await apiFetch("/ai/history", {
        method: "DELETE",
        token,
        body: JSON.stringify({ id }) // Or maybe just delete all? Wait API docs just say DELETE /api/ai/history
      });
      
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
      
      // Refresh history
      await fetchAiHistory();
      toast.success("Đã xóa cuộc trò chuyện");
    } catch (err) {
      console.error(err);
      toast.error("Không thể xóa cuộc trò chuyện");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#030303] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-full md:w-64" : "w-0"
        } bg-slate-950/50 border-r border-white/5 flex flex-col transition-all duration-300 overflow-hidden`}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#FF8000]/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-[#FF8000]" />
            </div>
            <h2 className="font-bold text-white">AI Trợ lý</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400"
            onClick={() => setIsSidebarOpen(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-3">
          <Button
            className="w-full bg-[#FF8000] hover:bg-[#FF8000]/85 text-white flex items-center gap-2"
            onClick={handleNewConversation}
          >
            <Plus className="h-4 w-4" />
            Tạo cuộc trò chuyện mới
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoadingHistory ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF8000]" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>Chưa có cuộc trò chuyện nào</p>
            </div>
          ) : (
            <>{conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg border border-transparent hover:bg-white/5 transition-colors group ${
                  currentConversationId === conv.id ? "bg-white/5" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">{conv.title}</p>
                    <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </button>
            ))}</>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#030303]">
        {/* Header */}
        <header className="p-4 border-b border-white/5 bg-slate-950/50 flex items-center gap-3">
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-400"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF8000] to-orange-600 flex items-center justify-center shadow-lg shadow-[#FF8000]/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">MatchOps Assistant</h2>
              <p className="text-xs text-[#86D232]">Đang hoạt động</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#FF8000]/10 to-orange-600/10 flex items-center justify-center">
                <Bot className="h-10 w-10 text-[#FF8000]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Chào bạn!</h3>
                <p className="text-slate-400 max-w-md">
                  Tôi là trợ lý AI của MatchOps, sẵn sàng giúp bạn tìm kiếm sân thể thao,
                  tìm người chơi cùng, hoặc trả lời các câu hỏi về dịch vụ của chúng tôi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-6">
                {[
                  "Làm thế nào để tìm sân cầu lông gần đây?",
                  "Tôi muốn tìm người chơi cùng trận badminton",
                  "Giải thích quy trình đặt sân?",
                  "Làm sao để hủy đặt sân?"
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(suggestion)}
                    className="p-3 text-left border border-white/5 rounded-xl bg-slate-900/50 hover:bg-slate-900 hover:border-[#FF8000]/20 transition-all"
                  >
                    <p className="text-sm text-slate-300">{suggestion}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>{messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex gap-3 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-[#FF8000] to-orange-600 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    msg.role === "assistant"
                      ? "bg-slate-900 border border-white/5 text-slate-100"
                      : "bg-[#FF8000] text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}</>
          )}

          {isLoading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF8000] to-orange-600 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-white/5">
                <Loader2 className="h-4 w-4 animate-spin text-[#FF8000]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-slate-950/50">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              className="bg-slate-900 border-white/5 text-white focus:border-[#FF8000] placeholder:text-slate-500"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-[#FF8000] hover:bg-[#FF8000]/90 text-white h-10 w-10 p-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-center text-xs text-slate-600 mt-2">
            AI có thể tạo ra thông tin không chính xác. Vui lòng kiểm tra thông tin quan trọng.
          </p>
        </div>
      </main>
    </div>
  );
}