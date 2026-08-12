import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, MapPin, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicCoachListItem } from "@/types/coach";

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Same fallback conventions as (public)/coach/page.tsx — every value here
// comes straight from PublicCoachListItem or is an honest "not provided" label.

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

// ─── Coach card ───────────────────────────────────────────────────────────────

function CoachCard({ coach }: { coach: PublicCoachListItem }) {
  return (
    <Link
      href={`/coach/${coach.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-white/8 p-5",
        "bg-gradient-to-b from-slate-900 to-slate-950 shadow-lg",
        "transition-all duration-300",
        "hover:border-[#86D232]/40 hover:shadow-2xl hover:shadow-[#86D232]/15",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86D232]/50",
      )}
      aria-label={`Xem hồ sơ ${coach.displayName}`}
    >
      {/* Verified badge — every profile the public endpoint returns has
          already passed MatchOps review, so this is a real, not fabricated,
          indicator (same claim shown on /coach). */}
      <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-[#86D232]/30 bg-[#86D232]/10 px-2 py-0.5 text-[10px] font-semibold text-[#86D232]">
        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
        Đã xác minh
      </span>

      <div className="flex items-start gap-3 pr-16">
        {coach.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coach.coverImageUrl}
            alt=""
            aria-hidden
            className="h-12 w-12 shrink-0 rounded-xl border border-white/10 object-cover"
          />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF8000] to-[#86D232] text-sm font-black text-slate-950"
            aria-hidden
          >
            {getInitials(coach.displayName)}
          </div>
        )}
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="truncate text-base font-bold text-white transition-colors duration-200 group-hover:text-[#86D232]">
            {coach.displayName}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3 shrink-0 text-slate-600" aria-hidden />
            <span className="truncate">{formatLocation(coach.city, coach.district)}</span>
          </p>
        </div>
      </div>

      {coach.sports.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {coach.sports.slice(0, 3).map((s) => (
            <span
              key={s.sportId}
              className="inline-flex items-center rounded-full border border-[#FF8000]/30 bg-[rgba(255,128,0,0.10)] px-2 py-0.5 text-[10px] font-medium text-[#FF8000]"
            >
              {s.sportName}
            </span>
          ))}
        </div>
      )}

      {coach.bioPreview && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{coach.bioPreview}</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <span className="text-sm font-semibold text-[#86D232]">{formatHourlyRate(coach.hourlyRate)}</span>
        <span className="flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors duration-200 group-hover:text-[#86D232]">
          Xem hồ sơ
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

// ─── Empty state — no approved coaches yet ────────────────────────────────────

function EmptyCoachesCTA() {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-800/30 px-6 py-14 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#86D232]/10 ring-1 ring-[#86D232]/25">
        <UserCog className="h-7 w-7 text-[#86D232]" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-white">Chưa có huấn luyện viên nổi bật</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
        Các huấn luyện viên đã được MatchOps xác minh sẽ xuất hiện tại đây. Bạn cũng có thể đăng ký
        trở thành huấn luyện viên đầu tiên.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/coach"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#86D232] px-5 py-2.5 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-[#86D232]/90 hover:shadow-[0_0_20px_rgba(134,210,50,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86D232]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          Khám phá huấn luyện viên
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/coach/apply"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-[#86D232]/30 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86D232]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          Trở thành huấn luyện viên
        </Link>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function FeaturedCoachesSection({ coaches }: { coaches: PublicCoachListItem[] }) {
  return (
    <section className="relative bg-[#030303] px-4 py-20 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgba(134,210,50,0.05),transparent)]" />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-[#86D232] drop-shadow-[0_0_8px_rgba(134,210,50,0.5)]">
              Huấn luyện viên
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Học cùng chuyên gia
            </h2>
            <p className="mt-2 text-slate-400">
              Huấn luyện viên đã được MatchOps xác minh hồ sơ
            </p>
          </div>
          <Link
            href="/coach"
            className="group hidden shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-[#86D232]/35 hover:bg-[#86D232]/5 hover:text-white sm:flex"
            aria-label="Xem tất cả huấn luyện viên"
          >
            Xem tất cả
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        {coaches.length === 0 ? (
          <EmptyCoachesCTA />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        )}

        {/* Mobile "view all" — desktop already has it in the header */}
        <Link
          href="/coach"
          className="mt-6 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-[#86D232]/35 hover:bg-[#86D232]/5 hover:text-white sm:hidden"
        >
          Xem tất cả huấn luyện viên
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
