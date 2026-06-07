import { Metadata } from "next";
import { BookingStatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import type { BookingStatus } from "@/types/booking";

export const metadata: Metadata = { title: "Lịch đặt – Owner | MatchOps" };

const mockBookings: {
  id: string;
  venueName: string;
  courtName: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  time: string;
  totalPrice: number;
  status: BookingStatus;
}[] = [
  {
    id: "1",
    venueName: "Sân cầu lông Phú Mỹ Hưng",
    courtName: "Sân A1",
    customerName: "Nguyễn Văn A",
    customerPhone: "0901234567",
    bookingDate: "06/06/2026",
    time: "08:00 – 10:00",
    totalPrice: 160000,
    status: "CONFIRMED",
  },
  {
    id: "2",
    venueName: "Sân cầu lông Phú Mỹ Hưng",
    courtName: "Sân B2",
    customerName: "Trần Thị B",
    customerPhone: "0912345678",
    bookingDate: "06/06/2026",
    time: "14:00 – 16:00",
    totalPrice: 200000,
    status: "PENDING_PAYMENT",
  },
  {
    id: "3",
    venueName: "SportHub Bình Thạnh",
    courtName: "Sân C1",
    customerName: "Lê Văn C",
    customerPhone: "0923456789",
    bookingDate: "07/06/2026",
    time: "07:00 – 09:00",
    totalPrice: 160000,
    status: "CONFIRMED",
  },
  {
    id: "4",
    venueName: "SportHub Bình Thạnh",
    courtName: "Sân D1",
    customerName: "Phạm Thu Hà",
    customerPhone: "0934567890",
    bookingDate: "07/06/2026",
    time: "16:00 – 18:00",
    totalPrice: 200000,
    status: "COMPLETED",
  },
];

export default function OwnerBookingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-heading">
          Lịch đặt
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Tất cả đơn đặt sân từ các cụm sân của bạn.
        </p>
      </div>

      {/* Placeholder note */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-xs text-amber-400/80">
          Bộ lọc và phân trang sẽ triển khai ở phase tiếp theo. Dữ liệu hiện là
          mock.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Khách hàng
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sân / Cụm
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Thời gian
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trạng thái
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tổng tiền
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {mockBookings.map((b) => (
                <tr
                  key={b.id}
                  className="transition-colors hover:bg-slate-800/40"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{b.customerName}</p>
                    <p className="text-xs text-slate-500">{b.customerPhone}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-200">{b.courtName}</p>
                    <p className="max-w-[160px] truncate text-xs text-slate-500">
                      {b.venueName}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-300">{b.bookingDate}</p>
                    <p className="text-xs text-slate-500">{b.time}</p>
                  </td>
                  <td className="px-5 py-4">
                    <BookingStatusBadge status={b.status} />
                  </td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-200">
                    {formatCurrency(b.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
