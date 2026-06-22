"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type {
  AiChatMessage,
  AiChatRequest,
  AiChatResponse,
  AiHistoryItem,
} from "@/types/ai";
import { toast } from "sonner";

export function useAiChat() {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [conversations, setConversations] = useState<AiHistoryItem[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingRequestRef = useRef<AbortController | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setIsLoadingHistory(true);
    setError(null);
    try {
      const token = getStoredToken();
      const response = await apiFetch<ApiResponse<AiHistoryItem[]>>(
        "/ai/conversations",
        { token }
      );
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch conversations"
      );
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Cancel previous pending request
      pendingRequestRef.current?.abort();
      const abortController = new AbortController();
      pendingRequestRef.current = abortController;

      const userMessage: AiChatMessage = {
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const token = getStoredToken();
        const reqBody: AiChatRequest = {
          message: content,
          ...(currentConversationId
            ? { conversationId: currentConversationId }
            : {}),
        };
        const response = await apiFetch<ApiResponse<AiChatResponse>>(
          "/ai/chat",
          {
            method: "POST",
            token,
            body: JSON.stringify(reqBody),
            signal: abortController.signal,
          }
        );

        if (response.success && response.data) {
          const assistantMessage: AiChatMessage = {
            id: response.data.id,
            role: "assistant",
            content: response.data.response,
            timestamp: new Date(response.data.timestamp),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // Update conversation list
          if (!currentConversationId) {
            setCurrentConversationId(response.data.conversationId);
            await fetchConversations();
          } else {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === response.data.conversationId
                  ? {
                      ...c,
                      lastMessage: response.data.response,
                      timestamp: new Date().toISOString(),
                    }
                  : c
              )
            );
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to send message";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (pendingRequestRef.current === abortController) {
          pendingRequestRef.current = null;
        }
        setIsLoading(false);
      }
    },
    [currentConversationId, isLoading, fetchConversations]
  );

  // Select conversation
  const selectConversation = useCallback(
    async (id: string) => {
      if (currentConversationId === id) return;
      setCurrentConversationId(id);
      setIsLoadingHistory(true);
      setError(null);

      const abortController = new AbortController();
      pendingRequestRef.current = abortController;

      try {
        const token = getStoredToken();
        const response = await apiFetch<
          ApiResponse<{ Messages: any[] }>
        >(`/ai/conversations/${id}`, {
          token,
          signal: abortController.signal,
        });

        if (response.success && response.data) {
          const msgs = response.data.Messages.map((m: any) => ({
            role: m.Role,
            content: m.Content,
            timestamp: new Date(m.CreatedAt),
          }));
          setMessages(msgs);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load conversation";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (pendingRequestRef.current === abortController) {
          pendingRequestRef.current = null;
        }
        setIsLoadingHistory(false);
      }
    },
    [currentConversationId]
  );

  // New conversation
  const newConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setError(null);
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        const token = getStoredToken();
        await apiFetch(`/ai/conversations/${id}`, {
          method: "DELETE",
          token,
        });

        if (currentConversationId === id) {
          setCurrentConversationId(null);
          setMessages([]);
        }

        setConversations((prev) => prev.filter((c) => c.id !== id));
        toast.success("Đã xóa cuộc trò chuyện");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete conversation";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    },
    [currentConversationId]
  );

  // Rename conversation
  const renameConversation = useCallback(
    async (id: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      try {
        const token = getStoredToken();
        await apiFetch(`/ai/conversations/${id}/rename`, {
          method: "PUT",
          token,
          body: JSON.stringify({ title: newTitle }),
        });

        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
        );
        toast.success("Đã đổi tên cuộc trò chuyện");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to rename conversation";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    },
    []
  );

  // Auto scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pendingRequestRef.current?.abort();
    };
  }, []);

  return {
    messages,
    conversations,
    currentConversationId,
    isLoading,
    isLoadingHistory,
    error,
    messagesEndRef,
    setCurrentConversationId,
    fetchConversations,
    sendMessage,
    selectConversation,
    newConversation,
    deleteConversation,
    renameConversation,
    setError,
  };
}
