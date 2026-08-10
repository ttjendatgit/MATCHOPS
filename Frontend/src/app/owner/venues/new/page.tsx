"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { toast } from "sonner";
import { getStoredToken } from "@/lib/auth";
import Link from "next/link";

import OwnerMembershipLimitModal from "@/components/membership/OwnerMembershipLimitModal";

const timeInputClass =
  "flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-1 focus:ring-offset-[#030303] focus:border-[rgba(255,128,0,0.5)] transition-colors [color-scheme:dark]";

const textareaClass =
  "flex min-h-[100px] w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white placeholder:text-[#C4C7C9]/40 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-1 focus:ring-offset-[#030303] focus:border-[rgba(255,128,0,0.5)] transition-colors";

function toApiTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5208/api";

function isOwnerMembershipLimitError(msg: string): boolean {
  return msg.includes("Nâng cấp gói Chủ sân để tiếp tục");
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

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    city: "TP.HCM",
    district: "",
    address: "",
    openingTime: "06:00",
    closingTime: "22:00",
    description: "",
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverImage(file);
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    } else {
      setCoverPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) { toast.error("Vui lòng nhập tên cơ sở."); return; }
    if (!form.city.trim()) { toast.error("Vui lòng nhập tỉnh/thành phố."); return; }
    if (!form.district.trim()) { toast.error("Vui lòng nhập quận/huyện."); return; }
    if (!form.address.trim()) { toast.error("Vui lòng nhập địa chỉ."); return; }

    const token = getStoredToken();
    if (!token) { toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."); return; }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("city", form.city.trim());
    formData.append("district", form.district.trim());
    formData.append("address", form.address.trim());
    formData.append("openingTime", form.openingTime);
    formData.append("closingTime", form.closingTime);
    if (form.description.trim()) formData.append("description", form.description.trim());
    if (coverImage) formData.append("coverImage", coverImage);

    try {
      const response = await fetch(`${API_BASE}/owner/venues`, {
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

      toast.success("Tạo cơ sở thành công. Chờ admin duyệt.");
      router.push("/owner/venues");
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
        type="venue"
      />

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
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
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
                    value={form.name}
                    onChange={set("name")}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                      Tỉnh / Thành phố <span className="text-[#FF4B4B]">*</span>
                    </Label>
                    <Input
                      placeholder="TP.HCM"
                      value={form.city}
                      onChange={set("city")}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                      Quận / Huyện <span className="text-[#FF4B4B]">*</span>
                    </Label>
                    <Input
                      placeholder="Quận 7"
                      value={form.district}
                      onChange={set("district")}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Địa chỉ <span className="text-[#FF4B4B]">*</span>
                  </Label>
                  <Input
                    placeholder="Số nhà, tên đường, phường/xã"
                    value={form.address}
                    onChange={set("address")}
                    required
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
                      value={form.openingTime}
                      onChange={(e) => setForm((p) => ({ ...p, openingTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                      Giờ đóng cửa <span className="text-[#FF4B4B]">*</span>
                    </Label>
                    <input
                      type="time"
                      className={timeInputClass}
                      value={form.closingTime}
                      onChange={(e) => setForm((p) => ({ ...p, closingTime: e.target.value }))}
                      required
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
                    value={form.description}
                    onChange={set("description")}
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
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-[rgba(134,210,50,0.25)] bg-[#141414] text-center cursor-pointer hover:border-[rgba(255,128,0,0.45)] hover:bg-[rgba(255,128,0,0.04)] transition-all overflow-hidden"
                >
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-[#C4C7C9]/30 mb-2" />
                      <p className="text-sm font-medium text-[#C4C7C9]">Tải ảnh lên</p>
                      <p className="text-xs text-[#C4C7C9]/40 mt-1">PNG, JPG tối đa 5MB</p>
                    </>
                  )}
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
            {/* Actions */}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" asChild>
                <Link href="/owner/venues">Huỷ</Link>
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi duyệt"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
