"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { BookingResponseDto } from "@/types/booking";

const statusVariant: Record<string, any> = {
  PENDING_PAYMENT: "secondary",
  CONFIRMED: "success",
  COMPLETED: "outline",
  CANCELLED_BY_USER: "destructive",
  CANCELLED_BY_OWNER: "destructive",
  CANCELLED_BY_ADMIN: "destructive",
  EXPIRED: "outline",
  NO_SHOW: "destructive",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const loadBookings = async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await apiFetch<ApiResponse<BookingResponseDto[]>>("/admin/bookings", { token });
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (booking: BookingResponseDto) => {
    setConfirmDialog({
      open: true,
      title: "Hủy đặt sân",
      description: `Bạn chắc chắn muốn hủy đặt sân ${booking.venueName} - ${booking.courtName}?`,
      onConfirm: async () => {
        try {
          await apiFetch(`/admin/bookings/${booking.id}/cancel`, {
            method: "PATCH",
            token: getStoredToken(),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: "Hủy bởi quản trị viên" }),
          });
          loadBookings();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const handleConfirm = (booking: BookingResponseDto) => {
    setConfirmDialog({
      open: true,
      title: "Xác nhận đặt sân",
      description: `Bạn chắc chắn muốn xác nhận đặt sân ${booking.venueName} - ${booking.courtName}?`,
      onConfirm: async () => {
        try {
          await apiFetch(`/admin/bookings/${booking.id}/confirm`, {
            method: "PATCH",
            token: getStoredToken(),
          });
          loadBookings();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const handleComplete = (booking: BookingResponseDto) => {
    setConfirmDialog({
      open: true,
      title: "Hoàn tất đặt sân",
      description: `Bạn chắc chắn muốn hoàn tất đặt sân ${booking.venueName} - ${booking.courtName}?`,
      onConfirm: async () => {
        try {
          await apiFetch(`/admin/bookings/${booking.id}/complete`, {
            method: "PATCH",
            token: getStoredToken(),
          });
          loadBookings();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) =>
    booking.venueName.toLowerCase().includes(search.toLowerCase()) ||
    booking.courtName.toLowerCase().includes(search.toLowerCase()) ||
    (booking.customerName?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý đặt sân</h1>
        <p className="text-sm text-[#C4C7C9]">Xem và quản lý các đơn đặt sân trên nền tảng</p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Tìm kiếm theo tên sân, khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white placeholder:text-[#C4C7C9]/40"
        />
      </div>

      <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] text-white">
        <CardHeader>
          <CardTitle className="text-lg">Danh sách đặt sân</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(134,210,50,0.2)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Sân</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Ngày</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Giờ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Giá</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(134,210,50,0.2)]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[#C4C7C9]">Đang tải...</td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[#C4C7C9]">Không tìm thấy đơn đặt sân nào.</td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-[#141414]/50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-white">{booking.venueName}</p>
                          <p className="text-xs text-[#C4C7C9]/60">{booking.courtName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#C4C7C9]/80">{booking.customerName || "Không có tên"}</td>
                      <td className="px-4 py-4 text-[#C4C7C9]/60">{formatDate(booking.bookingDate)}</td>
                      <td className="px-4 py-4 text-[#C4C7C9]/60">{booking.startTime} - {booking.endTime}</td>
                      <td className="px-4 py-4 text-[#C4C7C9]/80">{formatPrice(booking.totalPrice)}</td>
                      <td className="px-4 py-4">
                        <Badge variant={statusVariant[booking.status] || "outline"}>{booking.status}</Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {booking.status === "PENDING_PAYMENT" && (
                            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleConfirm(booking)}>
                              Xác nhận
                            </Button>
                          )}
                          {booking.status === "CONFIRMED" && (
                            <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleComplete(booking)}>
                              Hoàn tất
                            </Button>
                          )}
                          {(booking.status === "PENDING_PAYMENT" || booking.status === "CONFIRMED") && (
                            <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleCancel(booking)}>
                              Hủy
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
