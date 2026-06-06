import { Metadata } from "next";
import { ChevronRight, Plus, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Khoá sân – Owner" };

const blocks = [
  { id: "1", courtName: "Sân B1", startDate: "2026-06-10", endDate: "2026-06-12", startTime: "00:00", endTime: "23:59", reason: "Bảo trì định kỳ", status: "ACTIVE" },
];

export default async function CourtBlocksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href={`/owner/venues/${id}`} className="hover:text-primary">Cơ sở</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-900">Khoá sân</span>
      </nav>

      <PageHeader
        title="Khoá sân"
        description="Chặn lịch đặt sân cho các khoảng thời gian bảo trì"
        action={<Button><Plus className="h-4 w-4" />Khoá sân mới</Button>}
      />

      {blocks.length === 0 ? (
        <EmptyState icon={Ban} title="Không có lịch khoá sân" description="Thêm lịch khoá để chặn đặt sân trong thời gian bảo trì." />
      ) : (
        <div className="space-y-3">
          {blocks.map((block) => (
            <Card key={block.id}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 mb-0.5">{block.courtName}</p>
                  <p className="text-sm text-slate-500">{formatDate(block.startDate)} – {formatDate(block.endDate)} · {block.startTime}–{block.endTime}</p>
                  {block.reason && <p className="text-xs text-slate-400 mt-1">{block.reason}</p>}
                </div>
                <Badge variant="warning">Đang khoá</Badge>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5 text-xs shrink-0">Huỷ khoá</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
