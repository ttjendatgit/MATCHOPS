"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Dumbbell, Edit2, Trash2, Loader2, AlertCircle, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SportResponseDto {
  id: string;
  name: string;
  status: string;
  iconUrl?: string;
  description?: string;
  createdAt?: string;
}

interface CreateSportDto {
  name: string;
  status: string;
  description?: string;
}

// ── Constants ───────────────────────────────────────────────────────────────────

const SPORT_ICONS = [
  "⚽", "🏀", "🏐", "🎾", "🏓", "🏸", "🥊", "🏊", "🚴", "🏃",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminSportsPage() {
  const [sports, setSports] = useState<SportResponseDto[]>([]);
  const [allSports, setAllSports] = useState<SportResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingSport, setEditingSport] = useState<SportResponseDto | null>(null);
  const [formData, setFormData] = useState<CreateSportDto>({ name: "", status: "ACTIVE", description: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    sport: SportResponseDto | null;
  }>({ open: false, sport: null });

  // Load data
  const loadSports = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    setLoading(true);
    try {
      // Load active sports
      const activeRes = await apiFetch<ApiResponse<SportResponseDto[]>>("/sports", { token });
      const active = activeRes.data || [];

      // Try to load all sports (including inactive) if endpoint exists
      let all = active;
      try {
        const allRes = await apiFetch<ApiResponse<SportResponseDto[]>>("/admin/sports", { token });
        if (allRes.data) {
          all = allRes.data;
        }
      } catch {
        // Admin endpoint might not exist, use active only
        all = active;
      }

      setSports(all);
      setAllSports(all);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách môn thể thao");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSports();
  }, [loadSports]);

  // Filter sports
  const filteredSports = allSports.filter((sport) => {
    const matchesSearch = sport.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || sport.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Open create form
  const handleOpenCreate = () => {
    setEditingSport(null);
    setFormData({ name: "", status: "ACTIVE", description: "" });
    setFormError(null);
    setShowForm(true);
  };

  // Open edit form
  const handleOpenEdit = (sport: SportResponseDto) => {
    setEditingSport(sport);
    setFormData({ name: sport.name, status: sport.status, description: sport.description || "" });
    setFormError(null);
    setShowForm(true);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Vui lòng nhập tên môn thể thao");
      return;
    }

    const token = getStoredToken();
    if (!token) return;

    setFormSaving(true);
    try {
      if (editingSport) {
        // Update
        await apiFetch(`/admin/sports/${editingSport.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify({
            name: formData.name.trim(),
            status: formData.status,
            description: formData.description?.trim(),
          }),
        });
        toast.success("Cập nhật môn thể thao thành công!");
      } else {
        // Create
        await apiFetch("/admin/sports", {
          method: "POST",
          token,
          body: JSON.stringify({
            name: formData.name.trim(),
            status: formData.status,
            description: formData.description?.trim(),
          }),
        });
        toast.success("Tạo môn thể thao thành công!");
      }

      setShowForm(false);
      loadSports();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      setFormError(message);
      toast.error(message);
    } finally {
      setFormSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirm.sport) return;

    const token = getStoredToken();
    if (!token) return;

    try {
      await apiFetch(`/admin/sports/${deleteConfirm.sport.id}`, {
        method: "DELETE",
        token,
      });
      toast.success("Xóa môn thể thao thành công!");
      setDeleteConfirm({ open: false, sport: null });
      loadSports();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể xóa môn thể thao";
      toast.error(message);
    }
  };

  // Toggle status
  const handleToggleStatus = async (sport: SportResponseDto) => {
    const token = getStoredToken();
    if (!token) return;

    const newStatus = sport.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      await apiFetch(`/admin/sports/${sport.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Đã ${newStatus === "ACTIVE" ? "kích hoạt" : "vô hiệu hóa"} môn ${sport.name}`);
      loadSports();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể cập nhật trạng thái";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Môn thể thao"
        description="Quản lý danh mục môn thể thao trên nền tảng"
        action={
          <Button onClick={handleOpenCreate} className="bg-[#FF8000] hover:bg-[#FF8000]/90">
            <Plus className="h-4 w-4 mr-2" />
            Thêm môn
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4C7C9]/40" />
          <Input
            placeholder="Tìm kiếm môn thể thao..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white"
          />
        </div>

        <div className="flex gap-2">
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? "bg-[#FF8000] hover:bg-[#FF8000]/90" : "border-[rgba(134,210,50,0.2)] text-white"}
            >
              {status === "ALL" ? "Tất cả" : status === "ACTIVE" ? "Hoạt động" : "Ẩn"}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadSports}
          className="border-[rgba(134,210,50,0.2)] text-white"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
        </div>
      ) : filteredSports.length === 0 ? (
        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Dumbbell className="h-12 w-12 text-[#C4C7C9]/20 mb-4" />
            <p className="text-[#C4C7C9]/60">Không tìm thấy môn thể thao nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSports.map((sport) => (
            <Card
              key={sport.id}
              className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] hover:border-[rgba(134,210,50,0.4)] transition-all"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF8000]/10">
                      <Dumbbell className="h-6 w-6 text-[#FF8000]" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{sport.name}</p>
                      <p className="text-xs text-slate-500">ID: {sport.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </div>

                {sport.description && (
                  <p className="text-xs text-[#C4C7C9]/60 mb-4 line-clamp-2">{sport.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <Badge
                    variant={sport.status === "ACTIVE" ? "success" : "secondary"}
                    className="text-xs"
                  >
                    {sport.status === "ACTIVE" ? "Hoạt động" : "Ẩn"}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-[#C4C7C9]/60 hover:text-[#FF8000]"
                      onClick={() => handleOpenEdit(sport)}
                      title="Sửa"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-[#C4C7C9]/60 hover:text-red-400"
                      onClick={() => setDeleteConfirm({ open: true, sport })}
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#141414] border-[rgba(134,210,50,0.2)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingSport ? "Sửa môn thể thao" : "Thêm môn thể thao mới"}
            </DialogTitle>
            <DialogDescription className="text-[#C4C7C9]/60">
              {editingSport
                ? `Cập nhật thông tin cho "${editingSport.name}"`
                : "Điền thông tin để tạo môn thể thao mới"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#C4C7C9]">
                Tên môn thể thao <span className="text-red-400">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Bóng đá, Bóng rổ, Cầu lông..."
                className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#C4C7C9]">Mô tả</label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn về môn thể thao (tùy chọn)"
                rows={3}
                className="w-full rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] px-3 py-2 text-sm text-white placeholder:text-[#C4C7C9]/20 focus:border-[#FF8000] focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#C4C7C9]">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] px-3 py-2 text-sm text-white focus:border-[#FF8000] focus:outline-none"
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Ẩn</option>
              </select>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="border-[rgba(134,210,50,0.2)] text-white"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={formSaving}
                className="bg-[#FF8000] hover:bg-[#FF8000]/90"
              >
                {formSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : editingSport ? (
                  "Cập nhật"
                ) : (
                  "Tạo mới"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && setDeleteConfirm({ open: false, sport: null })}
        title="Xóa môn thể thao"
        description={`Bạn chắc chắn muốn xóa môn thể thao "${deleteConfirm.sport?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
