import { Metadata } from "next";
import { TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Doanh thu – Owner | MatchOps" };

export default function OwnerRevenuePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-heading">Doanh thu</h1>
        <p className="mt-1 text-sm text-slate-400">
          Phân tích doanh thu, báo cáo tài chính và xuất dữ liệu.
        </p>
      </div>

      {/* Placeholder card */}
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-white font-heading">
          Phân tích doanh thu
        </h2>
        <p className="mb-1 max-w-sm text-sm text-slate-400">
          Xem biểu đồ doanh thu theo ngày, tuần, tháng. Lọc theo cụm sân, loại
          sân và xuất báo cáo PDF/Excel.
        </p>
        <p className="mb-6 text-xs text-slate-600">
          Sẽ triển khai ở phase tiếp theo
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-slate-500">
            Biểu đồ theo tháng
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-slate-500">
            Xuất báo cáo
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-slate-500">
            So sánh kỳ trước
          </div>
        </div>
        <Link
          href="/owner"
          className="mt-8 flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          Quay về Dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
