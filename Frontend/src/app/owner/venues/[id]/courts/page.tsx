"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Plus, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { CourtStatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { useParams } from "next/navigation";

interface CourtResponseDto {
  id: string;
  name: string;
  sportName: string;
  capacity: number;
  status: string;
}

interface VenueResponseDto {
  id: string;
  name: string;
}

export default function VenueCourtsPage() {
  const params = useParams();
  const id = params.id as string;
  const [courts, setCourts] = useState<CourtResponseDto[]>([]);
  const [venue, setVenue] = useState<VenueResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || !id) return;

    Promise.all([
      apiFetch<ApiResponse<VenueResponseDto>>(`/owner/venues/${id}`, { token }),
      apiFetch<ApiResponse<CourtResponseDto[]>>(`/venues/${id}/courts`)
    ])
      .then(([venueRes, courtsRes]) => {
        setVenue(venueRes.data);
        setCourts(courtsRes.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-[#FF8000]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#C4C7C9]/50">
        <Link href="/owner/venues" className="hover:text-[#FF8000] transition-colors">Cơ sở</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/owner/venues/${id}`} className="hover:text-[#FF8000] transition-colors">{venue?.name || "Chi tiết"}</Link>
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
        {courts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
            <p className="text-slate-500">Cơ sở này chưa có sân nào.</p>
          </div>
        ) : (
          courts.map((court) => (
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
                  <CourtStatusBadge status={court.status as any} />
                </div>
                <p className="text-sm text-[#C4C7C9]/70">
                  {court.sportName} · Sức chứa: {court.capacity} người
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/owner/venues/${id}/courts/${court.id}`}>Quản lý</Link>
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
