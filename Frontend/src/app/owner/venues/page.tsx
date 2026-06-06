import { Metadata } from "next";
import { Plus, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { VenueStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Building2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Cơ sở của tôi – Owner" };

const mockVenues = [
  { id: "1", name: "Sân cầu lông Phú Mỹ Hưng", address: "12 Nguyễn Lương Bằng, Quận 7, TP.HCM", openingTime: "06:00", closingTime: "22:00", courtCount: 6, status: "ACTIVE" as const },
  { id: "2", name: "SportHub Bình Thạnh", address: "55 Phan Văn Trị, Bình Thạnh, TP.HCM", openingTime: "05:30", closingTime: "23:00", courtCount: 4, status: "PENDING_APPROVAL" as const },
];

export default function OwnerVenuesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cơ sở của tôi"
        description="Quản lý danh sách cơ sở thể thao bạn sở hữu"
        action={
          <Button asChild>
            <Link href="/owner/venues/new"><Plus className="h-4 w-4" />Thêm cơ sở</Link>
          </Button>
        }
      />

      {mockVenues.length === 0 ? (
        <EmptyState icon={Building2} title="Bạn chưa có cơ sở nào" description="Tạo cơ sở đầu tiên để bắt đầu nhận đặt sân." action={{ label: "Tạo cơ sở", onClick: () => {} }} />
      ) : (
        <div className="space-y-4">
          {mockVenues.map((venue) => (
            <Card key={venue.id} className="transition hover:shadow-md">
              <CardContent className="flex items-center gap-5 p-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <MapPin className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-slate-900">{venue.name}</p>
                    <VenueStatusBadge status={venue.status} />
                  </div>
                  <p className="text-sm text-slate-500 truncate">{venue.address}</p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />{venue.openingTime}–{venue.closingTime} · {venue.courtCount} sân
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/owner/venues/${venue.id}/courts`}>Sân ({venue.courtCount})</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/owner/venues/${venue.id}`}>Quản lý</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
