"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Bot,
  User,
  MessageSquare,
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  Menu,
  Pencil,
  Check,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAuthenticated, getStoredUser } from "@/lib/auth";
import { useAiChat } from "@/hooks/useAiChat";

const USER_PROMPTS = [
  "Tìm sân gần tôi",
  "Tìm sân cầu lông tối nay",
  "Sân pickleball dưới 150k",
  "Xem booking của tôi",
  "Tìm sân đang còn trống",
];

const OWNER_PROMPTS = [
  "Phân tích doanh thu tháng này",
  "Phân tích booking",
  "Khung giờ nào đông nhất?",
  "Sân nào hoạt động kém?",
  "Tìm sân cầu lông quận 1",
];

const ADMIN_PROMPTS = [
  "Phân tích doanh thu nền tảng",
  "Tăng trưởng người dùng",
  "Thống kê booking tháng này",
  "Venue nào hoạt động tốt nhất?",
];

function getQuickPrompts(role?: string): string[] {
  if (role === "OWNER") return OWNER_PROMPTS;
  if (role === "ADMIN") return ADMIN_PROMPTS;
  return USER_PROMPTS;
}

export default function AiChatPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const userRole = getStoredUser()?.role;
  const quickPrompts = getQuickPrompts(userRole);

  const {
    messages,
    conversations,
    currentConversationId,
    isLoading,
    isLoadingHistory,
    isSelectingConversation,
    error,
    messagesEndRef,
    fetchConversations,
    sendMessage,
    selectConversation,
    newConversation,
    deleteConversation,
    renameConversation,
    setError,
  } = useAiChat();

  // Redirect if not authenticated + clear stale error from previous session
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/ai-chat");
    } else {
      fetchConversations();
      setError(null);
    }
  }, [router, fetchConversations, setError]);

  const displayError = error?.includes("429")
    ? "AI đang quá tải. Vui lòng đợi vài giây rồi thử lại."
    : error?.includes("Response status code")
      ? "AI tạm thời không phản hồi. Vui lòng thử lại sau."
      : error;

  const handleSendMessage = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRenameClick = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const handleConfirmRename = (id: string) => {
    renameConversation(id, editTitle);
    setEditingId(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-[#030303]">
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
            onClick={newConversation}
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
          ) : displayError ? (
            <div className="p-4 text-center space-y-3">
              <p className="text-red-400 text-sm">{displayError}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchConversations}
                className="flex items-center gap-2 text-slate-300"
              >
                <RefreshCw className="h-4 w-4" />
                Thử lại
              </Button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>Chưa có cuộc trò chuyện nào</p>
            </div>
          ) : (
            <>{conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => !editingId && selectConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg border border-transparent hover:bg-white/5 transition-colors group cursor-pointer ${
                  currentConversationId === conv.id ? "bg-white/5" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingId === conv.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-7 bg-slate-800 text-white text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleConfirmRename(conv.id);
                            } else if (e.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmRename(conv.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium truncate text-white">{conv.title}</p>
                        <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                      </>
                    )}
                  </div>
                  {!editingId && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-500 hover:text-[#FF8000] opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameClick(conv.id, conv.title);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                        onClick={(e) => deleteConversation(conv.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}</>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#030303]">
        {/* Header */}
        <header className="p-4 border-b border-white/5 bg-slate-950/50 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-400 md:hidden shrink-0"
            onClick={() => router.back()}
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
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
              <h2 className="font-semibold text-white">🤖 MATCHOP AI</h2>
              <p className="text-xs text-[#86D232]">Đang hoạt động</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {displayError && (
            <div className="p-4 text-center space-y-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{displayError}</p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    fetchConversations();
                    if (currentConversationId) {
                      selectConversation(currentConversationId);
                    }
                  }}
                  className="flex items-center gap-2 text-slate-300"
                >
                  <RefreshCw className="h-4 w-4" />
                  Thử lại
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-slate-400"
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
          
          {isSelectingConversation ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
              <p className="text-slate-400 text-sm">Đang tải cuộc trò chuyện...</p>
            </div>
          ) : messages.length === 0 ? (
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
                {quickPrompts.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => void sendMessage(suggestion)}
                    disabled={isLoading || isSelectingConversation}
                    className="p-3 text-left border border-white/5 rounded-xl bg-slate-900/50 hover:bg-slate-900 hover:border-[#FF8000]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      ? "bg-slate-900 border border-white/5 text-slate-100 prose prose-invert prose-sm max-w-none"
                      : "bg-[#FF8000] text-white"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
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