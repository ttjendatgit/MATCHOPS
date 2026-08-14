"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { BackLink } from "@/components/shared/BackLink";
import { VenueStatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { useParams } from "next/navigation";
import { toast } from "sonner";

interface VenueResponseDto {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  ward: string | null;
  openingTime: string;
  closingTime: string;
  status: string;
}

const timeInputClass =
  "flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-1 focus:ring-offset-[#030303] focus:border-[rgba(255,128,0,0.5)] transition-colors [color-scheme:dark]";

function toApiTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

export default function VenueDetailOwnerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [venue, setVenue] = useState<VenueResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    district: "",
    ward: "",
    address: "",
    openingTime: "06:00",
    closingTime: "22:00",
  });

  const setField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const token = getStoredToken();
    if (!token || !id) return;

    apiFetch<ApiResponse<VenueResponseDto>>(`/owner/venues/${id}`, { token })
      .then(res => {
        setVenue(res.data);
        if (res.data) {
          setFormData({
            name: res.data.name ?? "",
            city: res.data.city ?? "",
            district: res.data.district ?? "",
            ward: res.data.ward ?? "",
            address: res.data.address ?? "",
            openingTime: res.data.openingTime.slice(0, 5),
            closingTime: res.data.closingTime.slice(0, 5),
          });
        }
      })
      .catch(err => {
        toast.error(err instanceof Error ? err.message : "Không thể tải thông tin cơ sở.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    const token = getStoredToken();
    if (!token) {
      toast.error("Phiên đăng nhập đã hết hạn.");
      router.push("/login");
      return;
    }

    if (!formData.name || !formData.city || !formData.district || !formData.address) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    if (formData.openingTime >= formData.closingTime) {
      toast.error("Giờ mở cửa phải nhỏ hơn giờ đóng cửa.");
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      body.append("Name", formData.name);
      body.append("City", formData.city);
      body.append("District", formData.district);
      body.append("Address", formData.address);
      body.append("OpeningTime", toApiTime(formData.openingTime));
      body.append("ClosingTime", toApiTime(formData.closingTime));
      body.append("Ward", formData.ward);
      if (coverImage) body.append("CoverImage", coverImage);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5208/api"}/owner/venues/${id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body,
        },
      );

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Lỗi máy chủ: ${response.status}`);
      }

      const updatedVenue = result.data as VenueResponseDto;
      setVenue(updatedVenue);
      setFormData({
        name: updatedVenue.name ?? "",
        city: updatedVenue.city ?? "",
        district: updatedVenue.district ?? "",
        ward: updatedVenue.ward ?? "",
        address: updatedVenue.address ?? "",
        openingTime: updatedVenue.openingTime.slice(0, 5),
        closingTime: updatedVenue.closingTime.slice(0, 5),
      });
      setCoverImage(null);
      toast.success("Lưu thay đổi thành công.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật cơ sở.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-[#FF8000]" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Không tìm thấy thông tin cơ sở.</p>
        <div className="mt-4 flex justify-center">
          <BackLink href="/owner/venues" label="Quay lại danh sách" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink href="/owner/venues" label="Quay lại danh sách cơ sở" />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#C4C7C9]/50">
        <Link href="/owner/venues" className="hover:text-[#FF8000] transition-colors">
          Cơ sở của tôi
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-white font-medium">{venue.name}</span>
      </nav>

      <PageHeader
        title={venue.name}
        action={
          <div className="flex items-center gap-3">
            <VenueStatusBadge status={venue.status as any} />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/owner/venues/${id}/courts`}>Quản lý sân</Link>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
            <div className="border-b border-[rgba(134,210,50,0.15)] px-6 py-4">
              <h3 className="text-sm font-semibold text-white">Thông tin cơ sở</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Tên cơ sở
                </Label>
                <Input value={formData.name} onChange={(e) => setField("name", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Thành phố
                  </Label>
                  <Input value={formData.city} onChange={(e) => setField("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Quận
                  </Label>
                  <Input value={formData.district} onChange={(e) => setField("district", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Phường / Xã
                </Label>
                <Input value={formData.ward} onChange={(e) => setField("ward", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Địa chỉ
                </Label>
                <Input value={formData.address} onChange={(e) => setField("address", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Giờ mở cửa
                  </Label>
                  <input
                    type="time"
                    className={timeInputClass}
                    value={formData.openingTime}
                    onChange={(e) => setField("openingTime", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Giờ đóng cửa
                  </Label>
                  <input
                    type="time"
                    className={timeInputClass}
                    value={formData.closingTime}
                    onChange={(e) => setField("closingTime", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Ảnh bìa
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
                  className={timeInputClass.replace("h-10", "h-auto py-2")}
                />
                {coverImage && (
                  <p className="text-xs text-[#C4C7C9]/50">Đã chọn: {coverImage.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
            <div className="border-b border-[rgba(134,210,50,0.15)] px-6 py-4">
              <h3 className="text-sm font-semibold text-white">Thao tác nhanh</h3>
            </div>
            <div className="p-4 space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/owner/venues/${id}/courts`}>Quản lý sân</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/owner/venues/${id}/blocks`}>Khoá sân</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/owner/bookings">Xem đặt sân</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
