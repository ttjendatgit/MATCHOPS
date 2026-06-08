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
        <h1 className="text-2xl font-bold text-white font-heading tracking-tight">
          Lịch đặt
        </h1>
        <p className="mt-1 text-sm text-[#C4C7C9]">
          Tất cả đơn đặt sân từ các cụm sân của bạn.
        </p>
      </div>

      {/* Phase note */}
      <div className="rounded-lg border border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.05)] px-4 py-3">
        <p className="text-xs text-amber-400/80">
          Bộ lọc và phân trang sẽ triển khai ở phase tiếp theo. Dữ liệu hiện là mock.
        </p>
      </div>

      {/* Table */}
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
              {mockBookings.map((b, i) => (
                <tr
                  key={b.id}
                  className={`transition-colors hover:bg-[#141414] ${
                    i < mockBookings.length - 1
                      ? "border-b border-[rgba(134,210,50,0.1)]"
                      : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white">{b.customerName}</p>
                    <p className="text-xs text-[#C4C7C9]/50">{b.customerPhone}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-[#86D232]">{b.courtName}</p>
                    <p className="max-w-[160px] truncate text-xs text-[#C4C7C9]/60">
                      {b.venueName}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-white font-medium">{b.bookingDate}</p>
                    <p className="text-xs text-[#C4C7C9]/60">{b.time}</p>
                  </td>
                  <td className="px-5 py-4">
                    <BookingStatusBadge status={b.status} />
                  </td>
                  <td className="px-5 py-4 text-right font-bold tabular-nums text-[#FF8000]">
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
