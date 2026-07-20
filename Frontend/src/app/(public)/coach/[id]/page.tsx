import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { PublicCoachDetail } from "@/types/coach";

export const metadata: Metadata = { title: "Chi tiết huấn luyện viên – MatchOps" };

// ─── Backend DTO ────────────────────────────────────────────────────────────

interface ApiWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HLV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatLocation(city: string, district: string): string {
  const c = city.trim();
  const d = district.trim();
  if (d && c) return `${d}, ${c}`;
  return d || c || "Chưa cập nhật khu vực";
}

function formatHourlyRate(rate: number | null): string {
  if (rate === null) return "Liên hệ";
  return `${Math.round(rate / 1000)}k/giờ`;
}

function formatJoinedDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CoachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let coach: PublicCoachDetail | null = null;
  let coachError: string | null = null;

  try {
    const res = await apiFetch<ApiWrapper<PublicCoachDetail>>(`/coaches/${id}`);
    coach = res.data ?? null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes(": 404")) notFound();
    coachError = msg || "Không thể tải thông tin huấn luyện viên.";
  }

  if (coachError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-red-400">{coachError}</p>
        <Link
          href="/coach"
          className="mt-4 inline-block text-sm text-[#FF8000] hover:underline"
        >
          ← Quay lại danh sách huấn luyện viên
        </Link>
      </div>
    );
  }

  if (!coach) notFound();

  const location = formatLocation(coach.city, coach.district);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="transition-colors hover:text-slate-300">
          Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link href="/coach" className="transition-colors hover:text-slate-300">
          Huấn luyện viên
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="max-w-[200px] truncate font-medium text-slate-200">
          {coach.displayName}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ── Main content ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header */}
          <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:flex-row sm:items-start">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF8000] to-[#86D232] text-xl font-black text-slate-950"
              aria-hidden
            >
              {getInitials(coach.displayName)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#86D232]/30 bg-[#86D232]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#86D232]">
                <ShieldCheck className="h-3 w-3" aria-hidden />
                Đã được MatchOps xác minh
              </div>
              <h1 className="text-2xl font-bold text-white">{coach.displayName}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden />
                {location}
              </p>

              {coach.sports.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {coach.sports.map((s) => (
                    <span
                      key={s.sportId}
                      className="inline-flex items-center rounded-full border border-[#FF8000]/30 bg-[rgba(255,128,0,0.12)] px-2.5 py-0.5 text-xs font-medium text-[#FF8000]"
                    >
                      {s.sportName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.08] bg-slate-900/50 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                <Briefcase className="h-3.5 w-3.5" aria-hidden />
                Kinh nghiệm
              </div>
              <p className="text-sm font-semibold text-white">
                {coach.experienceYears !== null ? `${coach.experienceYears} năm` : "Chưa cập nhật"}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-slate-900/50 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                Mức giá
              </div>
              <p className="text-sm font-semibold text-[#86D232]">
                {formatHourlyRate(coach.hourlyRate)}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-slate-900/50 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                Tham gia
              </div>
              <p className="text-sm font-semibold text-white">
                {formatJoinedDate(coach.approvedAt ?? coach.createdAt)}
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/50 p-6">
            <h2 className="mb-3 text-lg font-semibold text-white">Giới thiệu</h2>
            {coach.bio ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-400">
                {coach.bio}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Huấn luyện viên chưa cập nhật phần giới thiệu.
              </p>
            )}
          </div>

          <Link
            href="/coach"
            className="inline-block text-sm text-[#FF8000] transition-colors hover:underline"
          >
            ← Quay lại danh sách huấn luyện viên
          </Link>
        </div>

        {/* ── Sidebar ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-white/[0.08] bg-slate-900/50 p-6">
            <h2 className="mb-1 text-base font-semibold text-white">Liên hệ huấn luyện viên</h2>
            <p className="mb-5 text-sm text-slate-500">{formatHourlyRate(coach.hourlyRate)}</p>

            <div
              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-slate-800/60 px-4 py-3 text-sm font-semibold text-slate-500"
              aria-disabled="true"
              role="status"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Tính năng đặt lịch sẽ được mở sau
            </div>

            <p className="mt-3 text-center text-xs leading-relaxed text-slate-600">
              Chức năng đặt lịch trực tiếp với huấn luyện viên đang được MatchOps phát triển.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
