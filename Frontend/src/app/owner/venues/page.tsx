"use client";

import { useEffect, useState } from "react";
import { Metadata } from "next";
import { Plus, MapPin, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VenueStatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";

interface VenueResponseDto {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  openingTime: string;
  closingTime: string;
  status: string;
}

export default function OwnerVenuesPage() {
  const [venues, setVenues] = useState<VenueResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    apiFetch<ApiResponse<VenueResponseDto[]>>("/owner/venues", { token })
      .then(res => {
        setVenues(res.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading tracking-tight">
            Cụm sân
          </h1>
          <p className="mt-1 text-sm text-[#C4C7C9]">
            Quản lý danh sách cụm sân thể thao bạn sở hữu.
          </p>
        </div>
        <Button asChild>
          <Link href="/owner/venues/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo cụm sân mới
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-[#FF8000]" />
        </div>
      ) : (
        <div className="space-y-3">
          {venues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-slate-500">Bạn chưa có cụm sân nào.</p>
            </div>
          ) : (
            venues.map((venue) => (
              <div
                key={venue.id}
                className="group flex items-center gap-5 rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-5 transition-all hover:border-[rgba(255,128,0,0.35)] hover:bg-[#141414]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,128,0,0.1)] border border-[rgba(255,128,0,0.2)]">
                  <MapPin className="h-6 w-6 text-[#FF8000]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="font-semibold text-white">{venue.name}</p>
                    <VenueStatusBadge status={venue.status as any} />
                  </div>
                  <p className="text-sm text-[#C4C7C9] truncate">{venue.address}, {venue.district}, {venue.city}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#C4C7C9]/50">
                    <Clock className="h-3 w-3" />
                    {venue.openingTime}–{venue.closingTime}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/owner/venues/${venue.id}/courts`}>
                      Sân
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/owner/venues/${venue.id}`} className="gap-1.5">
                      Chi tiết
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
