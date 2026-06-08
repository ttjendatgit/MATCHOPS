import { Metadata } from "next";
import { ChevronRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";

export const metadata: Metadata = { title: "Tạo cơ sở mới – Owner" };

const timeInputClass =
  "flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-1 focus:ring-offset-[#030303] focus:border-[rgba(255,128,0,0.5)] transition-colors [color-scheme:dark]";

const textareaClass =
  "flex min-h-[100px] w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white placeholder:text-[#C4C7C9]/40 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-1 focus:ring-offset-[#030303] focus:border-[rgba(255,128,0,0.5)] transition-colors";

export default function NewVenuePage() {
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
                <Input placeholder="VD: Sân cầu lông Phú Mỹ Hưng" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Tỉnh / Thành phố <span className="text-[#FF4B4B]">*</span>
                  </Label>
                  <Input placeholder="TP.HCM" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Quận / Huyện <span className="text-[#FF4B4B]">*</span>
                  </Label>
                  <Input placeholder="Quận 7" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Địa chỉ <span className="text-[#FF4B4B]">*</span>
                </Label>
                <Input placeholder="Số nhà, tên đường, phường/xã" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Giờ mở cửa <span className="text-[#FF4B4B]">*</span>
                  </Label>
                  <input type="time" className={timeInputClass} defaultValue="06:00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Giờ đóng cửa <span className="text-[#FF4B4B]">*</span>
                  </Label>
                  <input type="time" className={timeInputClass} defaultValue="22:00" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Mô tả
                </Label>
                <textarea
                  className={textareaClass}
                  placeholder="Mô tả cơ sở, tiện ích, lưu ý..."
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
              <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[rgba(134,210,50,0.25)] bg-[#141414] text-center cursor-pointer hover:border-[rgba(255,128,0,0.45)] hover:bg-[rgba(255,128,0,0.04)] transition-all">
                <Upload className="h-8 w-8 text-[#C4C7C9]/30 mb-2" />
                <p className="text-sm font-medium text-[#C4C7C9]">Tải ảnh lên</p>
                <p className="text-xs text-[#C4C7C9]/40 mt-1">PNG, JPG tối đa 5MB</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/owner/venues">Huỷ</Link>
            </Button>
            <Button className="flex-1">Gửi duyệt</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
