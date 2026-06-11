"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { VenueStatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { useParams } from "next/navigation";

interface VenueResponseDto {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  ward: string | null;
  openingTime: string;
  closingTime: string;
  status: string;
}

const timeInputClass =
  "flex h-10 w-full rounded-lg border border-[rgba(134,210,50,0.28)] bg-[#141414] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-1 focus:ring-offset-[#030303] focus:border-[rgba(255,128,0,0.5)] transition-colors [color-scheme:dark]";

export default function VenueDetailOwnerPage() {
  const params = useParams();
  const id = params.id as string;
  const [venue, setVenue] = useState<VenueResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || !id) return;

    apiFetch<ApiResponse<VenueResponseDto>>(`/owner/venues/${id}`, { token })
      .then(res => {
        setVenue(res.data);
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

  if (!venue) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Không tìm thấy thông tin cơ sở.</p>
        <Link href="/owner/venues" className="text-[#FF8000] hover:underline mt-2 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#C4C7C9]/50">
        <Link href="/owner/venues" className="hover:text-[#FF8000] transition-colors">
          Cơ sở của tôi
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-white font-medium">{venue.name}</span>
      </nav>

      <PageHeader
        title={venue.name}
        action={
          <div className="flex items-center gap-3">
            <VenueStatusBadge status={venue.status as any} />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/owner/venues/${id}/courts`}>Quản lý sân</Link>
            </Button>
            <Button size="sm">Lưu thay đổi</Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
            <div className="border-b border-[rgba(134,210,50,0.15)] px-6 py-4">
              <h3 className="text-sm font-semibold text-white">Thông tin cơ sở</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Tên cơ sở
                </Label>
                <Input defaultValue={venue.name} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Thành phố
                  </Label>
                  <Input defaultValue={venue.city} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Quận
                  </Label>
                  <Input defaultValue={venue.district} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                  Địa chỉ
                </Label>
                <Input defaultValue={venue.address} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Giờ mở cửa
                  </Label>
                  <input type="time" className={timeInputClass} defaultValue={venue.openingTime.slice(0, 5)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#C4C7C9] text-xs font-semibold uppercase tracking-wide">
                    Giờ đóng cửa
                  </Label>
                  <input type="time" className={timeInputClass} defaultValue={venue.closingTime.slice(0, 5)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
            <div className="border-b border-[rgba(134,210,50,0.15)] px-6 py-4">
              <h3 className="text-sm font-semibold text-white">Thao tác nhanh</h3>
            </div>
            <div className="p-4 space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/owner/venues/${id}/courts`}>Quản lý sân</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/owner/venues/${id}/blocks`}>Khoá sân</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/owner/bookings">Xem đặt sân</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
