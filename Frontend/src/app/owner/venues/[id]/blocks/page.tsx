import { Metadata } from "next";
import { ChevronRight, Plus, Ban, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Khoá sân – Owner" };

const blocks = [
  {
    id: "1",
    courtName: "Sân B1",
    startDate: "2026-06-10",
    endDate: "2026-06-12",
    startTime: "00:00",
    endTime: "23:59",
    reason: "Bảo trì định kỳ",
    status: "ACTIVE",
  },
];

export default async function CourtBlocksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Khoá sân mới
          </Button>
        }
      />

      {blocks.length === 0 ? (
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A]">
          <EmptyState
            icon={Ban}
            title="Không có lịch khoá sân"
            description="Thêm lịch khoá để chặn đặt sân trong thời gian bảo trì."
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
                  {formatDate(block.startDate)} – {formatDate(block.endDate)} · {block.startTime}–{block.endTime}
                </p>
                {block.reason && (
                  <p className="text-xs text-[#C4C7C9]/50 mt-1">{block.reason}</p>
                )}
              </div>
              <Badge variant="warning">Đang khoá</Badge>
              <Button
                size="sm"
                variant="destructive"
                className="text-xs shrink-0"
              >
                Huỷ khoá
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
