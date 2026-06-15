"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { getStoredToken } from "@/lib/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface SignalRContextType {
  connection: signalR.HubConnection | null;
  isConnected: boolean;
}

const SignalRContext = createContext<SignalRContextType>({
  connection: null,
  isConnected: false,
});

export const useSignalR = () => useContext(SignalRContext);

export const SignalRProvider = ({ children }: { children: React.ReactNode }) => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return; // No token — skip connection entirely

    const hubUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "/chatHub")
      : "http://localhost:5208/chatHub";

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        // Use a factory so reconnect attempts always read the latest token
        accessTokenFactory: () => getStoredToken() || "",
      })
      .withAutomaticReconnect()
      .build();

    let isMounted = true;

    newConnection.onclose(() => {
      if (isMounted) setIsConnected(false);
    });

    newConnection
      .start()
      .then(() => {
        if (!isMounted) return;
        if (process.env.NODE_ENV === "development") {
          console.log("[SignalR] Connected to chatHub");
        }
        setIsConnected(true);
        setConnection(newConnection);
      })
      .catch((err) => {
        // 401 / negotiate failures — warn in dev, never throw to the UI
        if (process.env.NODE_ENV === "development") {
          console.warn("[SignalR] Connection failed (auth or network):", err);
        }
      });

    return () => {
      isMounted = false;
      newConnection.stop().catch(() => {}); // Ignore cleanup errors
    };
  }, []);

  useEffect(() => {
    if (!connection) return;

    // Receive Match Request
    connection.on("ReceiveMatchRequest", (request: any) => {
      toast(`Yêu cầu tham gia mới`, {
        description: `${request.senderFullName} muốn tham gia trận ${request.sportName} của bạn`,
        action: {
          label: "Chấp nhận",
          onClick: () => handleAcceptRequest(request.id),
        },
        cancel: {
          label: "Từ chối",
          onClick: () => handleRejectRequest(request.id),
        },
        duration: 10000,
      });
    });

    // Match Request Accepted
    connection.on("MatchRequestAccepted", (data: { requestId: string; conversationId: string }) => {
      toast.success("Yêu cầu tham gia đã được chấp nhận!", {
        description: "Bắt đầu trò chuyện ngay bây giờ.",
        action: {
          label: "Chat ngay",
          onClick: () => router.push(`/chat?convId=${data.conversationId}`),
        },
      });
      // Redirect to chat if on the same page or desired
      router.push(`/chat?convId=${data.conversationId}`);
    });

    // Match Request Rejected
    connection.on("MatchRequestRejected", (requestId: string) => {
      toast.error("Yêu cầu tham gia đã bị từ chối.");
    });

    // Match Found (AI Matching)
    connection.on("MatchFound", (data: { roomId: string }) => {
      toast.success("Đã tìm thấy trận đấu phù hợp!", {
        description: "Bấm để xem chi tiết và xác nhận tham gia.",
        action: {
          label: "Xem ngay",
          onClick: () => router.push(`/match/rooms/${data.roomId}`),
        },
        duration: 15000,
      });
    });

    // Match Confirmed
    connection.on("MatchConfirmed", (data: { roomId: string; conversationId: string }) => {
      toast.success("Trận đấu đã được xác nhận!", {
        description: "Tất cả người chơi đã sẵn sàng. Bắt đầu trò chuyện ngay!",
        action: {
          label: "Chat ngay",
          onClick: () => router.push(`/chat?convId=${data.conversationId}`),
        },
        duration: 10000,
      });
    });

    return () => {
      connection.off("ReceiveMatchRequest");
      connection.off("MatchRequestAccepted");
      connection.off("MatchRequestRejected");
      connection.off("MatchFound");
      connection.off("MatchConfirmed");
    };
  }, [connection, router]);

  const handleAcceptRequest = async (id: string) => {
    const token = getStoredToken();
    try {
      await apiFetch(`/match-requests/${id}/accept`, {
        method: "PUT",
        token,
      });
      toast.success("Đã chấp nhận yêu cầu.");
    } catch (err) {
      toast.error("Không thể chấp nhận yêu cầu.");
    }
  };

  const handleRejectRequest = async (id: string) => {
    const token = getStoredToken();
    try {
      await apiFetch(`/match-requests/${id}/reject`, {
        method: "PUT",
        token,
      });
      toast.info("Đã từ chối yêu cầu.");
    } catch (err) {
      toast.error("Không thể từ chối yêu cầu.");
    }
  };

  return (
    <SignalRContext.Provider value={{ connection, isConnected }}>
      {children}
    </SignalRContext.Provider>
  );
};
