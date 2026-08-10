"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Plus, Ban, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { toast } from "sonner";

interface CourtDto {
  id: string;
  venueId: string;
  name: string;
}

interface CourtBlockDto {
  id: string;
  venueId: string;
  courtId: string;
  courtName: string;
  venueName: string;
  blockDate: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  status: string;
}

export default function CourtBlocksPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [courts, setCourts] = useState<CourtDto[]>([]);
  const [blocks, setBlocks] = useState<CourtBlockDto[]>([]);
  const [formData, setFormData] = useState({
    courtId: "",
    blockDate: "",
    startTime: "06:00",
    endTime: "07:00",
    reason: "",
  });

  const venueCourts = useMemo(() => courts.filter((court) => court.venueId === id), [courts, id]);

  const loadData = async () => {
    const token = getStoredToken();
    if (!token) {
      toast.error("Phiên đăng nhập đã hết hạn.");
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const [courtsRes, blocksRes] = await Promise.all([
        apiFetch<ApiResponse<CourtDto[]>>("/owner/courts", { token }),
        apiFetch<ApiResponse<CourtBlockDto[]>>(`/owner/court-blocks?venueId=${id}`, { token }),
      ]);

      const loadedCourts = courtsRes.data ?? [];
      const filteredCourts = loadedCourts.filter((court) => court.venueId === id);

      setCourts(loadedCourts);
      setBlocks((blocksRes.data ?? []).filter((block) => block.venueId === id));
      setFormData((prev) => ({
        ...prev,
        courtId: prev.courtId || filteredCourts[0]?.id || "",
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải danh sách khóa sân.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) return;

    if (!formData.courtId || !formData.blockDate) {
      toast.error("Vui lòng chọn sân và ngày khóa.");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/owner/court-blocks", {
        method: "POST",
        token,
        body: JSON.stringify({
          courtId: formData.courtId,
          blockDate: formData.blockDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          reason: formData.reason || null,
        }),
      });

      toast.success("Khóa sân thành công.");
      setShowForm(false);
      setFormData({
        courtId: venueCourts[0]?.id || "",
        blockDate: "",
        startTime: "06:00",
        endTime: "07:00",
        reason: "",
      });
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể khóa sân.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBlock = async (blockId: string) => {
    const token = getStoredToken();
    if (!token) return;

    setCancellingId(blockId);
    try {
      await apiFetch(`/owner/court-blocks/${blockId}/cancel`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ reason: "Hủy khóa từ giao diện chủ sân" }),
      });
      toast.success("Hủy khóa sân thành công.");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể hủy khóa sân.");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#C4C7C9]/50">
        <Link href={`/owner/venues/${id}`} className="hover:text-[#FF8000] transition-colors">
          Cơ sở
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-white">Khoá sân</span>
      </nav>

      <PageHeader
        title="Khoá sân"
        description="Chặn lịch đặt sân cho các khoảng thời gian bảo trì"
        action={
          <Button className="gap-2" onClick={() => setShowForm((prev) => !prev)} disabled={venueCourts.length === 0}>
            <Plus className="h-4 w-4" />
            {showForm ? "Đóng form" : "Khoá sân mới"}
          </Button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleCreateBlock}
          className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]">
                Sân
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white"
                value={formData.courtId}
                onChange={(e) => setFormData((prev) => ({ ...prev, courtId: e.target.value }))}
              >
                {venueCourts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]">
                Ngày khóa
              </label>
              <input
                type="date"
                className="flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white [color-scheme:dark]"
                value={formData.blockDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, blockDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]">
                Từ giờ
              </label>
              <input
                type="time"
                className="flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white [color-scheme:dark]"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]">
                Đến giờ
              </label>
              <input
                type="time"
                className="flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white [color-scheme:dark]"
                value={formData.endTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]">
              Lý do
            </label>
            <input
              type="text"
              className="flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white"
              value={formData.reason}
              onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Bảo trì, sự kiện nội bộ..."
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Tạo lịch khóa"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Hủy
            </Button>
          </div>
        </form>
      )}

      {blocks.length === 0 ? (
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A]">
          <EmptyState
            icon={Ban}
            title="Không có lịch khoá sân"
            description="Thêm lịch khoá để chặn đặt sân trong thời gian bảo trì."
            action={
              venueCourts.length > 0
                ? {
                    label: "Tạo lịch khóa",
                    onClick: () => setShowForm(true),
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="flex items-center gap-4 rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5 transition-all hover:bg-[#141414]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(255,75,75,0.08)] border border-[rgba(255,75,75,0.2)]">
                <Lock className="h-5 w-5 text-[#FF4B4B]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white mb-0.5">{block.courtName}</p>
                <p className="text-sm text-[#C4C7C9]/70">
                  {formatDate(block.blockDate)} · {block.startTime}–{block.endTime}
                </p>
                {block.reason && (
                  <p className="text-xs text-[#C4C7C9]/50 mt-1">{block.reason}</p>
                )}
              </div>
              <Badge variant={block.status === "ACTIVE" ? "warning" : "secondary"}>
                {block.status === "ACTIVE" ? "Đang khoá" : "Đã hủy"}
              </Badge>
              <Button
                size="sm"
                variant="destructive"
                className="text-xs shrink-0"
                disabled={block.status !== "ACTIVE" || cancellingId === block.id}
                onClick={() => handleCancelBlock(block.id)}
              >
                {cancellingId === block.id ? "Đang hủy..." : "Huỷ khoá"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
