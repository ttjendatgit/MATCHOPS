import { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";

export const metadata: Metadata = { title: "Thêm sân mới – Owner" };

const fieldClass =
  "flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-1 focus:ring-offset-[#030303] focus:border-[rgba(255,128,0,0.5)] transition-colors";

export default async function NewCourtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#C4C7C9]/50">
        <Link href={`/owner/venues/${id}/courts`} className="hover:text-[#FF8000] transition-colors">
          Danh sách sân
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-white">Thêm mới</span>
      </nav>

      <PageHeader title="Thêm sân mới" />

      <div className="max-w-2xl space-y-6">
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
              <Input placeholder="VD: Sân A1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Loại sân <span className="text-[#FF4B4B]">*</span>
                </Label>
                <Input placeholder="Cầu lông, Tennis, Bóng đá..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Sức chứa
                </Label>
                <Input type="number" placeholder="4" min={1} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                Vị trí / Ghi chú
              </Label>
              <Input placeholder="VD: Tầng 2, khu A" />
            </div>
          </div>
        </div>

        {/* Price rules */}
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
          <Button variant="outline" asChild>
            <Link href={`/owner/venues/${id}/courts`}>Huỷ</Link>
          </Button>
          <Button>Tạo sân</Button>
        </div>
      </div>
    </div>
  );
}
