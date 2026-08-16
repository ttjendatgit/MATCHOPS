"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { BookingStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { exportBookingsCsv } from "@/lib/exportReports";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { toast } from "sonner";
import type { BookingStatus } from "@/types/booking";
import type { ApiResponse } from "@/types/api";

interface BookingResponseDto {
  id: string;
  venueName: string;
  courtName: string;
  customerName: string | null;
  customerPhone: string | null;
  userEmail?: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  bookingSource?: string;
  bookingType?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  MATCHOP: "MATCHOP",
  ZALO: "Zalo",
  FACEBOOK: "Facebook",
  PHONE: "Điện thoại",
  DIRECT: "Trực tiếp",
  OTHER: "Khác",
};

function resolveCustomer(b: BookingResponseDto) {
  const name = b.customerName?.trim() || b.userEmail?.trim() || null;
  const phone = b.customerPhone?.trim() || "—";
  return { name: name ?? "—", phone };
}

const PAYMENT_LABELS: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  REFUNDED: "Hoàn tiền",
};

function sourceBadgeClass(source: string) {
  switch (source) {
    case "ZALO":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    case "FACEBOOK":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-300";
    case "PHONE":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "DIRECT":
      return "border-[#FF8000]/30 bg-[#FF8000]/10 text-[#FF8000]";
    case "OTHER":
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
    default:
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }
}

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadBookings = () => {
    const token = getStoredToken();
    if (!token) return;

    apiFetch<ApiResponse<BookingResponseDto[]>>("/owner/bookings", { token })
      .then((res) => setBookings(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleExport = () => {
    const ok = exportBookingsCsv(bookings, "owner-bookings");
    if (ok) toast.success("Xuất báo cáo lịch đặt thành công.");
    else toast.error("Không có dữ liệu để xuất.");
  };

  const handleConfirmBooking = async (id: string) => {
    const token = getStoredToken();
    if (!token) return;
    setActionLoading(id);
    try {
      await apiFetch(`/owner/bookings/${id}/confirm`, { method: "PATCH", token });
      toast.success("Xác nhận booking thành công!");
      loadBookings();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteBooking = async (id: string) => {
    const token = getStoredToken();
    if (!token) return;
    setActionLoading(id);
    try {
      await apiFetch(`/owner/bookings/${id}/complete`, { method: "PATCH", token });
      toast.success("Hoàn thành booking thành công!");
      loadBookings();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (id: string) => {
    const token = getStoredToken();
    if (!token) return;
    setActionLoading(id);
    try {
      await apiFetch(`/owner/bookings/${id}/cancel`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ reason: "Hủy bởi chủ sân" }),
      });
      toast.success("Hủy booking thành công!");
      loadBookings();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading tracking-tight">Lịch đặt</h1>
          <p className="mt-1 text-sm text-[#C4C7C9]">
            Tất cả đơn đặt sân — MATCHOP, Zalo, Facebook và các nguồn khác.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-[rgba(134,210,50,0.2)] bg-[#141414] text-white"
          onClick={handleExport}
          disabled={bookings.length === 0}
        >
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-[#FF8000]" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(134,210,50,0.15)] bg-[#141414]">
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/50">
                    Khách hàng
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/50">
                    Nguồn
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
                  <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/50">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                      Không có đơn đặt sân nào.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b, i) => {
                    const source = b.bookingSource ?? "MATCHOP";
                    const customer = resolveCustomer(b);

                    return (
                      <tr
                        key={b.id}
                        className={`transition-colors hover:bg-[#141414] ${
                          i < bookings.length - 1 ? "border-b border-[rgba(134,210,50,0.1)]" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">{customer.name}</p>
                          <p className="text-xs text-[#C4C7C9]/50">{customer.phone}</p>
                          <p className="mt-1 text-[10px] text-[#C4C7C9]/40">
                            {PAYMENT_LABELS[b.paymentStatus] ?? b.paymentStatus}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className={sourceBadgeClass(source)}>
                            {SOURCE_LABELS[source] ?? source}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#86D232]">{b.courtName}</p>
                          <p className="max-w-[160px] truncate text-xs text-[#C4C7C9]/60">{b.venueName}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-white">{b.bookingDate}</p>
                          <p className="text-xs text-[#C4C7C9]/60">
                            {b.startTime.slice(0, 5)} – {b.endTime.slice(0, 5)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <BookingStatusBadge status={b.status as BookingStatus} />
                        </td>
                        <td className="px-5 py-4 text-right font-bold tabular-nums text-[#FF8000]">
                          {formatCurrency(b.totalPrice)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {b.status === "PENDING_PAYMENT" && (
                              <Button
                                size="sm"
                                onClick={() => handleConfirmBooking(b.id)}
                                disabled={actionLoading === b.id}
                                className="bg-[#86D232] hover:bg-[#86D232]/85"
                              >
                                Xác nhận
                              </Button>
                            )}
                            {b.status === "CONFIRMED" && (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteBooking(b.id)}
                                disabled={actionLoading === b.id}
                                className="bg-[#FF8000] hover:bg-[#FF8000]/85"
                              >
                                Hoàn thành
                              </Button>
                            )}
                            {["PENDING_PAYMENT", "CONFIRMED"].includes(b.status) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelBooking(b.id)}
                                disabled={actionLoading === b.id}
                              >
                                Hủy
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
