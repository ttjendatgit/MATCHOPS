"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type {
  AiChatMessage,
  AiChatRequest,
  AiChatResponse,
  AiConversationDetailResponse,
  AiHistoryItem,
} from "@/types/ai";
import { toast } from "sonner";

const CURRENT_CONVERSATION_STORAGE_KEY = "currentConversationId";

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
  const sendAbortRef = useRef<AbortController | null>(null);
  const conversationAbortRef = useRef<AbortController | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);
  const isFetchingConversationsRef = useRef(false);
  const hasFetchedConversationsRef = useRef(false);
  const latestConversationRequestRef = useRef(0);
  const hasAttemptedRestoreRef = useRef(false);

  // #region debug-point A:frontend-report
  const reportAiDebug = useCallback((hypothesisId: string, msg: string, data: Record<string, unknown> = {}) => {
    fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "ai-chat-history",
        runId: "pre-fix",
        hypothesisId,
        location: "Frontend/src/hooks/useAiChat.ts",
        msg: `[DEBUG] ${msg}`,
        data,
        ts: Date.now(),
      }),
    }).catch(() => {});
  }, []);
  // #endregion

  const persistCurrentConversationId = useCallback((conversationId: string | null) => {
    currentConversationIdRef.current = conversationId;
    setCurrentConversationId(conversationId);

    if (typeof window === "undefined") {
      return;
    }

    if (conversationId) {
      window.localStorage.setItem(CURRENT_CONVERSATION_STORAGE_KEY, conversationId);
    } else {
      window.localStorage.removeItem(CURRENT_CONVERSATION_STORAGE_KEY);
    }
  }, []);

  const mapHistoryToMessages = useCallback(
    (history: { role: "user" | "assistant"; content: string; createdAt: string }[]) =>
      history.map((message, index) => ({
        id: `${message.role}-${message.createdAt}-${index}`,
        role: message.role,
        content: message.content,
        timestamp: new Date(message.createdAt),
      })),
    []
  );

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (isFetchingConversationsRef.current) {
      return;
    }

    isFetchingConversationsRef.current = true;
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
        // #region debug-point B:fetch-conversations-success
        reportAiDebug("B", "Fetched conversations", {
          count: response.data.length,
          firstConversationId: response.data[0]?.id ?? null,
          currentConversationId,
        });
        // #endregion
      }
    } catch (err) {
      // #region debug-point B:fetch-conversations-error
      reportAiDebug("B", "Failed to fetch conversations", {
        currentConversationId,
        error: err instanceof Error ? err.message : "unknown",
      });
      // #endregion
      setError(
        err instanceof Error ? err.message : "Failed to fetch conversations"
      );
      console.error(err);
    } finally {
      isFetchingConversationsRef.current = false;
      hasFetchedConversationsRef.current = true;
      setIsLoadingHistory(false);
    }
  }, [currentConversationId, reportAiDebug]);

  // Scroll to bottom — scroll only the messages container itself
  // (messagesEndRef's parent), never the document/window. A plain
  // `scrollIntoView()` can bubble the scroll up to the page when the
  // container's layout hasn't fully settled yet, which was dragging
  // the whole /ai-chat page down to the footer on mount.
  const scrollToBottom = useCallback(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Cancel previous pending request
      sendAbortRef.current?.abort();
      const abortController = new AbortController();
      sendAbortRef.current = abortController;

      const userMessage: AiChatMessage = {
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // #region debug-point A:send-start
      reportAiDebug("A", "Send message started", {
        currentConversationId: currentConversationIdRef.current,
        contentLength: content.length,
        hasPendingRequest: !!sendAbortRef.current,
      });
      // #endregion

      try {
        const token = getStoredToken();
        const reqBody: AiChatRequest = {
          message: content,
          conversationId: currentConversationIdRef.current || undefined,
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
          // #region debug-point A:send-success
          reportAiDebug("A", "Send message succeeded", {
            requestConversationId: null,
            responseConversationId: response.data.conversationId,
            assistantMessageId: response.data.id,
            historyCount: response.data.history?.length ?? null,
          });
          // #endregion
          persistCurrentConversationId(response.data.conversationId);
          if (response.data.history?.length) {
            setMessages(mapHistoryToMessages(response.data.history));
          } else {
            const assistantMessage: AiChatMessage = {
              id: response.data.id,
              role: "assistant",
              content: response.data.response,
              timestamp: new Date(response.data.timestamp),
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
          await fetchConversations();
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          // #region debug-point A:send-error
          reportAiDebug("A", "Send message failed", {
            currentConversationId: currentConversationIdRef.current,
            error: err instanceof Error ? err.message : "unknown",
          });
          // #endregion
          const errorMessage =
            err instanceof Error ? err.message : "Failed to send message";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (sendAbortRef.current === abortController) {
          sendAbortRef.current = null;
        }
        setIsLoading(false);
      }
    },
    [isLoading, fetchConversations, mapHistoryToMessages, persistCurrentConversationId, reportAiDebug]
  );

  // Select conversation
  const selectConversation = useCallback(
    async (id: string) => {
      if (!id) return;
      if (currentConversationIdRef.current === id && messages.length > 0) return;
      // #region debug-point C:select-start
      reportAiDebug("C", "Select conversation started", {
        clickedConversationId: id,
        currentConversationId: currentConversationIdRef.current,
        hasPendingRequest: !!conversationAbortRef.current,
      });
      // #endregion
      conversationAbortRef.current?.abort();
      const abortController = new AbortController();
      conversationAbortRef.current = abortController;
      const requestId = latestConversationRequestRef.current + 1;
      latestConversationRequestRef.current = requestId;
      setIsLoadingHistory(true);
      setError(null);

      try {
        const token = getStoredToken();
        const response = await apiFetch<
          ApiResponse<AiConversationDetailResponse>
        >(`/ai/conversations/${id}`, {
          token,
          signal: abortController.signal,
        });

        if (response.success && response.data) {
          if (latestConversationRequestRef.current !== requestId) {
            return;
          }
          // #region debug-point C:select-success
          reportAiDebug("C", "Select conversation succeeded", {
            clickedConversationId: id,
            responseMessageCount: response.data.messages?.length ?? null,
            responseConversationId: response.data.conversation?.id ?? null,
            currentConversationIdAtResolve: currentConversationIdRef.current,
          });
          // #endregion
          setMessages(mapHistoryToMessages(response.data.messages));
          persistCurrentConversationId(id);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          // #region debug-point C:select-error
          reportAiDebug("C", "Select conversation failed", {
            clickedConversationId: id,
            currentConversationIdAtError: currentConversationIdRef.current,
            error: err instanceof Error ? err.message : "unknown",
          });
          // #endregion
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load conversation";
          if (errorMessage.toLowerCase().includes("conversation not found")) {
            persistCurrentConversationId(null);
            setMessages([]);
          }
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (conversationAbortRef.current === abortController) {
          conversationAbortRef.current = null;
        }
        setIsLoadingHistory(false);
      }
    },
    [mapHistoryToMessages, messages.length, persistCurrentConversationId, reportAiDebug]
  );

  // New conversation
  const newConversation = useCallback(() => {
    conversationAbortRef.current?.abort();
    setMessages([]);
    persistCurrentConversationId(null);
    setError(null);
  }, [persistCurrentConversationId]);

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
          persistCurrentConversationId(null);
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
    [currentConversationId, persistCurrentConversationId]
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

  useEffect(() => {
    if (typeof window === "undefined" || hasAttemptedRestoreRef.current) {
      return;
    }

    hasAttemptedRestoreRef.current = true;
    const storedConversationId = window.localStorage.getItem(CURRENT_CONVERSATION_STORAGE_KEY);
    if (storedConversationId) {
      currentConversationIdRef.current = storedConversationId;
      setCurrentConversationId(storedConversationId);
      reportAiDebug("H", "Restored conversation id from localStorage", {
        storedConversationId,
      });
    }
  }, [reportAiDebug]);

  useEffect(() => {
    if (!currentConversationId || !hasFetchedConversationsRef.current) {
      return;
    }

    const existsInHistory = conversations.some((conversation) => conversation.id === currentConversationId);
    if (!existsInHistory) {
      persistCurrentConversationId(null);
      setMessages([]);
      return;
    }

    if (messages.length === 0 && !isLoadingHistory) {
      void selectConversation(currentConversationId);
    }
  }, [
    conversations,
    currentConversationId,
    messages.length,
    isLoadingHistory,
    persistCurrentConversationId,
    selectConversation,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sendAbortRef.current?.abort();
      conversationAbortRef.current?.abort();
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
