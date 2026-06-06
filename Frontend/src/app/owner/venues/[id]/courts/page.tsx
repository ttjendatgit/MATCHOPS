import { Metadata } from "next";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { CourtStatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";

export const metadata: Metadata = { title: "Quản lý sân – Owner" };

const courts = [
  { id: "1", name: "Sân A1", type: "Cầu lông", capacity: 4, status: "ACTIVE" as const, minPrice: 80000 },
  { id: "2", name: "Sân A2", type: "Cầu lông", capacity: 4, status: "ACTIVE" as const, minPrice: 80000 },
  { id: "3", name: "Sân B1", type: "Tennis",   capacity: 4, status: "MAINTENANCE" as const, minPrice: 150000 },
];

export default async function VenueCourtsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/owner/venues" className="hover:text-primary">Cơ sở</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/owner/venues/${id}`} className="hover:text-primary">Phú Mỹ Hưng</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-900">Sân</span>
      </nav>

      <PageHeader
        title="Danh sách sân"
        action={
          <Button asChild>
            <Link href={`/owner/venues/${id}/courts/new`}><Plus className="h-4 w-4" />Thêm sân</Link>
          </Button>
        }
      />

      <div className="space-y-3">
        {courts.map((court) => (
          <Card key={court.id} className="transition hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-slate-900">{court.name}</p>
                  <CourtStatusBadge status={court.status} />
                </div>
                <p className="text-sm text-slate-500">{court.type} · Sức chứa: {court.capacity} người · từ {(court.minPrice / 1000).toFixed(0)}k/h</p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/owner/venues/${id}/courts/${court.id}`}>Quản lý</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
