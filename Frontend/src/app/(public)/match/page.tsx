"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, Users, Calendar, MapPin,
  Dumbbell, Filter, Plus, Loader2,
  Trophy, MessageCircle, Share2, Zap, DoorOpen, Bell, Clock
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { MatchPost, MatchRequest, UserSkill } from "@/types/match";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStoredToken, getStoredUser, isAuthenticated } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Sport {
  id: string;
  name: string;
}

function formatMatchDateTime(isoString: string): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const mo = (d.getMonth() + 1).toString().padStart(2, "0");
    return `${hh}:${mm} ${days[d.getDay()]} ${dd}/${mo}`;
  } catch {
    return "—";
  }
}

function getMinDateTimeLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function MatchmakingPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<MatchPost[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MatchRequest[]>([]);
  const [sentRequestMap, setSentRequestMap] = useState<Map<string, string>>(new Map());
  const [sports, setSports] = useState<Sport[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "requests" | "my_posts">("all");
  const [myPosts, setMyPosts] = useState<MatchPost[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuickMatchLoading, setIsQuickMatchLoading] = useState(false);
  const [isInQueue, setIsInQueue] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isSettingSkill, setIsSettingSkill] = useState(false);
  const [selectedSportSkill, setSelectedSportSkill] = useState("1");

  const [newPost, setNewPost] = useState({
    sportId: "",
    minSkillLevel: "1",
    maxSkillLevel: "4",
    city: "TP.HCM",
    district: "",
    preferredTime: "",
    slotsNeeded: 2,
    note: ""
  });

  useEffect(() => {
    setIsMounted(true);
    const user = getStoredUser();
    if (user?.id) setCurrentUserId(user.id);
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    if (!isAuthenticated()) return;
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<MatchRequest[]>>("/match-requests/pending", { token });
      if (res.success && res.data) {
        setPendingRequests(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchSentRequests = useCallback(async () => {
    if (!isAuthenticated()) return;
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<MatchRequest[]>>("/match-requests/sent", { token });
      if (res.success && res.data) {
        // Backend returns sorted by createdAt DESC — first entry per postId is the most recent status
        const map = new Map<string, string>();
        for (const r of res.data) {
          if (!map.has(r.postId)) {
            map.set(r.postId, r.status);
          }
        }
        setSentRequestMap(map);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const checkQueueStatus = useCallback(async () => {
    if (!isAuthenticated() || sports.length === 0) return;
    const token = getStoredToken();
    for (const sport of sports) {
      try {
        const res = await apiFetch<ApiResponse<unknown>>(`/matching/queue/status/${sport.id}`, { token });
        if (res.success && res.data) {
          setIsInQueue(sport.id);
          return;
        }
      } catch {
        // silently ignore
      }
    }
    setIsInQueue(null);
  }, [sports]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSport !== "all") params.append("sportId", selectedSport);
      if (selectedLevel !== "all") params.append("level", selectedLevel);
      if (searchQuery) params.append("district", searchQuery);
      const qs = params.toString();
      const url = qs ? `/matching/posts?${qs}` : "/matching/posts";
      const res = await apiFetch<ApiResponse<MatchPost[]>>(url);
      if (res.success && res.data) {
        setPosts(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách bài tìm trận");
    } finally {
      setLoading(false);
    }
  }, [selectedSport, selectedLevel, searchQuery]);

  const fetchMyPosts = useCallback(async () => {
    if (!isAuthenticated()) return;
    const user = getStoredUser();
    if (!user?.id) return;
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<MatchPost[]>>(
        `/matching/posts?creatorId=${user.id}`,
        { token }
      );
      if (res.success && res.data) {
        setMyPosts(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchSports = async () => {
    try {
      const res = await apiFetch<ApiResponse<Sport[]>>("/sports");
      if (res.success && res.data) setSports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserSkills = useCallback(async () => {
    if (!isAuthenticated()) return;
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<UserSkill[]>>("/user-skills", { token });
      if (res.success && res.data) setUserSkills(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Initial mount fetch
  useEffect(() => {
    fetchPosts();
    fetchSports();
    fetchPendingRequests();
    fetchMyPosts();
    fetchUserSkills();
    fetchSentRequests();
  }, [fetchPosts, fetchPendingRequests, fetchMyPosts, fetchUserSkills, fetchSentRequests]);

  // Refetch on tab switch
  useEffect(() => {
    if (!isMounted) return;
    if (activeTab === "requests") fetchPendingRequests();
    if (activeTab === "my_posts") fetchMyPosts();
  }, [activeTab, isMounted, fetchPendingRequests, fetchMyPosts]);

  useEffect(() => {
    if (sports.length > 0) checkQueueStatus();
  }, [sports, checkQueueStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchPosts(), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPosts]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<unknown>>(`/matching/posts/${postId}`, {
        method: "DELETE",
        token
      });
      if (res.success) {
        toast.success("Đã xóa bài đăng");
        fetchMyPosts();
        fetchPosts();
      }
    } catch {
      toast.error("Không thể xóa bài đăng");
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      toast.error("Vui lòng đăng nhập để tạo bài tìm trận");
      router.push("/login?redirect=/match");
      return;
    }

    if (!newPost.preferredTime) {
      toast.error("Vui lòng chọn thời gian tổ chức.");
      return;
    }

    const selectedTime = new Date(newPost.preferredTime);
    if (selectedTime <= new Date()) {
      toast.error("Vui lòng chọn thời gian trong tương lai.");
      return;
    }

    if (!newPost.sportId) {
      toast.error("Vui lòng chọn môn thể thao.");
      return;
    }

    if (!newPost.district.trim()) {
      toast.error("Vui lòng nhập quận/huyện.");
      return;
    }

    const hasSkill = userSkills.some(s => s.sportId === newPost.sportId);
    if (!hasSkill) {
      setIsSettingSkill(true);
      setActionLoading(null);
      toast.info("Bạn cần cập nhật trình độ cho môn thể thao này trước.");
      return;
    }

    setActionLoading("create");
    const token = getStoredToken();

    try {
      const res = await apiFetch<ApiResponse<MatchPost>>("/matching/posts", {
        method: "POST",
        token,
        body: JSON.stringify({
          sportId: newPost.sportId,
          minSkillLevel: parseInt(newPost.minSkillLevel),
          maxSkillLevel: parseInt(newPost.maxSkillLevel),
          city: newPost.city,
          district: newPost.district,
          preferredTime: selectedTime.toISOString(),
          slotsNeeded: newPost.slotsNeeded,
          note: newPost.note || undefined
        })
      });

      if (res.success) {
        toast.success("Tạo bài tìm trận thành công!");
        setIsCreateModalOpen(false);
        setNewPost({
          sportId: "",
          minSkillLevel: "1",
          maxSkillLevel: "4",
          city: "TP.HCM",
          district: "",
          preferredTime: "",
          slotsNeeded: 2,
          note: ""
        });
        fetchPosts();
        fetchMyPosts();
        setActiveTab("my_posts");
      } else {
        toast.error(res.message || "Không thể tạo bài đăng");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo bài đăng";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSkill = async () => {
    if (!newPost.sportId) return;
    setActionLoading("skill");
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<unknown>>("/user-skills", {
        method: "POST",
        token,
        body: JSON.stringify({
          sportId: newPost.sportId,
          skillLevel: parseInt(selectedSportSkill)
        })
      });
      if (res.success) {
        toast.success("Cập nhật trình độ thành công!");
        await fetchUserSkills();
        setIsSettingSkill(false);
      }
    } catch {
      toast.error("Không thể cập nhật trình độ");
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickMatch = async () => {
    if (!isAuthenticated()) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng ghép nhanh");
      router.push("/login?redirect=/match");
      return;
    }
    if (selectedSport === "all") {
      toast.error("Vui lòng chọn môn thể thao để ghép nhanh");
      return;
    }

    setIsQuickMatchLoading(true);
    const token = getStoredToken();

    const hasSkill = userSkills.some(s => s.sportId === selectedSport);
    if (!hasSkill && isInQueue !== selectedSport) {
      setNewPost(prev => ({ ...prev, sportId: selectedSport }));
      setIsSettingSkill(true);
      setIsCreateModalOpen(true);
      setIsQuickMatchLoading(false);
      toast.info("Bạn cần cập nhật trình độ cho môn thể thao này trước.");
      return;
    }

    try {
      if (isInQueue === selectedSport) {
        const res = await apiFetch<ApiResponse<unknown>>(`/matching/queue/leave/${selectedSport}`, {
          method: "POST",
          token
        });
        if (res.success) {
          toast.success("Đã rời khỏi hàng chờ.");
          setIsInQueue(null);
        }
      } else {
        const res = await apiFetch<ApiResponse<unknown>>("/matching/queue/join", {
          method: "POST",
          token,
          body: JSON.stringify({ sportId: selectedSport })
        });
        if (res.success) {
          toast.success("Đã tham gia hàng chờ ghép nhanh. Chúng tôi sẽ thông báo khi tìm thấy trận phù hợp!");
          setIsInQueue(selectedSport);
        } else {
          toast.error(res.message || "Không thể tham gia hàng chờ");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi hệ thống khi thực hiện ghép nhanh";
      toast.error(message);
    } finally {
      setIsQuickMatchLoading(false);
    }
  };

  const handleJoinMatch = async (post: MatchPost) => {
    if (!isAuthenticated()) {
      toast.error("Vui lòng đăng nhập để tham gia trận đấu");
      router.push("/login?redirect=/match");
      return;
    }

    const currentSentStatus = sentRequestMap.get(post.id);
    if (currentSentStatus === "PENDING" || currentSentStatus === "ACCEPTED") return;

    const hasSkill = userSkills.some(s => s.sportId === post.sportId);
    if (!hasSkill) {
      setNewPost(prev => ({ ...prev, sportId: post.sportId }));
      setIsSettingSkill(true);
      setIsCreateModalOpen(true);
      toast.info("Bạn cần cập nhật trình độ cho môn thể thao này trước.");
      return;
    }

    setActionLoading(post.id);
    const token = getStoredToken();

    try {
      const res = await apiFetch<ApiResponse<MatchRequest>>("/match-requests", {
        method: "POST",
        token,
        body: JSON.stringify({ postId: post.id })
      });

      if (res.success) {
        toast.success("Đã gửi yêu cầu tham gia. Vui lòng chờ phản hồi!");
        setSentRequestMap(prev => new Map(prev).set(post.id, "PENDING"));
        fetchSentRequests();
      } else {
        toast.error(res.message || "Không thể gửi yêu cầu");
        fetchSentRequests();
        fetchPosts();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể gửi yêu cầu tham gia trận đấu";
      toast.error(message);
      fetchSentRequests();
      fetchPosts();
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<unknown>>(`/match-requests/${requestId}/accept`, {
        method: "PUT",
        token
      });
      if (res.success) {
        toast.success("Đã chấp nhận yêu cầu tham gia!");
        fetchPendingRequests();
        fetchMyPosts();
        fetchPosts();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể chấp nhận yêu cầu";
      toast.error(message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<unknown>>(`/match-requests/${requestId}/reject`, {
        method: "PUT",
        token
      });
      if (res.success) {
        toast.info("Đã từ chối yêu cầu");
        fetchPendingRequests();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể từ chối yêu cầu";
      toast.error(message);
    }
  };

  const handleShare = (post: MatchPost) => {
    const text = `Tham gia trận ${post.sportName} cùng tôi tại ${post.district}, ${post.city}!`;
    if (navigator.share) {
      navigator.share({ title: "MatchOps - Tìm đối thủ", text, url: window.location.href }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      toast.success("Đã sao chép liên kết vào bộ nhớ tạm");
    }
  };

  const isOwnPost = (post: MatchPost) => isMounted && currentUserId && post.creatorId === currentUserId;
  const getSentStatus = (post: MatchPost): string | undefined => isMounted ? sentRequestMap.get(post.id) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 p-8 border border-white/10">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-[#FF8000]/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-black text-white md:text-5xl leading-tight">
              Tìm đối thủ, <br />
              <span className="bg-gradient-to-r from-[#FF8000] to-[#86D232] bg-clip-text text-transparent">Giao lưu kết nối</span>
            </h1>
            <p className="mt-4 text-lg text-slate-400">
              Hệ thống ghép đối thông minh giúp bạn tìm được người chơi cùng trình độ, thời gian và địa điểm phù hợp.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#FF8000] hover:bg-[#FF8000]/90 text-white px-8 py-6 h-auto text-lg font-bold gap-2"
            >
              <Plus className="h-5 w-5" />
              Tạo bài tìm trận
            </Button>
            <Button
              onClick={handleQuickMatch}
              disabled={isQuickMatchLoading}
              variant={isInQueue === selectedSport ? "destructive" : "outline"}
              className={cn(
                "px-8 py-6 h-auto text-lg font-bold gap-2",
                isInQueue === selectedSport
                  ? "bg-red-500/10 border-red-500/50 hover:bg-red-500/20 text-red-500"
                  : "border-white/10 bg-white/5 hover:bg-white/10 text-white"
              )}
            >
              {isQuickMatchLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className={cn("h-5 w-5", isInQueue === selectedSport ? "text-red-500" : "text-[#86D232]")} />}
              {isInQueue === selectedSport ? "Rời hàng chờ" : "Ghép nhanh"}
            </Button>
            <Button
              variant="outline"
              asChild
              className="px-8 py-6 h-auto text-lg font-bold gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white"
            >
              <Link href="/match/rooms">
                <DoorOpen className="h-5 w-5 text-[#86D232]" />
                Phòng chờ
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex border-b border-white/5">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-6 py-4 text-sm font-bold transition-all border-b-2",
            activeTab === "all" ? "text-[#FF8000] border-[#FF8000]" : "text-slate-400 border-transparent hover:text-white"
          )}
        >
          Tất cả bài đăng
        </button>
        {isMounted && isAuthenticated() && (
          <>
            <button
              onClick={() => setActiveTab("requests")}
              className={cn(
                "px-6 py-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2",
                activeTab === "requests" ? "text-[#FF8000] border-[#FF8000]" : "text-slate-400 border-transparent hover:text-white"
              )}
            >
              Yêu cầu chờ xử lý
              {pendingRequests.length > 0 && (
                <Badge className="bg-[#FF8000] text-white text-[10px] h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {pendingRequests.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab("my_posts")}
              className={cn(
                "px-6 py-4 text-sm font-bold transition-all border-b-2",
                activeTab === "my_posts" ? "text-[#FF8000] border-[#FF8000]" : "text-slate-400 border-transparent hover:text-white"
              )}
            >
              Bài đăng của tôi
            </button>
          </>
        )}
      </div>

      {/* All Posts */}
      {activeTab === "all" && (
        <>
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo quận, huyện..."
                className="pl-10 bg-slate-900/50 border-white/10 text-white focus:border-[#FF8000]"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[180px] border-white/10 bg-slate-900/50 text-white">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Trình độ" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="all">Tất cả trình độ</SelectItem>
                  <SelectItem value="1">Beginner</SelectItem>
                  <SelectItem value="2">Intermediate</SelectItem>
                  <SelectItem value="3">Advanced</SelectItem>
                  <SelectItem value="4">Professional</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="w-[180px] border-white/10 bg-slate-900/50 text-white">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    <SelectValue placeholder="Môn thể thao" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="all">Tất cả môn</SelectItem>
                  {sports.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-slate-900 p-6 border border-white/5">
                <Users className="h-12 w-12 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-white">Không tìm thấy bài đăng nào</h3>
              <p className="mt-2 text-slate-400 max-w-sm">
                Hãy thử thay đổi bộ lọc hoặc là người đầu tiên tạo bài tìm trận!
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="mt-6 bg-[#FF8000] hover:bg-[#FF8000]/90 text-white">
                Tạo bài đăng ngay
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const own = isOwnPost(post);
                const sentStatus = getSentStatus(post);
                const full = post.slotsFilled >= post.slotsNeeded;
                return (
                  <Card key={post.id} className="group overflow-hidden border-white/10 bg-slate-900/50 hover:border-[#FF8000]/30 transition-all duration-300 flex flex-col">
                    <CardContent className="p-0 flex flex-col flex-1">
                      <div className="p-6 flex flex-col flex-1">
                        {/* Creator */}
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-[#FF8000]/20">
                              <AvatarImage src={post.creatorAvatar || ""} />
                              <AvatarFallback className="bg-slate-800 text-[#FF8000] font-bold">
                                {(post.creatorName || "?").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-white">{post.creatorName}</p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatMatchDateTime(post.preferredTime)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-[#86D232]/30 bg-[#86D232]/10 text-[#86D232]">
                            {post.sportName}
                          </Badge>
                        </div>

                        {/* Info */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-3 text-sm text-slate-300">
                            <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                            <span>{formatMatchDateTime(post.preferredTime)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-300">
                            <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                            <span className="truncate">{post.district}, {post.city}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-300">
                            <Trophy className="h-4 w-4 text-slate-500 shrink-0" />
                            <span>Trình độ: {post.minSkillLevel} – {post.maxSkillLevel}</span>
                          </div>
                        </div>

                        {post.note && (
                          <div className="mb-6 rounded-lg bg-slate-950/50 p-3 text-xs text-slate-400 italic flex-1">
                            "{post.note}"
                          </div>
                        )}

                        {/* Progress */}
                        <div className="mb-6 space-y-2 mt-auto">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Số người cần:</span>
                            <span className="text-white font-bold">{post.slotsFilled}/{post.slotsNeeded}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#FF8000] to-[#86D232] transition-all duration-500"
                              style={{ width: `${Math.min((post.slotsFilled / post.slotsNeeded) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {own ? (
                            <Button disabled className="flex-1 bg-slate-800 text-slate-400 font-bold cursor-default">
                              Bài đăng của bạn
                            </Button>
                          ) : sentStatus === "ACCEPTED" ? (
                            <Button
                              className="flex-1 bg-[#86D232] hover:bg-[#86D232]/90 text-slate-950 font-bold"
                              asChild
                            >
                              <Link href={`/chat?userId=${post.creatorId}`}>
                                Đã được duyệt ✓
                              </Link>
                            </Button>
                          ) : sentStatus === "PENDING" ? (
                            <Button disabled className="flex-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold cursor-default">
                              Đã gửi yêu cầu
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleJoinMatch(post)}
                              disabled={actionLoading === post.id || full || post.status !== "OPEN"}
                              className="flex-1 bg-[#FF8000] hover:bg-[#FF8000]/90 text-white font-bold disabled:bg-slate-800 disabled:text-slate-400"
                            >
                              {actionLoading === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                               full || post.status === "FILLED" ? "Đã đủ người" :
                               post.status !== "OPEN" ? "Không khả dụng" :
                               "Tham gia ngay"}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleShare(post)}
                            className="border-white/10 bg-white/5 hover:bg-white/10 text-white p-2"
                          >
                            <Share2 className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="outline"
                            className="border-white/10 bg-white/5 hover:bg-white/10 text-white p-2"
                            asChild
                          >
                            <Link href={`/chat?userId=${post.creatorId}`}>
                              <MessageCircle className="h-5 w-5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Pending Requests */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#FF8000]" />
              Yêu cầu đang chờ xử lý
            </h2>
            <Button
              variant="outline"
              onClick={fetchPendingRequests}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm gap-2"
            >
              <Loader2 className="h-4 w-4" />
              Làm mới
            </Button>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/30 rounded-3xl border border-dashed border-white/10">
              <div className="mb-4 rounded-full bg-slate-900 p-6 border border-white/5">
                <Bell className="h-12 w-12 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-white">Chưa có yêu cầu nào</h3>
              <p className="mt-2 text-slate-400 max-w-sm">
                Các yêu cầu tham gia trận đấu của người khác gửi cho bạn sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((req) => (
                <Card key={req.id} className="border-white/10 bg-slate-900/50 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border border-[#FF8000]/20">
                          <AvatarImage src={req.senderAvatar || ""} />
                          <AvatarFallback className="bg-slate-800 text-white font-bold">
                            {(req.senderFullName || "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg font-bold text-white">{req.senderFullName}</p>
                          <p className="text-sm text-slate-400">
                            Muốn tham gia trận <span className="text-[#86D232] font-bold">{req.sportName}</span> của bạn
                          </p>
                          {req.postPreferredTime && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {formatMatchDateTime(req.postPreferredTime)}
                              {req.postDistrict && ` · ${req.postDistrict}, ${req.postCity}`}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-500 mt-1">
                            Gửi vào {new Date(req.createdAt).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="flex-1 sm:flex-initial bg-[#86D232] hover:bg-[#86D232]/90 text-white font-bold"
                        >
                          Chấp nhận
                        </Button>
                        <Button
                          onClick={() => handleRejectRequest(req.id)}
                          variant="outline"
                          className="flex-1 sm:flex-initial border-red-500/50 text-red-500 hover:bg-red-500/10"
                        >
                          Từ chối
                        </Button>
                        <Button
                          variant="outline"
                          asChild
                          className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                        >
                          <Link href={`/chat?userId=${req.senderUserId}`}>
                            <MessageCircle className="h-5 w-5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Posts */}
      {activeTab === "my_posts" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#FF8000]" />
              Bài đăng của tôi
            </h2>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#FF8000] hover:bg-[#FF8000]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo mới
            </Button>
          </div>

          {myPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/30 rounded-3xl border border-dashed border-white/10">
              <div className="mb-4 rounded-full bg-slate-900 p-6 border border-white/5">
                <Trophy className="h-12 w-12 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-white">Bạn chưa có bài đăng nào</h3>
              <p className="mt-2 text-slate-400 max-w-sm">
                Hãy tạo bài đăng đầu tiên để tìm đối thủ ngay hôm nay!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myPosts.map((post) => (
                <Card key={post.id} className="border-white/10 bg-slate-900/50 overflow-hidden flex flex-col">
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-[#86D232]/10 text-[#86D232] border-[#86D232]/20">
                        {post.sportName}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        post.status === "OPEN" ? "border-[#86D232]/30 text-[#86D232]" :
                        post.status === "FILLED" ? "border-[#FF8000]/30 text-[#FF8000]" :
                        "border-slate-500 text-slate-500"
                      )}>
                        {post.status === "OPEN" ? "Đang mở" :
                         post.status === "FILLED" ? "Đủ người" :
                         post.status === "CANCELLED" ? "Đã hủy" : "Hết hạn"}
                      </Badge>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>{formatMatchDateTime(post.preferredTime)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>{post.district}, {post.city}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <Users className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>{post.slotsFilled}/{post.slotsNeeded} người tham gia</span>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 flex gap-2 border-t border-white/5">
                      <Button
                        variant="outline"
                        className="flex-1 border-white/10 hover:bg-white/5 text-white"
                        asChild
                      >
                        <Link href={`/match/${post.id}`}>Xem & Sửa</Link>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDeletePost(post.id)}
                        className="flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10"
                      >
                        Xóa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) setIsSettingSkill(false);
      }}>
        <DialogContent className="bg-slate-950 border-white/10 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {isSettingSkill ? "Cập nhật trình độ" : "Tạo bài tìm trận mới"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {isSettingSkill
                ? "Bạn cần cập nhật trình độ cho môn thể thao này để tiếp tục."
                : "Điền thông tin chi tiết để tìm đối thủ phù hợp nhất."}
            </DialogDescription>
          </DialogHeader>

          {isSettingSkill ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Trình độ của bạn</Label>
                <Select value={selectedSportSkill} onValueChange={setSelectedSportSkill}>
                  <SelectTrigger className="bg-slate-900 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="1">Beginner (Người mới)</SelectItem>
                    <SelectItem value="2">Intermediate (Trung bình)</SelectItem>
                    <SelectItem value="3">Advanced (Khá/Giỏi)</SelectItem>
                    <SelectItem value="4">Professional (Chuyên nghiệp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleUpdateSkill}
                  disabled={actionLoading === "skill"}
                  className="flex-1 bg-[#86D232] hover:bg-[#86D232]/90 text-slate-950 font-bold"
                >
                  {actionLoading === "skill" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cập nhật & Tiếp tục"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsSettingSkill(false)}
                  className="border-white/10 text-white"
                >
                  Quay lại
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreatePost} className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Môn thể thao <span className="text-red-400">*</span></Label>
                  <Select
                    value={newPost.sportId}
                    onValueChange={(val) => setNewPost({ ...newPost, sportId: val })}
                  >
                    <SelectTrigger className="bg-slate-900 border-white/10">
                      <SelectValue placeholder="Chọn môn" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {sports.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Số người cần <span className="text-red-400">*</span></Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={newPost.slotsNeeded}
                    onChange={(e) => setNewPost({ ...newPost, slotsNeeded: parseInt(e.target.value) || 1 })}
                    className="bg-slate-900 border-white/10"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Quận/Huyện <span className="text-red-400">*</span></Label>
                  <Input
                    placeholder="VD: Quận 7"
                    value={newPost.district}
                    onChange={(e) => setNewPost({ ...newPost, district: e.target.value })}
                    className="bg-slate-900 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thời gian tổ chức <span className="text-red-400">*</span></Label>
                  <Input
                    type="datetime-local"
                    value={newPost.preferredTime}
                    min={getMinDateTimeLocal()}
                    onChange={(e) => setNewPost({ ...newPost, preferredTime: e.target.value })}
                    className="bg-slate-900 border-white/10 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Trình độ tối thiểu</Label>
                  <Select
                    value={newPost.minSkillLevel}
                    onValueChange={(val) => setNewPost({ ...newPost, minSkillLevel: val })}
                  >
                    <SelectTrigger className="bg-slate-900 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="1">Beginner</SelectItem>
                      <SelectItem value="2">Intermediate</SelectItem>
                      <SelectItem value="3">Advanced</SelectItem>
                      <SelectItem value="4">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trình độ tối đa</Label>
                  <Select
                    value={newPost.maxSkillLevel}
                    onValueChange={(val) => setNewPost({ ...newPost, maxSkillLevel: val })}
                  >
                    <SelectTrigger className="bg-slate-900 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="1">Beginner</SelectItem>
                      <SelectItem value="2">Intermediate</SelectItem>
                      <SelectItem value="3">Advanced</SelectItem>
                      <SelectItem value="4">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ghi chú (Không bắt buộc)</Label>
                <Input
                  placeholder="VD: Sân đã đặt, share tiền sân..."
                  value={newPost.note}
                  onChange={(e) => setNewPost({ ...newPost, note: e.target.value })}
                  className="bg-slate-900 border-white/10"
                />
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 border-white/10 text-white font-bold py-6 order-2 sm:order-1"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading === "create"}
                  className="flex-[2] bg-[#FF8000] hover:bg-[#FF8000]/90 text-white font-bold py-6 order-1 sm:order-2"
                >
                  {actionLoading === "create" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Đăng bài tìm trận"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
