"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";
import { toast } from "sonner";
import { getStoredToken } from "@/lib/auth";

const timeInputClass =
  "flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-1 focus:ring-offset-[#030303] focus:border-[rgba(255,128,0,0.5)] transition-colors [color-scheme:dark]";

const textareaClass =
  "flex min-h-[100px] w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white placeholder:text-[#C4C7C9]/40 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-1 focus:ring-offset-[#030303] focus:border-[rgba(255,128,0,0.5)] transition-colors";

function toApiTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

export default function NewVenuePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    district: "",
    ward: "",
    address: "",
    openingTime: "06:00",
    closingTime: "22:00",
    description: "",
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.city || !formData.district || !formData.address) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    if (formData.openingTime >= formData.closingTime) {
      toast.error("Giờ mở cửa phải nhỏ hơn giờ đóng cửa.");
      return;
    }

    const token = getStoredToken();
    if (!token) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("Name", formData.name);
      body.append("City", formData.city);
      body.append("District", formData.district);
      body.append("Address", formData.address);
      body.append("OpeningTime", toApiTime(formData.openingTime));
      body.append("ClosingTime", toApiTime(formData.closingTime));

      if (formData.ward.trim()) body.append("Ward", formData.ward.trim());
      if (formData.description.trim()) body.append("Description", formData.description.trim());
      if (coverImage) body.append("CoverImage", coverImage);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5208/api"}/owner/venues`,
        {
          method: "POST",
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

      toast.success("Tạo cụm sân thành công.");
      router.push("/owner/venues");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo cụm sân.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#C4C7C9]/50">
        <Link href="/owner/venues" className="hover:text-[#FF8000] transition-colors">
          Cơ sở của tôi
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-white font-medium">Tạo mới</span>
      </nav>

      <PageHeader
        title="Tạo cơ sở mới"
        description="Điền thông tin cơ sở để gửi yêu cầu duyệt"
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
            <div className="border-b border-[rgba(134,210,50,0.15)] px-6 py-4">
              <h3 className="text-sm font-semibold text-white">Thông tin cơ bản</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Tên cơ sở <span className="text-[#FF4B4B]">*</span>
                </Label>
                <Input
                  placeholder="VD: Sân cầu lông Phú Mỹ Hưng"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Tỉnh / Thành phố <span className="text-[#FF4B4B]">*</span>
                  </Label>
                  <Input
                    placeholder="TP.HCM"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Quận / Huyện <span className="text-[#FF4B4B]">*</span>
                  </Label>
                  <Input
                    placeholder="Quận 7"
                    value={formData.district}
                    onChange={(e) => handleChange("district", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Phường / Xã
                </Label>
                <Input
                  placeholder="Phường Tân Phú"
                  value={formData.ward}
                  onChange={(e) => handleChange("ward", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Địa chỉ <span className="text-[#FF4B4B]">*</span>
                </Label>
                <Input
                  placeholder="Số nhà, tên đường, phường/xã"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Giờ mở cửa <span className="text-[#FF4B4B]">*</span>
                  </Label>
                  <input
                    type="time"
                    className={timeInputClass}
                    value={formData.openingTime}
                    onChange={(e) => handleChange("openingTime", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Giờ đóng cửa <span className="text-[#FF4B4B]">*</span>
                  </Label>
                  <input
                    type="time"
                    className={timeInputClass}
                    value={formData.closingTime}
                    onChange={(e) => handleChange("closingTime", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Mô tả
                </Label>
                <textarea
                  className={textareaClass}
                  placeholder="Mô tả cơ sở, tiện ích, lưu ý..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Image upload */}
          <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
            <div className="border-b border-[rgba(134,210,50,0.15)] px-6 py-4">
              <h3 className="text-sm font-semibold text-white">Ảnh bìa</h3>
            </div>
            <div className="p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-40 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-[rgba(134,210,50,0.25)] bg-[#141414] text-center cursor-pointer hover:border-[rgba(255,128,0,0.45)] hover:bg-[rgba(255,128,0,0.04)] transition-all"
              >
                <Upload className="h-8 w-8 text-[#C4C7C9]/30 mb-2" />
                <p className="text-sm font-medium text-[#C4C7C9]">
                  {coverImage ? "Đổi ảnh bìa" : "Tải ảnh lên"}
                </p>
                <p className="text-xs text-[#C4C7C9]/40 mt-1">
                  {coverImage ? coverImage.name : "PNG, JPG tối đa 5MB"}
                </p>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/owner/venues">Huỷ</Link>
            </Button>
            <Button className="flex-1" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Gửi duyệt"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
