"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Calendar, MapPin, Dumbbell, Trophy, 
  MessageCircle, Share2, Loader2, ChevronLeft,
  Users, Info, Trash2, Save
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { MatchPost, UserSkill } from "@/types/match";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStoredToken, isAuthenticated } from "@/lib/auth";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<MatchPost | null>(null);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sports, setSports] = useState<{id: string, name: string}[]>([]);

  // Edit form states
  const [editForm, setEditForm] = useState({
    minSkillLevel: 1,
    maxSkillLevel: 4,
    district: "",
    preferredTime: "",
    slotsNeeded: 2,
    note: "",
    status: "OPEN"
  });

  const fetchPost = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<ApiResponse<MatchPost>>(`/matching/posts/${id}`);
      if (res.success && res.data) {
        setPost(res.data);
        
        // Check if current user is creator
        const userJson = localStorage.getItem("MATCHOP_USER");
        if (userJson) {
          const user = JSON.parse(userJson);
          setIsCreator(user.id === res.data.creatorId);
        }

        // Init edit form
        setEditForm({
          minSkillLevel: res.data.minSkillLevel,
          maxSkillLevel: res.data.maxSkillLevel,
          district: res.data.district,
          preferredTime: new Date(res.data.preferredTime).toISOString().slice(0, 16),
          slotsNeeded: res.data.slotsNeeded,
          note: res.data.note || "",
          status: res.data.status
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thông tin bài đăng");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchSports = async () => {
    try {
      const res = await apiFetch<ApiResponse<{id: string, name: string}[]>>("/sports");
      if (res.success && res.data) {
        setSports(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserSkills = useCallback(async () => {
    if (!isAuthenticated()) return;
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<UserSkill[]>>("/user-skills", { token });
      if (res.success && res.data) {
        setUserSkills(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPost();
    fetchSports();
    fetchUserSkills();
  }, [fetchPost, fetchUserSkills]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("update");
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<any>>(`/matching/posts/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          ...editForm,
          preferredTime: new Date(editForm.preferredTime).toISOString()
        })
      });

      if (res.success) {
        toast.success("Cập nhật thành công");
        setIsEditing(false);
        fetchPost();
      }
    } catch (err) {
      toast.error("Lỗi khi cập nhật bài đăng");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;
    setActionLoading("delete");
    const token = getStoredToken();
    try {
      const res = await apiFetch<ApiResponse<any>>(`/matching/posts/${id}`, {
        method: "DELETE",
        token
      });
      if (res.success) {
        toast.success("Đã xóa bài đăng");
        router.push("/match");
      }
    } catch (err) {
      toast.error("Lỗi khi xóa bài đăng");
    } finally {
      setActionLoading(null);
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated()) {
      toast.error("Vui lòng đăng nhập để tham gia");
      router.push(`/login?redirect=/match/${id}`);
      return;
    }

    setActionLoading("join");
    const token = getStoredToken();

    // Check if user has skill for this sport
    const hasSkill = userSkills.some(s => s.sportId === post?.sportId);
    if (!hasSkill) {
      toast.error("Bạn cần cập nhật trình độ cho môn này trong trang cá nhân trước khi tham gia.");
      router.push("/profile");
      return;
    }

    try {
      const res = await apiFetch<ApiResponse<any>>("/match-requests", {
        method: "POST",
        token,
        body: JSON.stringify({
          postId: id,
          receiverUserId: post?.creatorId
        })
      });

      if (res.success) {
        toast.success("Đã gửi yêu cầu tham gia!");
      }
    } catch (err) {
      toast.error("Lỗi khi gửi yêu cầu tham gia");
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

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-xl font-bold text-white">Không tìm thấy bài đăng</h3>
        <Button asChild className="mt-4 bg-[#FF8000]">
          <Link href="/match">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/match" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-white/10 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-white/5 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border border-[#FF8000]/20">
                    <AvatarImage src={post.creatorAvatar || ""} />
                    <AvatarFallback className="bg-slate-800 text-[#FF8000] font-bold">
                      {post.creatorName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl font-bold text-white">{post.creatorName}</CardTitle>
                    <p className="text-sm text-slate-400">Đăng lúc {new Date(post.preferredTime).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
                <Badge className="bg-[#86D232]/10 text-[#86D232] border-[#86D232]/20 text-sm py-1 px-3">
                  {post.sportName}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Quận/Huyện</Label>
                      <Input 
                        value={editForm.district}
                        onChange={(e) => setEditForm({...editForm, district: e.target.value})}
                        className="bg-slate-950 border-white/10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Thời gian dự kiến</Label>
                      <Input 
                        type="datetime-local" 
                        value={editForm.preferredTime}
                        onChange={(e) => setEditForm({...editForm, preferredTime: e.target.value})}
                        className="bg-slate-950 border-white/10 [color-scheme:dark]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Trình độ tối thiểu</Label>
                      <Select 
                        value={editForm.minSkillLevel.toString()} 
                        onValueChange={(val) => setEditForm({...editForm, minSkillLevel: parseInt(val)})}
                      >
                        <SelectTrigger className="bg-slate-950 border-white/10">
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
                        value={editForm.maxSkillLevel.toString()} 
                        onValueChange={(val) => setEditForm({...editForm, maxSkillLevel: parseInt(val)})}
                      >
                        <SelectTrigger className="bg-slate-950 border-white/10">
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

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Số lượng người cần</Label>
                      <Input 
                        type="number"
                        value={editForm.slotsNeeded}
                        onChange={(e) => setEditForm({...editForm, slotsNeeded: parseInt(e.target.value)})}
                        className="bg-slate-950 border-white/10"
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Trạng thái</Label>
                      <Select 
                        value={editForm.status} 
                        onValueChange={(val) => setEditForm({...editForm, status: val})}
                      >
                        <SelectTrigger className="bg-slate-950 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                          <SelectItem value="OPEN">Mở (Đang tìm)</SelectItem>
                          <SelectItem value="CANCELLED">Hủy bỏ</SelectItem>
                          <SelectItem value="COMPLETED">Đã xong</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <Input 
                      value={editForm.note}
                      onChange={(e) => setEditForm({...editForm, note: e.target.value})}
                      className="bg-slate-950 border-white/10"
                      placeholder="Thông tin thêm..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={actionLoading === "update"}
                      className="flex-1 bg-[#86D232] hover:bg-[#86D232]/90 text-slate-950 font-bold"
                    >
                      {actionLoading === "update" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Lưu thay đổi
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 border-white/10 text-white"
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-[#FF8000] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Thời gian</p>
                          <p className="text-lg text-white font-medium">
                            {new Date(post.preferredTime).toLocaleDateString("vi-VN", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-slate-400">{new Date(post.preferredTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-[#FF8000] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Địa điểm</p>
                          <p className="text-lg text-white font-medium">{post.district}, {post.city}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Trophy className="h-5 w-5 text-[#FF8000] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trình độ yêu cầu</p>
                          <p className="text-lg text-white font-medium">{post.minSkillLevel} - {post.maxSkillLevel}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-[#FF8000] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Số lượng</p>
                          <p className="text-lg text-white font-medium">{post.slotsFilled} / {post.slotsNeeded} người</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {post.note && (
                    <div className="rounded-2xl bg-white/5 border border-white/5 p-6">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ghi chú</p>
                      <p className="text-slate-300 italic">"{post.note}"</p>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <Info className="h-5 w-5 text-blue-400 shrink-0" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Bằng cách tham gia, bạn đồng ý tuân thủ quy định văn hóa thể thao và thời gian của người tạo bài đăng.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-white/10 bg-slate-900/50 backdrop-blur-sm sticky top-24">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">Thao tác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCreator ? (
                <>
                  {!isEditing && (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-[#FF8000] hover:bg-[#FF8000]/90 text-white font-bold py-6 h-auto gap-2"
                    >
                      Chỉnh sửa bài đăng
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={handleDelete}
                    disabled={actionLoading === "delete"}
                    className="w-full border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 py-6 h-auto gap-2"
                  >
                    {actionLoading === "delete" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Xóa bài đăng
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handleJoin}
                    disabled={actionLoading === "join" || post.slotsFilled >= post.slotsNeeded || post.status !== "OPEN"}
                    className="w-full bg-[#FF8000] hover:bg-[#FF8000]/90 text-white font-bold py-6 h-auto gap-2"
                  >
                    {actionLoading === "join" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                    {post.slotsFilled >= post.slotsNeeded ? "Đã đủ người" : 
                     post.status !== "OPEN" ? "Đã đóng" : "Gửi yêu cầu tham gia"}
                  </Button>
                  <Button 
                    variant="outline"
                    asChild
                    className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white py-6 h-auto gap-2"
                  >
                    <Link href={`/chat?userId=${post.creatorId}`}>
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Nhắn tin cho người tạo
                    </Link>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Đã sao chép liên kết");
                    }}
                    className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white py-6 h-auto gap-2"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Chia sẻ bài đăng
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
