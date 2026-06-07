import { Metadata } from "next";
import { Plus, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VenueStatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";

export const metadata: Metadata = { title: "Cụm sân – Owner | MatchOps" };

const mockVenues = [
  {
    id: "1",
    name: "Sân cầu lông Phú Mỹ Hưng",
    address: "12 Nguyễn Lương Bằng, Quận 7, TP.HCM",
    openingTime: "06:00",
    closingTime: "22:00",
    courtCount: 6,
    status: "ACTIVE" as const,
  },
  {
    id: "2",
    name: "SportHub Bình Thạnh",
    address: "55 Phan Văn Trị, Bình Thạnh, TP.HCM",
    openingTime: "05:30",
    closingTime: "23:00",
    courtCount: 4,
    status: "PENDING_APPROVAL" as const,
  },
  {
    id: "3",
    name: "Arena Gò Vấp",
    address: "88 Quang Trung, Gò Vấp, TP.HCM",
    openingTime: "06:00",
    closingTime: "21:00",
    courtCount: 0,
    status: "DRAFT" as const,
  },
];

export default function OwnerVenuesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">
            Cụm sân
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Quản lý danh sách cụm sân thể thao bạn sở hữu.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/owner/venues/new">
            <Plus className="h-4 w-4" />
            Tạo cụm sân mới
          </Link>
        </Button>
      </div>

      {/* Placeholder note */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-xs text-amber-400/80">
          Quản lý đầy đủ CRUD sẽ triển khai ở phase tiếp theo. Dữ liệu hiện là
          mock.
        </p>
      </div>

      {/* Venue list */}
      <div className="space-y-3">
        {mockVenues.map((venue) => (
          <div
            key={venue.id}
            className="flex items-center gap-5 rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className="font-semibold text-white">{venue.name}</p>
                <VenueStatusBadge status={venue.status} />
              </div>
              <p className="text-sm text-slate-500 truncate">{venue.address}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                <Clock className="h-3 w-3" />
                {venue.openingTime}–{venue.closingTime}
                {venue.courtCount > 0 && ` · ${venue.courtCount} sân`}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {venue.courtCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                  asChild
                >
                  <Link href={`/owner/venues/${venue.id}/courts`}>
                    Sân ({venue.courtCount})
                  </Link>
                </Button>
              )}
              <Button size="sm" asChild>
                <Link href={`/owner/venues/${venue.id}`}>Quản lý</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
