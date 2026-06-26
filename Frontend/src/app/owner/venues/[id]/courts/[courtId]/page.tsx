"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronRight, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { toast } from "sonner";

interface CourtDto {
  id: string;
  venueId: string;
  venueName: string;
  sportId: string;
  sportName: string;
  name: string;
  type: string | null;
  capacity: number | null;
  locationNote: string | null;
  description: string | null;
  status: string;
}

interface SportDto {
  id: string;
  name: string;
}

interface PriceRuleDto {
  id: string;
  dayType: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  status: string;
}

function formatDayType(dayType: string): string {
  switch (dayType) {
    case "ALL":
      return "Tất cả";
    case "WEEKDAY":
      return "Ngày thường";
    case "WEEKEND":
      return "Cuối tuần";
    default:
      return dayType;
  }
}

export default function CourtDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const courtId = params.courtId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [court, setCourt] = useState<CourtDto | null>(null);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [priceRules, setPriceRules] = useState<PriceRuleDto[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    sportId: "",
    type: "",
    capacity: "",
    locationNote: "",
    description: "",
  });

  useEffect(() => {
    const token = getStoredToken();
    if (!token || !courtId) return;

    Promise.all([
      apiFetch<ApiResponse<CourtDto>>(`/owner/courts/${courtId}`, { token }),
      apiFetch<ApiResponse<SportDto[]>>("/sports"),
      apiFetch<ApiResponse<PriceRuleDto[]>>(`/owner/courts/${courtId}/price-rules`, { token }),
    ])
      .then(([courtRes, sportsRes, rulesRes]) => {
        const loadedCourt = courtRes.data;
        setCourt(loadedCourt);
        setSports(sportsRes.data ?? []);
        setPriceRules(rulesRes.data ?? []);
        if (loadedCourt) {
          setFormData({
            name: loadedCourt.name ?? "",
            sportId: loadedCourt.sportId ?? "",
            type: loadedCourt.type ?? "",
            capacity: loadedCourt.capacity?.toString() ?? "",
            locationNote: loadedCourt.locationNote ?? "",
            description: loadedCourt.description ?? "",
          });
        }
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Không thể tải thông tin sân.");
      })
      .finally(() => setLoading(false));
  }, [courtId]);

  const title = useMemo(() => formData.name || court?.name || "Chi tiết sân", [formData.name, court?.name]);

  const handleSave = async () => {
    const token = getStoredToken();
    if (!token) {
      toast.error("Phiên đăng nhập đã hết hạn.");
      router.push("/login");
      return;
    }

    if (!formData.name || !formData.sportId) {
      toast.error("Vui lòng nhập tên sân và chọn môn thể thao.");
      return;
    }

    const payload: Record<string, string | number | null> = {};

    if (court?.name !== formData.name) {
      payload.name = formData.name;
    }
    if (court?.sportId !== formData.sportId) {
      payload.sportId = formData.sportId;
    }
    if ((court?.type ?? "") !== formData.type) {
      payload.type = formData.type || null;
    }

    const currentCapacity = court?.capacity?.toString() ?? "";
    if (currentCapacity !== formData.capacity) {
      payload.capacity = formData.capacity ? Number(formData.capacity) : null;
    }
    if ((court?.locationNote ?? "") !== formData.locationNote) {
      payload.locationNote = formData.locationNote || null;
    }
    if ((court?.description ?? "") !== formData.description) {
      payload.description = formData.description || null;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("Chưa có thay đổi nào để lưu.");
      return;
    }

    setSaving(true);
    try {
      const result = await apiFetch<ApiResponse<CourtDto>>(`/owner/courts/${courtId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(payload),
      });

      if (result.data) {
        setCourt(result.data);
      }
      toast.success("Cập nhật sân thành công.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật sân.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  if (!court) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400">Không tìm thấy thông tin sân.</p>
        <Link href={`/owner/venues/${id}/courts`} className="mt-2 inline-block text-[#FF8000] hover:underline">
          Quay lại danh sách sân
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#C4C7C9]/50">
        <Link href={`/owner/venues/${id}/courts`} className="hover:text-[#FF8000] transition-colors">
          Danh sách sân
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-white">{title}</span>
      </nav>

      <PageHeader
        title={title}
        action={
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        }
      />

      <div className="max-w-2xl space-y-6">
        {/* Court info */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
          <div className="border-b border-[rgba(134,210,50,0.15)] px-6 py-4">
            <h3 className="text-sm font-semibold text-white">Thông tin sân</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                Tên sân
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Loại sân
                </Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-1 focus:ring-offset-[#030303] focus:border-[rgba(255,128,0,0.5)] transition-colors"
                  value={formData.sportId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sportId: e.target.value }))}
                >
                  {sports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Sức chứa
                </Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Kiểu sân
                </Label>
                <Input
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Vị trí
                </Label>
                <Input
                  value={formData.locationNote}
                  onChange={(e) => setFormData((prev) => ({ ...prev, locationNote: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                Mô tả
              </Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Price rules */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
          <div className="border-b border-[rgba(134,210,50,0.15)] px-6 py-4">
            <h3 className="text-sm font-semibold text-white">Quy tắc giá hiện tại</h3>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {priceRules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[rgba(255,128,0,0.28)] bg-[rgba(255,128,0,0.04)] p-4">
                  <p className="text-sm text-[#C4C7C9]/70">Sân này chưa có quy tắc giá.</p>
                  <p className="mt-1 text-xs text-[#C4C7C9]/45">
                    Bạn cần tạo ít nhất một khung giá để sân có thể áp dụng bảng giá.
                  </p>
                  <Button className="mt-4" size="sm" asChild>
                    <Link href={`/owner/pricing?courtId=${courtId}`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm quy tắc giá
                    </Link>
                  </Button>
                </div>
              ) : priceRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-lg border border-[rgba(134,210,50,0.15)] bg-[#141414] px-4 py-3 text-sm"
                >
                  <span className="text-[#C4C7C9]">
                    {formatDayType(rule.dayType)} · {rule.startTime.slice(0, 5)}–{rule.endTime.slice(0, 5)}
                  </span>
                  <span className="font-bold text-[#86D232]">
                    {(rule.pricePerHour / 1000).toFixed(0)}k/h
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
