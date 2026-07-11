"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users2, TrendingUp, Clock, CheckCircle2,
  XCircle, Loader2, Search, Filter, MoreHorizontal,
  RefreshCw, AlertCircle, UserCheck, Gamepad2
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MatchPostDto {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  sportId: string;
  sportName: string;
  minSkillLevel: string;
  maxSkillLevel: string;
  city: string;
  district: string;
  preferredTime: string;
  slotsNeeded: number;
  slotsFilled: number;
  note: string | null;
  status: "OPEN" | "FILLED" | "CANCELLED" | "EXPIRED";
  createdAt: string;
}

interface MatchRequestDto {
  id: string;
  postId: string;
  sportName: string;
  senderUserId: string;
  senderFullName: string;
  senderAvatar: string | null;
  receiverUserId: string;
  receiverFullName: string;
  receiverAvatar: string | null;
  postDistrict: string;
  postCity: string;
  postPreferredTime: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string;
}

interface MatchRoomDto {
  id: string;
  sportId: string;
  sportName: string;
  status: "WAITING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  postCity: string;
  postDistrict: string;
  postPreferredTime: string | null;
  slotsNeeded: number;
  slotsFilled: number;
  ownerName: string;
  players: { userId: string; fullName: string; avatar: string | null; isHost: boolean; status: string }[];
}

interface MatchStatisticsDto {
  totalPosts: number;
  openPosts: number;
  filledPosts: number;
  cancelledPosts: number;
  totalRequests: number;
  pendingRequests: number;
  totalRooms: number;
  activeRooms: number;
}

interface PaginatedResponse<T> {
  data: {
    success: boolean;
    data: {
      posts?: T[];
      requests?: T[];
      rooms?: T[];
      TotalCount: number;
      Page: number;
      PageSize: number;
      TotalPages: number;
    };
  };
}

// ── Constants ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-500/10 text-green-400 border-green-500/20",
  FILLED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  EXPIRED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ACCEPTED: "bg-green-500/10 text-green-400 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  WAITING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
};

// ── Helpers ─────────────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Component ───────────────────────────────────────────────────────────────────

type Tab = "posts" | "requests" | "rooms";

export default function AdminMatchesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<MatchStatisticsDto | null>(null);

  // Posts state
  const [posts, setPosts] = useState<MatchPostDto[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(1);
  const [postsLoading, setPostsLoading] = useState(false);

  // Requests state
  const [requests, setRequests] = useState<MatchRequestDto[]>([]);
  const [requestsTotal, setRequestsTotal] = useState(0);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Rooms state
  const [rooms, setRooms] = useState<MatchRoomDto[]>([]);
  const [roomsTotal, setRoomsTotal] = useState(0);
  const [roomsPage, setRoomsPage] = useState(1);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // Load statistics
  const loadStatistics = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await apiFetch<ApiResponse<MatchStatisticsDto>>("/admin/matches/statistics", { token });
      if (res.data?.data) setStatistics(res.data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Load posts
  const loadPosts = useCallback(async (page = 1, status = statusFilter, searchTerm = search) => {
    const token = getStoredToken();
    if (!token) return;

    setPostsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
      });
      if (status !== "ALL") params.set("status", status);
      if (searchTerm) params.set("city", searchTerm);

      const res = await apiFetch<PaginatedResponse<MatchPostDto>>(`/admin/matches/posts?${params}`, { token });
      if (res.data?.data) {
        setPosts(res.data.data.posts || []);
        setPostsTotal(res.data.data.TotalCount || 0);
        setPostsPage(res.data.data.Page || 1);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách bài đăng");
    } finally {
      setPostsLoading(false);
    }
  }, [statusFilter, search]);

  // Load requests
  const loadRequests = useCallback(async (page = 1, status = statusFilter) => {
    const token = getStoredToken();
    if (!token) return;

    setRequestsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
      });
      if (status !== "ALL") params.set("status", status);

      const res = await apiFetch<PaginatedResponse<MatchRequestDto>>(`/admin/matches/requests?${params}`, { token });
      if (res.data?.data) {
        setRequests(res.data.data.requests || []);
        setRequestsTotal(res.data.data.TotalCount || 0);
        setRequestsPage(res.data.data.Page || 1);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách yêu cầu");
    } finally {
      setRequestsLoading(false);
    }
  }, [statusFilter]);

  // Load rooms
  const loadRooms = useCallback(async (page = 1, status = statusFilter) => {
    const token = getStoredToken();
    if (!token) return;

    setRoomsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
      });
      if (status !== "ALL") params.set("status", status);

      const res = await apiFetch<PaginatedResponse<MatchRoomDto>>(`/admin/matches/rooms?${params}`, { token });
      if (res.data?.data) {
        setRooms(res.data.data.rooms || []);
        setRoomsTotal(res.data.data.TotalCount || 0);
        setRoomsPage(res.data.data.Page || 1);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách phòng");
    } finally {
      setRoomsLoading(false);
    }
  }, [statusFilter]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadStatistics(),
        loadPosts(),
        loadRequests(),
        loadRooms(),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  // Reload when tab/filters change
  useEffect(() => {
    if (!loading) {
      if (activeTab === "posts") loadPosts(1, statusFilter, search);
      else if (activeTab === "requests") loadRequests(1, statusFilter);
      else if (activeTab === "rooms") loadRooms(1, statusFilter);
    }
  }, [activeTab, statusFilter]);

  // Cancel post handler
  const handleCancelPost = (post: MatchPostDto) => {
    setConfirmDialog({
      open: true,
      title: "Hủy bài đăng",
      description: `Bạn chắc chắn muốn hủy bài đăng tìm trận "${post.sportName}" của ${post.creatorName}?`,
      onConfirm: async () => {
        const token = getStoredToken();
        if (!token) return;
        try {
          await apiFetch(`/admin/matches/posts/${post.id}/status`, {
            method: "PATCH",
            token,
            body: JSON.stringify({ status: "CANCELLED" }),
          });
          toast.success("Đã hủy bài đăng");
          loadPosts();
          loadStatistics();
        } catch (err) {
          console.error(err);
          toast.error("Không thể hủy bài đăng");
        }
      },
    });
  };

  // Search handler
  const handleSearch = () => {
    if (activeTab === "posts") loadPosts(1, statusFilter, search);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF8000]" />
        <p className="text-sm text-[#C4C7C9]/60">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý trận đấu"
        description="Xem và quản lý các bài đăng tìm trận, yêu cầu và phòng trận đấu"
      />

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-[#FF8000]/10 flex items-center justify-center">
                  <Gamepad2 className="h-5 w-5 text-[#FF8000]" />
                </div>
                <span className="text-xs font-bold text-[#86D232] bg-[#86D232]/10 px-2 py-1 rounded">
                  Tổng cộng
                </span>
              </div>
              <p className="text-2xl font-black text-white mt-3">{statistics.totalPosts}</p>
              <p className="text-xs text-[#C4C7C9]/60 mt-1">Bài đăng tìm trận</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">
                  OPEN
                </span>
              </div>
              <p className="text-2xl font-black text-white mt-3">{statistics.openPosts}</p>
              <p className="text-xs text-[#C4C7C9]/60 mt-1">Đang mở</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                  PENDING
                </span>
              </div>
              <p className="text-2xl font-black text-white mt-3">{statistics.pendingRequests}</p>
              <p className="text-xs text-[#C4C7C9]/60 mt-1">Yêu cầu chờ</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users2 className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                  CONFIRMED
                </span>
              </div>
              <p className="text-2xl font-black text-white mt-3">{statistics.activeRooms}</p>
              <p className="text-xs text-[#C4C7C9]/60 mt-1">Phòng hoạt động</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[rgba(134,210,50,0.2)]">
        {(["posts", "requests", "rooms"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[#FF8000] text-[#FF8000]"
                : "border-transparent text-[#C4C7C9]/60 hover:text-white"
            }`}
          >
            {tab === "posts" && "Bài đăng"}
            {tab === "requests" && "Yêu cầu"}
            {tab === "rooms" && "Phòng trận"}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {activeTab === "posts" && (
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4C7C9]/40" />
              <Input
                placeholder="Tìm theo thành phố..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch} className="border-[rgba(134,210,50,0.2)] text-white">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent className="bg-[#141414] border-[rgba(134,210,50,0.2)] text-white">
            <SelectItem value="ALL">Tất cả</SelectItem>
            {activeTab === "posts" && (
              <>
                <SelectItem value="OPEN">Mở</SelectItem>
                <SelectItem value="FILLED">Đã đủ</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                <SelectItem value="EXPIRED">Hết hạn</SelectItem>
              </>
            )}
            {activeTab === "requests" && (
              <>
                <SelectItem value="PENDING">Chờ</SelectItem>
                <SelectItem value="ACCEPTED">Đã chấp nhận</SelectItem>
                <SelectItem value="REJECTED">Đã từ chối</SelectItem>
              </>
            )}
            {activeTab === "rooms" && (
              <>
                <SelectItem value="WAITING">Chờ</SelectItem>
                <SelectItem value="CONFIRMED">Xác nhận</SelectItem>
                <SelectItem value="COMPLETED">Hoàn tất</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadStatistics();
            if (activeTab === "posts") loadPosts();
            else if (activeTab === "requests") loadRequests();
            else if (activeTab === "rooms") loadRooms();
          }}
          className="border-[rgba(134,210,50,0.2)] text-white"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Posts Table */}
      {activeTab === "posts" && (
        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(134,210,50,0.2)] bg-[#141414]">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Người tạo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Môn</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Địa điểm</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Thời gian</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Slots</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Trạng thái</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(134,210,50,0.1)]">
                  {postsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#FF8000] mx-auto" />
                      </td>
                    </tr>
                  ) : posts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-[#C4C7C9]/60">
                        Không có bài đăng nào
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr key={post.id} className="hover:bg-[#141414]/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#FF8000]/10 flex items-center justify-center text-[#FF8000] font-bold text-xs">
                              {post.creatorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{post.creatorName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#C4C7C9]">{post.sportName}</td>
                        <td className="px-4 py-4 text-[#C4C7C9]">
                          {post.district}, {post.city}
                        </td>
                        <td className="px-4 py-4 text-[#C4C7C9]">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(post.preferredTime)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-[#FF8000] font-bold">{post.slotsFilled}</span>
                          <span className="text-[#C4C7C9]/60">/{post.slotsNeeded}</span>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={`border ${STATUS_COLORS[post.status] || ""}`}>
                            {post.status === "OPEN" && "Mở"}
                            {post.status === "FILLED" && "Đã đủ"}
                            {post.status === "CANCELLED" && "Hủy"}
                            {post.status === "EXPIRED" && "Hết hạn"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {post.status === "OPEN" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => handleCancelPost(post)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {postsTotal > 10 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(134,210,50,0.1)]">
                <p className="text-xs text-[#C4C7C9]/60">
                  Hiển thị {(postsPage - 1) * 10 + 1}–{Math.min(postsPage * 10, postsTotal)} của {postsTotal}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={postsPage <= 1}
                    onClick={() => loadPosts(postsPage - 1)}
                    className="border-[rgba(134,210,50,0.2)] text-white"
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={postsPage * 10 >= postsTotal}
                    onClick={() => loadPosts(postsPage + 1)}
                    className="border-[rgba(134,210,50,0.2)] text-white"
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Requests Table */}
      {activeTab === "requests" && (
        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(134,210,50,0.2)] bg-[#141414]">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Người gửi</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Người nhận</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Môn</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Địa điểm</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Thời gian</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(134,210,50,0.1)]">
                  {requestsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#FF8000] mx-auto" />
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-[#C4C7C9]/60">
                        Không có yêu cầu nào
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req.id} className="hover:bg-[#141414]/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#86D232]/10 flex items-center justify-center text-[#86D232] font-bold text-xs">
                              {req.senderFullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{req.senderFullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#C4C7C9]">{req.receiverFullName}</td>
                        <td className="px-4 py-4 text-[#C4C7C9]">{req.sportName}</td>
                        <td className="px-4 py-4 text-[#C4C7C9]">
                          {req.postDistrict}, {req.postCity}
                        </td>
                        <td className="px-4 py-4 text-[#C4C7C9]">
                          {formatDate(req.postPreferredTime)}
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={`border ${STATUS_COLORS[req.status] || ""}`}>
                            {req.status === "PENDING" && "Chờ"}
                            {req.status === "ACCEPTED" && "Đã chấp nhận"}
                            {req.status === "REJECTED" && "Từ chối"}
                            {req.status === "CANCELLED" && "Hủy"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {requestsTotal > 10 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(134,210,50,0.1)]">
                <p className="text-xs text-[#C4C7C9]/60">
                  Hiển thị {(requestsPage - 1) * 10 + 1}–{Math.min(requestsPage * 10, requestsTotal)} của {requestsTotal}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={requestsPage <= 1}
                    onClick={() => loadRequests(requestsPage - 1)}
                    className="border-[rgba(134,210,50,0.2)] text-white"
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={requestsPage * 10 >= requestsTotal}
                    onClick={() => loadRequests(requestsPage + 1)}
                    className="border-[rgba(134,210,50,0.2)] text-white"
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rooms Table */}
      {activeTab === "rooms" && (
        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(134,210,50,0.2)] bg-[#141414]">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Phòng</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Môn</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Chủ phòng</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Thành viên</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(134,210,50,0.1)]">
                  {roomsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#FF8000] mx-auto" />
                      </td>
                    </tr>
                  ) : rooms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-[#C4C7C9]/60">
                        Không có phòng nào
                      </td>
                    </tr>
                  ) : (
                    rooms.map((room) => (
                      <tr key={room.id} className="hover:bg-[#141414]/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-[#FF8000]/10 flex items-center justify-center">
                              <Users2 className="h-4 w-4 text-[#FF8000]" />
                            </div>
                            <span className="text-white font-mono text-xs">#{room.id.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#C4C7C9]">{room.sportName}</td>
                        <td className="px-4 py-4 text-[#C4C7C9]">{room.ownerName}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            {room.players.slice(0, 3).map((p, i) => (
                              <div
                                key={p.userId}
                                className="h-6 w-6 rounded-full bg-[#86D232]/10 border border-[#86D232]/20 flex items-center justify-center text-[10px] text-[#86D232] font-bold"
                                title={p.fullName}
                              >
                                {p.fullName.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {room.players.length > 3 && (
                              <span className="text-xs text-[#C4C7C9]/60">+{room.players.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={`border ${STATUS_COLORS[room.status] || ""}`}>
                            {room.status === "WAITING" && "Chờ"}
                            {room.status === "CONFIRMED" && "Xác nhận"}
                            {room.status === "COMPLETED" && "Hoàn tất"}
                            {room.status === "CANCELLED" && "Hủy"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-[#C4C7C9]">
                          {formatDate(room.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {roomsTotal > 10 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(134,210,50,0.1)]">
                <p className="text-xs text-[#C4C7C9]/60">
                  Hiển thị {(roomsPage - 1) * 10 + 1}–{Math.min(roomsPage * 10, roomsTotal)} của {roomsTotal}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={roomsPage <= 1}
                    onClick={() => loadRooms(roomsPage - 1)}
                    className="border-[rgba(134,210,50,0.2)] text-white"
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={roomsPage * 10 >= roomsTotal}
                    onClick={() => loadRooms(roomsPage + 1)}
                    className="border-[rgba(134,210,50,0.2)] text-white"
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
