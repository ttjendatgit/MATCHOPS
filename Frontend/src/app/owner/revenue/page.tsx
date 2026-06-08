import { Metadata } from "next";
import { TrendingUp, ArrowRight, BarChart2, Download, GitCompare } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Doanh thu – Owner | MatchOps" };

const features = [
  { icon: BarChart2,   label: "Biểu đồ theo tháng", desc: "Theo dõi xu hướng doanh thu" },
  { icon: Download,    label: "Xuất báo cáo",         desc: "PDF / Excel dễ dàng" },
  { icon: GitCompare,  label: "So sánh kỳ trước",     desc: "Đo lường tăng trưởng" },
];

export default function OwnerRevenuePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-heading tracking-tight">Doanh thu</h1>
        <p className="mt-1 text-sm text-[#C4C7C9]">
          Phân tích doanh thu, báo cáo tài chính và xuất dữ liệu.
        </p>
      </div>

      {/* Placeholder card */}
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-[rgba(134,210,50,0.28)] bg-[#0A0A0A] p-8 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(134,210,50,0.3)] bg-[rgba(134,210,50,0.06)]">
          <TrendingUp className="h-8 w-8 text-[#86D232]" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-white font-heading">
          Phân tích doanh thu
        </h2>
        <p className="mb-1 max-w-sm text-sm text-[#C4C7C9]">
          Xem biểu đồ doanh thu theo ngày, tuần, tháng. Lọc theo cụm sân, loại sân và xuất báo cáo.
        </p>
        <p className="mb-8 text-xs text-[#C4C7C9]/40">
          Sẽ triển khai ở phase tiếp theo
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="flex items-center gap-2.5 rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#141414] px-4 py-2.5"
              >
                <Icon className="h-4 w-4 text-[#86D232] shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">{f.label}</p>
                  <p className="text-[10px] text-[#C4C7C9]/50">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        <Link
          href="/owner"
          className="flex items-center gap-1.5 text-xs font-medium text-[#FF8000] hover:underline"
        >
          Quay về Dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
