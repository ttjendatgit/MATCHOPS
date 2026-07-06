"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import Link from "next/link";
import OwnerMembershipLimitModal from "@/components/membership/OwnerMembershipLimitModal";

interface Sport {
  id: string;
  name: string;
}

const fieldClass =
  "flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-1 focus:ring-offset-[#030303] focus:border-[rgba(255,128,0,0.5)] transition-colors";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5208/api";

function isOwnerMembershipLimitError(msg: string): boolean {
  return msg.includes("Nâng cấp gói Chủ sân để tiếp tục");
}

export default function NewCourtPage() {
  const params = useParams();
  const venueId = params.id as string;
  const router = useRouter();

  const [sports, setSports] = useState<Sport[]>([]);
  const [form, setForm] = useState({
    name: "",
    sportId: "",
    type: "",
    capacity: "",
    locationNote: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);

  useEffect(() => {
    apiFetch<ApiResponse<Sport[]>>("/sports")
      .then((res) => setSports(res.data || []))
      .catch(() => {});
  }, []);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) { toast.error("Vui lòng nhập tên sân."); return; }
    if (!form.sportId) { toast.error("Vui lòng chọn môn thể thao."); return; }

    const token = getStoredToken();
    if (!token) { toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."); return; }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("venueId", venueId);
    formData.append("sportId", form.sportId);
    formData.append("name", form.name.trim());
    if (form.type.trim()) formData.append("type", form.type.trim());
    if (form.capacity) formData.append("capacity", form.capacity);
    if (form.locationNote.trim()) formData.append("locationNote", form.locationNote.trim());

    try {
      const response = await fetch(`${API_BASE}/owner/courts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message: string = body?.message ?? `Lỗi máy chủ: ${response.status}`;
        if (isOwnerMembershipLimitError(message)) {
          setUpgradeModal(true);
        } else {
          toast.error(message);
        }
        return;
      }

      toast.success("Tạo sân thành công.");
      router.push(`/owner/venues/${venueId}/courts`);
    } catch {
      toast.error("Đã xảy ra lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <OwnerMembershipLimitModal
        open={upgradeModal}
        onOpenChange={setUpgradeModal}
        type="court"
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#C4C7C9]/50">
        <Link
          href={`/owner/venues/${venueId}/courts`}
          className="hover:text-[#FF8000] transition-colors"
        >
          Danh sách sân
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-white">Thêm mới</span>
      </nav>

      <PageHeader title="Thêm sân mới" />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Court info */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
          <div className="border-b border-[rgba(134,210,50,0.15)] px-6 py-4">
            <h3 className="text-sm font-semibold text-white">Thông tin sân</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                Tên sân <span className="text-[#FF4B4B]">*</span>
              </Label>
              <Input
                placeholder="VD: Sân A1"
                value={form.name}
                onChange={set("name")}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Môn thể thao <span className="text-[#FF4B4B]">*</span>
                </Label>
                <select
                  className={fieldClass + " [color-scheme:dark]"}
                  value={form.sportId}
                  onChange={set("sportId")}
                  required
                >
                  <option value="">Chọn môn thể thao</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Loại sân
                </Label>
                <Input
                  placeholder="VD: Sân trong nhà, ngoài trời"
                  value={form.type}
                  onChange={set("type")}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Sức chứa
                </Label>
                <Input
                  type="number"
                  placeholder="4"
                  min={1}
                  value={form.capacity}
                  onChange={set("capacity")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Vị trí / Ghi chú
                </Label>
                <Input
                  placeholder="VD: Tầng 2, khu A"
                  value={form.locationNote}
                  onChange={set("locationNote")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Price rules — UI placeholder, not yet connected to API */}
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
          <div className="border-b border-[rgba(134,210,50,0.15)] px-6 py-4">
            <h3 className="text-sm font-semibold text-white">Quy tắc giá</h3>
          </div>
          <div className="p-6">
            <div className="grid gap-3 sm:grid-cols-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Loại ngày
                </Label>
                <select className={fieldClass + " [color-scheme:dark]"}>
                  <option value="ALL">Tất cả</option>
                  <option value="WEEKDAY">Ngày thường</option>
                  <option value="WEEKEND">Cuối tuần</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Từ giờ
                </Label>
                <input
                  type="time"
                  className={fieldClass + " [color-scheme:dark]"}
                  defaultValue="06:00"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Đến giờ
                </Label>
                <input
                  type="time"
                  className={fieldClass + " [color-scheme:dark]"}
                  defaultValue="22:00"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Giá/giờ (đ)
                </Label>
                <Input type="number" placeholder="80000" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/owner/venues/${venueId}/courts`}>Huỷ</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tạo sân"}
          </Button>
        </div>
      </form>
    </div>
  );
}
