"use client";

import { useEffect, useState } from "react";
import {
  Users, Calendar,
  Loader2, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getStoredToken, isAuthenticated } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { MatchRoom } from "@/types/match";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("vi-VN", {
      weekday: "short",
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function MatchRoomsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<MatchRoom[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/match/rooms");
      return;
    }
    fetchRooms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<MatchRoom[]>>("/matching/rooms", { token });
      if (res.success && res.data) {
        setRooms(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách phòng chờ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Phòng chờ ghép đối</h1>
        <p className="mt-2 text-slate-400">Xem và xác nhận các trận đấu đã tìm được cho bạn.</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
        </div>
      ) : rooms.length === 0 ? (
        <Card className="border-dashed border-white/10 bg-slate-900/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-white/5">
            <Users className="h-8 w-8 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white">Chưa có phòng chờ nào</h3>
          <p className="mt-2 text-slate-400">Hãy tham gia ghép nhanh hoặc tạo bài tìm trận để bắt đầu.</p>
          <Button asChild className="mt-6 bg-[#FF8000] hover:bg-[#FF8000]/90 text-white">
            <Link href="/match">Tìm trận ngay</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {rooms.map((room) => (
            <Card key={room.id} className="overflow-hidden border-white/10 bg-slate-900/50 hover:border-[#FF8000]/30 transition-all duration-300">
              <CardHeader className="border-b border-white/5 bg-white/5 flex flex-row items-center justify-between py-3 px-5">
                <Badge className="bg-[#86D232]/10 text-[#86D232] border-[#86D232]/20">
                  {room.sportName}
                </Badge>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                  room.status === "WAITING" ? "bg-amber-500/10 text-amber-500" :
                  room.status === "CONFIRMED" ? "bg-[#86D232]/10 text-[#86D232]" :
                  "bg-slate-500/10 text-slate-500"
                )}>
                  {room.status === "WAITING" ? "Chờ xác nhận" :
                   room.status === "CONFIRMED" ? "Đã xác nhận" :
                   room.status === "CANCELLED" ? "Đã hủy" : room.status}
                </span>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Calendar className="h-4 w-4 text-[#FF8000] shrink-0" />
                    <span>Tạo lúc {formatDateTime(room.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Users className="h-4 w-4 text-[#FF8000] shrink-0" />
                    <span>{room.players.length} người tham gia</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Người chơi</p>
                  <div className="flex -space-x-2 overflow-hidden">
                    {room.players.map((p) => (
                      <Avatar key={p.userId} className="h-8 w-8 ring-2 ring-slate-900 border border-white/10">
                        <AvatarImage src={p.avatar || ""} />
                        <AvatarFallback className="bg-slate-800 text-[10px] font-bold text-white">
                          {(p.fullName || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>

                <Button asChild className="w-full bg-[#FF8000] hover:bg-[#FF8000]/90 text-white font-bold">
                  <Link href={`/match/rooms/${room.id}`}>
                    Xem chi tiết & Xác nhận
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
