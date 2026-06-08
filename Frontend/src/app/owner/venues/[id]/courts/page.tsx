import { Metadata } from "next";
import { ChevronRight, Plus, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { CourtStatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";

export const metadata: Metadata = { title: "Quản lý sân – Owner" };

const courts = [
  { id: "1", name: "Sân A1", type: "Cầu lông",  capacity: 4, status: "ACTIVE" as const,      minPrice: 80000  },
  { id: "2", name: "Sân A2", type: "Cầu lông",  capacity: 4, status: "ACTIVE" as const,      minPrice: 80000  },
  { id: "3", name: "Sân B1", type: "Tennis",    capacity: 4, status: "MAINTENANCE" as const, minPrice: 150000 },
];

export default async function VenueCourtsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#C4C7C9]/50">
        <Link href="/owner/venues" className="hover:text-[#FF8000] transition-colors">Cơ sở</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/owner/venues/${id}`} className="hover:text-[#FF8000] transition-colors">Phú Mỹ Hưng</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-white">Sân</span>
      </nav>

      <PageHeader
        title="Danh sách sân"
        action={
          <Button asChild>
            <Link href={`/owner/venues/${id}/courts/new`} className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm sân
            </Link>
          </Button>
        }
      />

      <div className="space-y-3">
        {courts.map((court) => (
          <div
            key={court.id}
            className="flex items-center gap-4 rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5 transition-all hover:border-[rgba(255,128,0,0.3)] hover:bg-[#141414]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(134,210,50,0.1)] border border-[rgba(134,210,50,0.2)]">
              <Dumbbell className="h-5 w-5 text-[#86D232]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-white">{court.name}</p>
                <CourtStatusBadge status={court.status} />
              </div>
              <p className="text-sm text-[#C4C7C9]/70">
                {court.type} · Sức chứa: {court.capacity} người ·{" "}
                <span className="text-[#FF8000] font-semibold">
                  từ {(court.minPrice / 1000).toFixed(0)}k/h
                </span>
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/owner/venues/${id}/courts/${court.id}`}>Quản lý</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
