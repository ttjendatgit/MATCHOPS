import { Metadata } from "next";
import { CalendarCheck2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Quản lý đặt sân – Owner" };

const mockBookings = [
  { id: "1", venueName: "Sân cầu lông Phú Mỹ Hưng", courtName: "Sân A1", customerName: "Nguyễn Văn A", customerPhone: "0901234567", bookingDate: "2026-06-01", startTime: "08:00:00", endTime: "10:00:00", totalPrice: 160000, status: "CONFIRMED" as const, paymentStatus: "PAID" as const },
  { id: "2", venueName: "Sân cầu lông Phú Mỹ Hưng", courtName: "Sân B2", customerName: "Trần Thị B",   customerPhone: "0912345678", bookingDate: "2026-06-01", startTime: "14:00:00", endTime: "16:00:00", totalPrice: 200000, status: "PENDING_PAYMENT" as const, paymentStatus: "UNPAID" as const },
  { id: "3", venueName: "SportHub Bình Thạnh",        courtName: "Sân C1", customerName: "Lê Văn C",     customerPhone: "0923456789", bookingDate: "2026-06-02", startTime: "07:00:00", endTime: "09:00:00", totalPrice: 160000, status: "CONFIRMED" as const, paymentStatus: "PAID" as const },
];

export default function OwnerBookingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý đặt sân" description="Tất cả đơn đặt sân từ các cơ sở của bạn" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Tìm theo tên khách, sân..." className="w-64 bg-white" />
        <Select>
          <SelectTrigger className="w-40 bg-white"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="PENDING_PAYMENT">Chờ thanh toán</SelectItem>
            <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
            <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
            <SelectItem value="CANCELLED_BY_USER">Đã huỷ</SelectItem>
          </SelectContent>
        </Select>
        <input type="date" className="h-10 rounded-lg border border-input bg-white px-3 text-sm" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Khách hàng</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sân / Cơ sở</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Thời gian</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{b.customerName}</p>
                      <p className="text-xs text-slate-400">{b.customerPhone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-900">{b.courtName}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[160px]">{b.venueName}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <p>{formatDate(b.bookingDate)}</p>
                      <p className="text-xs text-slate-400">{formatTime(b.startTime)} – {formatTime(b.endTime)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <BookingStatusBadge status={b.status} />
                        <PaymentStatusBadge status={b.paymentStatus} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(b.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
