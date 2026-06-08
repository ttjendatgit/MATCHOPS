import { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";

export const metadata: Metadata = { title: "Quản lý sân – Owner" };

const priceRules = [
  { dayType: "Tất cả",     start: "06:00", end: "17:00", price: 80000  },
  { dayType: "Cuối tuần",  start: "17:00", end: "22:00", price: 120000 },
];

export default async function CourtDetailPage({ params }: { params: Promise<{ id: string; courtId: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#C4C7C9]/50">
        <Link href={`/owner/venues/${id}/courts`} className="hover:text-[#FF8000] transition-colors">
          Danh sách sân
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-white">Sân A1</span>
      </nav>

      <PageHeader
        title="Sân A1"
        action={<Button size="sm">Lưu thay đổi</Button>}
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
              <Input defaultValue="Sân A1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Loại sân
                </Label>
                <Input defaultValue="Cầu lông" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Sức chứa
                </Label>
                <Input type="number" defaultValue={4} />
              </div>
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
              {priceRules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-[rgba(134,210,50,0.15)] bg-[#141414] px-4 py-3 text-sm"
                >
                  <span className="text-[#C4C7C9]">
                    {rule.dayType} · {rule.start}–{rule.end}
                  </span>
                  <span className="font-bold text-[#86D232]">
                    {(rule.price / 1000).toFixed(0)}k/h
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
