"use client";

import { useEffect, useState } from "react";
import { 
  Users, Building2, Calendar, 
  TrendingUp, ArrowUpRight, Loader2,
  Activity, ShieldCheck, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    venues: 0,
    pendingVenues: 0,
    activeMatches: 0
  });

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    Promise.all([
      apiFetch<ApiResponse<any[]>>("/auth/admin/users", { token }),
      apiFetch<ApiResponse<any[]>>("/admin/venues", { token }),
      apiFetch<ApiResponse<any[]>>("/matching/posts") // Public endpoint
    ])
      .then(([usersRes, venuesRes, matchesRes]) => {
        const users = usersRes.data || [];
        const venues = venuesRes.data || [];
        const matches = matchesRes.data || [];

        setStats({
          users: users.length,
          venues: venues.length,
          pendingVenues: venues.filter((v: any) => v.status === "PENDING_APPROVAL").length,
          activeMatches: matches.length
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  const statCards = [
    { label: "Tổng người dùng", value: stats.users, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Tổng cơ sở", value: stats.venues, icon: Building2, color: "text-[#86D232]", bg: "bg-[#86D232]/10" },
    { label: "Cơ sở chờ duyệt", value: stats.pendingVenues, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Trận đấu đang chờ", value: stats.activeMatches, icon: Activity, color: "text-[#FF8000]", bg: "bg-[#FF8000]/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight font-heading">Tổng quan hệ thống</h1>
        <p className="text-[#C4C7C9] mt-1">Dữ liệu thời gian thực từ nền tảng MatchOps.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", card.bg)}>
                    <Icon className={cn("h-6 w-6", card.color)} />
                  </div>
                  <div className="flex items-center text-[10px] font-bold text-[#86D232] bg-[#86D232]/10 px-2 py-1 rounded-full">
                    Live <span className="ml-1 h-1 w-1 rounded-full bg-[#86D232] animate-pulse" />
                  </div>
                </div>
                <p className="text-xs font-bold text-[#C4C7C9]/60 uppercase tracking-widest">{card.label}</p>
                <p className="text-3xl font-black text-white mt-1">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
              <ShieldCheck className="h-4 w-4 text-[#86D232]" />
              Trạng thái hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                <span className="text-sm text-[#C4C7C9]">API Server</span>
                <span className="text-xs font-bold text-[#86D232]">Ổn định</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                <span className="text-sm text-[#C4C7C9]">Database</span>
                <span className="text-xs font-bold text-[#86D232]">Ổn định</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                <span className="text-sm text-[#C4C7C9]">AI Matchmaking</span>
                <span className="text-xs font-bold text-[#86D232]">Đang chạy</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-white/[0.06]">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
              <TrendingUp className="h-4 w-4 text-[#FF8000]" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-10 w-10 text-[#C4C7C9]/30 mb-2" />
              <p className="text-sm text-[#C4C7C9]/70">Xem chi tiết tại các mục quản lý tương ứng.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
