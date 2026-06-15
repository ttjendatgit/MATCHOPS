"use client";

import { useEffect, useState } from "react";
import {
  Users, Calendar,
  Loader2, CheckCircle2, XCircle,
  Trophy, ChevronLeft,
  ShieldCheck, Info, MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getStoredToken, getStoredUser, isAuthenticated } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { MatchRoom } from "@/types/match";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function formatMatchDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return d.toLocaleString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function MatchRoomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"accept" | "reject" | null>(null);
  const [room, setRoom] = useState<MatchRoom | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.id) setCurrentUserId(user.id);

    if (!isAuthenticated()) {
      router.push(`/login?redirect=/match/rooms/${id}`);
      return;
    }
    fetchRoomDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRoomDetail = async () => {
    setLoading(true);
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<MatchRoom>>(`/matching/rooms/${id}`, { token });
      if (res.success && res.data) {
        setRoom(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thông tin phòng chờ");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "accept" | "reject") => {
    setActionLoading(action);
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<unknown>>(`/matching/rooms/${id}/${action}`, {
        method: "POST",
        token
      });

      if (res.success) {
        toast.success(action === "accept" ? "Đã chấp nhận trận đấu!" : "Đã từ chối trận đấu.");
        if (action === "accept") {
          fetchRoomDetail();
        } else {
          router.push("/match/rooms");
        }
      } else {
        toast.error(res.message || "Thao tác thất bại");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi hệ thống khi thực hiện thao tác";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-xl font-bold text-white">Không tìm thấy phòng chờ</h3>
        <Button asChild className="mt-4 bg-[#FF8000]">
          <Link href="/match/rooms">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const myPlayer = room.players.find(p => p.userId === currentUserId);
  const myStatus = myPlayer?.status;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/match/rooms" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Quay lại danh sách phòng
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Info Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-white/10 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-white/5 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#FF8000]/10 flex items-center justify-center border border-[#FF8000]/20">
                    <Trophy className="h-5 w-5 text-[#FF8000]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-white">Chi tiết phòng ghép</CardTitle>
                    <p className="text-xs text-slate-400">ID: {room.id.slice(0, 8)}</p>
                  </div>
                </div>
                <Badge className="bg-[#86D232]/10 text-[#86D232] border-[#86D232]/20">
                  {room.sportName}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#FF8000] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phòng tạo lúc</p>
                      <p className="text-sm text-white font-medium">
                        {formatMatchDateTime(room.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-[#FF8000] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Người chơi</p>
                      <p className="text-sm text-white font-medium">{room.players.length} người</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="h-8 w-8 text-[#86D232] mb-2" />
                  <p className="text-sm font-bold text-white">Ghép đối an toàn</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Hệ thống đã kiểm tra trình độ và độ uy tín của các người chơi trong phòng này.
                  </p>
                </div>
              </div>

              {/* Player Status */}
              <div className="pt-6 border-t border-white/5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Trạng thái xác nhận</h4>
                <div className="space-y-3">
                  {room.players.map((p) => (
                    <div key={p.userId} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-white/10">
                          <AvatarImage src={p.avatar || ""} />
                          <AvatarFallback className="bg-slate-800 text-xs text-white">
                            {(p.fullName || "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {p.fullName}
                            {p.userId === currentUserId && <span className="ml-1 text-[#FF8000]">(Bạn)</span>}
                            {p.isHost && <span className="ml-1 text-[10px] text-slate-400">(Host)</span>}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "text-[10px]",
                        p.status === "ACCEPTED" ? "bg-[#86D232]/10 text-[#86D232]" :
                        p.status === "REJECTED" ? "bg-red-500/10 text-red-500" :
                        p.status === "LEFT" ? "bg-slate-500/10 text-slate-400" :
                        "bg-amber-500/10 text-amber-500"
                      )}>
                        {p.status === "ACCEPTED" ? "Đã xác nhận" :
                         p.status === "REJECTED" ? "Đã từ chối" :
                         p.status === "LEFT" ? "Đã rời phòng" : "Đang chờ"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <Info className="h-5 w-5 text-blue-400 shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Trận đấu chỉ chính thức diễn ra khi tất cả người chơi trong phòng bấm chấp nhận.
              Sau đó, hệ thống sẽ tự động mở phòng chat.
            </p>
          </div>
        </div>

        {/* Action Column */}
        <div className="space-y-6">
          <Card className="border-white/10 bg-slate-900/50 backdrop-blur-sm sticky top-24">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">Quyết định của bạn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {room.status === "CONFIRMED" ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                  <div className="h-16 w-16 rounded-full bg-[#86D232]/10 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-[#86D232]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">Trận đấu đã xác nhận!</p>
                    <p className="text-sm text-slate-400 mt-2">Mọi người đã sẵn sàng tham gia.</p>
                  </div>
                  {room.conversationId && (
                    <Button asChild className="w-full bg-[#FF8000] hover:bg-[#FF8000]/90 text-white font-bold py-6 h-auto gap-2">
                      <Link href={`/chat?convId=${room.conversationId}`}>
                        <MessageCircle className="h-5 w-5" />
                        Trò chuyện ngay
                      </Link>
                    </Button>
                  )}
                </div>
              ) : myStatus === "PENDING" ? (
                <>
                  <Button
                    onClick={() => handleAction("accept")}
                    disabled={actionLoading !== null}
                    className="w-full bg-[#86D232] hover:bg-[#86D232]/90 text-slate-950 font-bold py-6 h-auto gap-2"
                  >
                    {actionLoading === "accept" ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                    Chấp nhận ghép trận
                  </Button>
                  <Button
                    onClick={() => handleAction("reject")}
                    disabled={actionLoading !== null}
                    variant="outline"
                    className="w-full border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 py-6 h-auto gap-2"
                  >
                    {actionLoading === "reject" ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5" />}
                    Từ chối trận này
                  </Button>
                </>
              ) : myStatus === "ACCEPTED" ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#86D232]/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-[#86D232]" />
                  </div>
                  <p className="text-sm font-bold text-white">Bạn đã chấp nhận</p>
                  <p className="text-xs text-slate-500 mt-1">Đang chờ những người chơi khác xác nhận để bắt đầu.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <XCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-sm font-bold text-white">Bạn đã từ chối</p>
                  <p className="text-xs text-slate-500 mt-1">Trận đấu này sẽ không diễn ra với bạn.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
