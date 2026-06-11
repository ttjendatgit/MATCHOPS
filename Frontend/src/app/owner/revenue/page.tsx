"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, ArrowRight, BarChart2, 
  Download, GitCompare, DollarSign,
  Calendar, Loader2, ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface BookingResponseDto {
  id: string;
  totalPrice: number;
  status: string;
  bookingDate: string;
}

export default function OwnerRevenuePage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);

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

  const totalRevenue = bookings
    .filter(b => b.status === "COMPLETED" || b.status === "CONFIRMED")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const completedBookings = bookings.filter(b => b.status === "COMPLETED").length;
  const pendingRevenue = bookings
    .filter(b => b.status === "PENDING_PAYMENT")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading tracking-tight">Doanh thu</h1>
          <p className="mt-1 text-sm text-[#C4C7C9]">
            Theo dõi hiệu quả kinh doanh từ các cụm sân của bạn.
          </p>
        </div>
        <Button variant="outline" className="border-[rgba(134,210,50,0.2)] bg-[#141414] text-white gap-2">
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-[#FF8000]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#FF8000]" />
              </div>
              <span className="flex items-center text-[10px] font-bold text-[#86D232] bg-[#86D232]/10 px-1.5 py-0.5 rounded">
                +12.5% <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </span>
            </div>
            <p className="text-xs text-[#C4C7C9]/60 uppercase tracking-wider font-bold">Tổng doanh thu</p>
            <p className="text-2xl font-black text-white mt-1">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-[#86D232]/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#86D232]" />
              </div>
              <span className="flex items-center text-[10px] font-bold text-[#86D232] bg-[#86D232]/10 px-1.5 py-0.5 rounded">
                +5.2% <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </span>
            </div>
            <p className="text-xs text-[#C4C7C9]/60 uppercase tracking-wider font-bold">Đơn hoàn tất</p>
            <p className="text-2xl font-black text-white mt-1">{completedBookings}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <p className="text-xs text-[#C4C7C9]/60 uppercase tracking-wider font-bold">Doanh thu chờ</p>
            <p className="text-2xl font-black text-white mt-1">{formatCurrency(pendingRevenue)}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart2 className="h-5 w-5 text-blue-500" />
              </div>
              <span className="flex items-center text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                -2.4% <ArrowDownRight className="h-3 w-3 ml-0.5" />
              </span>
            </div>
            <p className="text-xs text-[#C4C7C9]/60 uppercase tracking-wider font-bold">Giá TB đơn</p>
            <p className="text-2xl font-black text-white mt-1">
              {formatCurrency(bookings.length > 0 ? totalRevenue / bookings.length : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart area placeholder */}
      <Card className="bg-[#0A0A0A] border-[rgba(134,210,50,0.28)] overflow-hidden">
        <CardHeader className="border-b border-[rgba(134,210,50,0.15)] bg-[#141414]/50">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-[#FF8000]" />
            Biểu đồ tăng trưởng doanh thu
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4 h-16 w-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <GitCompare className="h-8 w-8 text-[#C4C7C9]/40" />
            </div>
            <p className="text-sm text-[#C4C7C9]/60 max-w-xs mx-auto">
              Hệ thống đang tổng hợp dữ liệu để vẽ biểu đồ chi tiết cho từng cơ sở.
            </p>
            <p className="text-[10px] text-[#C4C7C9]/30 mt-2 uppercase tracking-widest font-bold">
              Coming Soon
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions placeholder */}
      <div className="rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] overflow-hidden">
        <div className="border-b border-[rgba(134,210,50,0.15)] bg-[#141414] px-5 py-4">
          <h3 className="text-sm font-bold text-white">Giao dịch gần đây</h3>
        </div>
        <div className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-[rgba(134,210,50,0.1)] bg-[#030303]">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40">Mã đơn</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40">Ngày</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40">Số tiền</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#C4C7C9]/40">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(134,210,50,0.05)]">
              {bookings.slice(0, 5).map((b) => (
                <tr key={b.id} className="hover:bg-[#141414] transition-colors">
                  <td className="px-5 py-4 text-xs font-mono text-white">#{b.id.slice(0, 8)}</td>
                  <td className="px-5 py-4 text-xs text-[#C4C7C9]/60">{b.bookingDate}</td>
                  <td className="px-5 py-4 text-xs font-bold text-[#FF8000]">{formatCurrency(b.totalPrice)}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded",
                      b.status === "COMPLETED" ? "bg-[#86D232]/10 text-[#86D232]" : 
                      b.status === "PENDING_PAYMENT" ? "bg-amber-500/10 text-amber-500" :
                      "bg-slate-500/10 text-slate-500"
                    )}>
                      {b.status}
                    </span>
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

function Button({ children, variant, className, ...props }: any) {
  return (
    <button 
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
        variant === "outline" ? "border border-white/10 hover:bg-white/5" : "bg-[#FF8000] hover:bg-[#FF8000]/90",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
