import { Metadata } from "next";
import { DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Bảng giá – Owner | MatchOps" };

export default function OwnerPricingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-heading">Bảng giá</h1>
        <p className="mt-1 text-sm text-slate-400">
          Cài đặt giá theo khung giờ, loại ngày và cụm sân.
        </p>
      </div>

      {/* Placeholder card */}
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
          <DollarSign className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-white font-heading">
          Quản lý bảng giá
        </h2>
        <p className="mb-1 max-w-sm text-sm text-slate-400">
          Tính năng cho phép bạn thiết lập giá linh hoạt theo khung giờ, cuối
          tuần, và từng loại sân.
        </p>
        <p className="mb-6 text-xs text-slate-600">
          Sẽ triển khai ở phase tiếp theo
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-slate-500">
            Giá giờ cao điểm
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-slate-500">
            Giá cuối tuần
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-slate-500">
            Chặn khung giờ
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
