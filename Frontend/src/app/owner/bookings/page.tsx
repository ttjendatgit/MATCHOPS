"use client";

import { useEffect, useState } from "react";
import { Metadata } from "next";
import { BookingStatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { BookingStatus } from "@/types/booking";
import type { ApiResponse } from "@/types/api";

interface BookingResponseDto {
  id: string;
  venueName: string;
  courtName: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
}

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    apiFetch<ApiResponse<BookingResponseDto[]>>("/owner/bookings", { token })
      .then(res => {
        setBookings(res.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-heading tracking-tight">
          Lịch đặt
        </h1>
        <p className="mt-1 text-sm text-[#C4C7C9]">
          Tất cả đơn đặt sân từ các cụm sân của bạn.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-[#FF8000]" />
        </div>
      ) : (
        <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(134,210,50,0.15)] bg-[#141414]">
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/50">
                    Khách hàng
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/50">
                    Sân / Cụm
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/50">
                    Thời gian
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/50">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/50">
                    Tổng tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                      Không có đơn đặt sân nào.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b, i) => (
                    <tr
                      key={b.id}
                      className={`transition-colors hover:bg-[#141414] ${
                        i < bookings.length - 1
                          ? "border-b border-[rgba(134,210,50,0.1)]"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{b.customerName || "Khách vãng lai"}</p>
                        <p className="text-xs text-[#C4C7C9]/50">{b.customerPhone || "N/A"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#86D232]">{b.courtName}</p>
                        <p className="max-w-[160px] truncate text-xs text-[#C4C7C9]/60">
                          {b.venueName}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">{b.bookingDate}</p>
                        <p className="text-xs text-[#C4C7C9]/60">{b.startTime.slice(0, 5)} – {b.endTime.slice(0, 5)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <BookingStatusBadge status={b.status as BookingStatus} />
                      </td>
                      <td className="px-5 py-4 text-right font-bold tabular-nums text-[#FF8000]">
                        {formatCurrency(b.totalPrice)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
