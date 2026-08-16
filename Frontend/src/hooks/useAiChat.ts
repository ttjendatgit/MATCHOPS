"use client";



import { useState, useCallback, useRef, useEffect } from "react";

import { apiFetch, ApiError } from "@/lib/api";

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

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isSelectingConversation, setIsSelectingConversation] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendAbortRef = useRef<AbortController | null>(null);

  const conversationAbortRef = useRef<AbortController | null>(null);

  const currentConversationIdRef = useRef<string | null>(null);

  const isFetchingConversationsRef = useRef(false);

  const latestConversationRequestRef = useRef(0);

  const skipAutoSelectRef = useRef(false);



  const persistCurrentConversationId = useCallback((conversationId: string | null) => {

    currentConversationIdRef.current = conversationId;

    setCurrentConversationId(conversationId);



    if (typeof window === "undefined") return;



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



  const scrollToBottom = useCallback(() => {

    const container = messagesEndRef.current?.parentElement;

    if (container) {

      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });

    }

  }, []);



  const selectConversation = useCallback(

    async (id: string) => {

      if (!id) return;

      skipAutoSelectRef.current = false;

      if (currentConversationIdRef.current === id && messages.length > 0) return;



      conversationAbortRef.current?.abort();

      const abortController = new AbortController();

      conversationAbortRef.current = abortController;

      const requestId = latestConversationRequestRef.current + 1;

      latestConversationRequestRef.current = requestId;

      setIsSelectingConversation(true);

      setError(null);



      try {

        const token = getStoredToken();

        const response = await apiFetch<ApiResponse<AiConversationDetailResponse>>(

          `/ai/conversations/${id}`,

          { token, signal: abortController.signal }

        );



        if (response.success && response.data) {

          if (latestConversationRequestRef.current !== requestId) return;

          setMessages(mapHistoryToMessages(response.data.messages));

          persistCurrentConversationId(id);

        }

      } catch (err: unknown) {

        if (err instanceof Error && err.name === "AbortError") return;

        const errorMessage =

          err instanceof Error ? err.message : "Failed to load conversation";

        if (errorMessage.toLowerCase().includes("conversation not found")) {

          persistCurrentConversationId(null);

          setMessages([]);

        }

        setError(errorMessage);

        toast.error(errorMessage);

      } finally {

        if (conversationAbortRef.current === abortController) {

          conversationAbortRef.current = null;

        }

        setIsSelectingConversation(false);

      }

    },

    [mapHistoryToMessages, messages.length, persistCurrentConversationId]

  );



  const fetchConversations = useCallback(async () => {

    if (isFetchingConversationsRef.current) return;



    isFetchingConversationsRef.current = true;

    setIsLoadingHistory(true);

    setError(null);



    try {

      const token = getStoredToken();

      const response = await apiFetch<ApiResponse<AiHistoryItem[]>>("/ai/conversations", {

        token,

      });



      if (response.success && response.data) {

        setConversations(response.data);



        if (response.data.length > 0 && !skipAutoSelectRef.current) {

          const storedId = currentConversationIdRef.current;

          const validStored =

            !!storedId && response.data.some((conversation) => conversation.id === storedId);



          if (validStored) {

            if (messages.length === 0) {

              await selectConversation(storedId!);

            }

          } else {

            // Không auto-chọn conversation đầu tiên — hiển thị màn hình chào

            persistCurrentConversationId(null);

            setMessages([]);

          }

        }

      }

    } catch (err) {

      setError(err instanceof Error ? err.message : "Failed to fetch conversations");

      console.error(err);

    } finally {

      isFetchingConversationsRef.current = false;

      setIsLoadingHistory(false);

    }

  }, [messages.length, persistCurrentConversationId, selectConversation]);



  const sendMessage = useCallback(

    async (content: string) => {

      if (!content.trim() || isLoading) return;



      sendAbortRef.current?.abort();

      const abortController = new AbortController();

      sendAbortRef.current = abortController;

      const timeoutId = window.setTimeout(() => abortController.abort(), 90_000);



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

          conversationId: currentConversationIdRef.current || undefined,

        };

        const response = await apiFetch<ApiResponse<AiChatResponse>>("/ai/chat", {

          method: "POST",

          token,

          body: JSON.stringify(reqBody),

          signal: abortController.signal,

        });



        if (response.success && response.data) {

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

      } catch (err: unknown) {

        if (err instanceof Error && err.name === "AbortError") {

          setError("AI phản hồi quá lâu. Vui lòng thử lại.");

          toast.error("AI phản hồi quá lâu. Vui lòng thử lại.");

          return;

        }

        const errorMessage =

          err instanceof Error ? err.message : "Failed to send message";

        setError(errorMessage);

        if (err instanceof ApiError && err.status === 429) {

          toast.error("AI đang quá tải. Vui lòng đợi vài giây rồi thử lại.");

        } else {

          toast.error(errorMessage);

        }

      } finally {

        window.clearTimeout(timeoutId);

        if (sendAbortRef.current === abortController) {

          sendAbortRef.current = null;

        }

        setIsLoading(false);

      }

    },

    [isLoading, fetchConversations, mapHistoryToMessages, persistCurrentConversationId]

  );



  const newConversation = useCallback(() => {

    conversationAbortRef.current?.abort();

    skipAutoSelectRef.current = true;

    setMessages([]);

    persistCurrentConversationId(null);

    setError(null);

    setIsSelectingConversation(false);

  }, [persistCurrentConversationId]);



  const deleteConversation = useCallback(

    async (id: string, e?: React.MouseEvent) => {

      e?.stopPropagation();

      try {

        const token = getStoredToken();

        await apiFetch(`/ai/conversations/${id}`, { method: "DELETE", token });



        if (currentConversationIdRef.current === id) {

          skipAutoSelectRef.current = true;

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

    [persistCurrentConversationId]

  );



  const renameConversation = useCallback(async (id: string, newTitle: string) => {

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

  }, []);



  useEffect(() => {

    if (typeof window === "undefined") return;

    const storedConversationId = window.localStorage.getItem(CURRENT_CONVERSATION_STORAGE_KEY);

    if (storedConversationId) {

      currentConversationIdRef.current = storedConversationId;

      setCurrentConversationId(storedConversationId);

    }

  }, []);



  useEffect(() => {

    if (messages.length === 0) return;

    scrollToBottom();

  }, [messages, scrollToBottom]);



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

    isSelectingConversation,

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

