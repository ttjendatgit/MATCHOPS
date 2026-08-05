"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Dumbbell,
  FileText,
  Globe2,
  Image as ImageIcon,
  Loader2,
  Lock,
  UserCog,
  UserPlus,
  XCircle,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { CoachProfileMeResponse, CoachProfileStatus } from "@/types/coach";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Status metadata — dashboard-specific wording per Coach-8B ─────────────

const STATUS_META: Record<
  CoachProfileStatus,
  { label: string; icon: typeof Clock; badgeVariant: "warning" | "success" | "destructive" }
> = {
  PENDING_APPROVAL: { label: "Đang chờ duyệt",       icon: Clock,        badgeVariant: "warning" },
  ACTIVE:            { label: "Đã duyệt",             icon: CheckCircle2, badgeVariant: "success" },
  REJECTED:          { label: "Cần bổ sung hồ sơ",    icon: XCircle,      badgeVariant: "destructive" },
  SUSPENDED:         { label: "Tạm khóa",              icon: Lock,         badgeVariant: "destructive" },
};

// ─── Stat tile ───────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Dumbbell;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-slate-900/50 p-4">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </div>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

// ─── Task card ───────────────────────────────────────────────────────────────

interface TaskCardProps {
  icon: typeof ClipboardList;
  accent: "orange" | "green";
  title: string;
  description: string;
  href?: string;
  ctaLabel?: string;
  disabledNote?: string;
}

function TaskCard({ icon: Icon, accent, title, description, href, ctaLabel, disabledNote }: TaskCardProps) {
  const isOrange = accent === "orange";

  return (
    <Card className="flex h-full flex-col overflow-hidden border-white/10 bg-slate-900/50">
      <div
        className={cn(
          "h-px w-full bg-gradient-to-r from-transparent to-transparent",
          isOrange ? "via-[#FF8000]/40" : "via-[#86D232]/40"
        )}
        aria-hidden
      />
      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl border",
            isOrange ? "border-[#FF8000]/25 bg-[#FF8000]/10" : "border-[#86D232]/25 bg-[#86D232]/10"
          )}
        >
          <Icon className={cn("h-5 w-5", isOrange ? "text-[#FF8000]" : "text-[#86D232]")} aria-hidden />
        </span>

        <div className="flex-1">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{description}</p>
        </div>

        {href ? (
          <Button
            asChild
            className={cn(
              "w-full justify-between",
              isOrange
                ? "bg-[#FF8000] text-white hover:bg-[#FF8000]/90"
                : "bg-[#86D232] text-[#0A0A0A] hover:bg-[#86D232]/90"
            )}
          >
            <Link href={href}>
              {ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        ) : (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-white/[0.08] bg-slate-950/50 px-3 py-2.5 text-xs leading-relaxed text-slate-500"
          >
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {disabledNote}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PageMode = "loading" | "ready" | "no-profile" | "error";

export default function CoachManageDashboardPage() {
  const router = useRouter();

  const [mode, setMode] = useState<PageMode>("loading");
  const [pageError, setPageError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CoachProfileMeResponse | null>(null);

  const fetchProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setPageError(null);
    try {
      const res = await apiFetch<ApiResponse<CoachProfileMeResponse>>("/coaches/me", { token });
      if (res.success && res.data) {
        setProfile(res.data);
        setMode("ready");
      } else {
        setPageError(res.message || "Không thể tải hồ sơ huấn luyện viên.");
        setMode("error");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setMode("no-profile");
        return;
      }
      const message = err instanceof Error ? err.message : "Không thể tải hồ sơ huấn luyện viên.";
      setPageError(message);
      setMode("error");
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login?redirect=/coach/manage");
      return;
    }
    setMode("loading");
    fetchProfile();
  }, [router, fetchProfile]);

  // ── Loading ──────────────────────────────────────────────────────────────

  if (mode === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8000]" aria-label="Đang tải" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (mode === "error") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-400" aria-hidden />
        <p className="text-sm text-red-400">{pageError}</p>
        <Button
          type="button"
          onClick={() => {
            setMode("loading");
            fetchProfile();
          }}
          className="mt-6 bg-[#FF8000] text-white hover:bg-[#FF8000]/90"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  // ── No coach profile yet ─────────────────────────────────────────────────

  if (mode === "no-profile") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06]">
          <UserPlus className="h-6 w-6 text-slate-500" aria-hidden />
        </span>
        <h1 className="text-xl font-bold text-white">Bạn chưa có hồ sơ huấn luyện viên</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
          Đăng ký làm huấn luyện viên để bắt đầu nhận yêu cầu buổi huấn luyện.
        </p>
        <Button asChild className="mt-6 bg-[#FF8000] text-white hover:bg-[#FF8000]/90">
          <Link href="/coach/apply">Đăng ký làm Huấn luyện viên</Link>
        </Button>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────

  if (!profile) return null;

  const statusMeta = STATUS_META[profile.status];
  const StatusIcon = statusMeta.icon;
  const isActive = profile.status === "ACTIVE";

  const documentCount = profile.proofs.length + profile.verificationDocuments.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <UserCog className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
            Trang quản lý huấn luyện viên
          </div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Quản lý huấn luyện viên</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
            Theo dõi hồ sơ, yêu cầu buổi huấn luyện và trạng thái xét duyệt của bạn.
          </p>
        </div>
      </div>

      {/* ── Status card ── */}
      <Card className="mb-6 overflow-hidden border-white/10 bg-slate-900/50">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#FF8000]/40 to-transparent" aria-hidden />
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge variant={statusMeta.badgeVariant} className="gap-1.5 px-3 py-1 text-sm">
                <StatusIcon className="h-3.5 w-3.5" aria-hidden />
                {statusMeta.label}
              </Badge>
              {profile.displayName && (
                <span className="text-sm font-medium text-slate-300">{profile.displayName}</span>
              )}
            </div>
          </div>

          {profile.status === "REJECTED" && profile.rejectionReason && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-400">Cần bổ sung</p>
              <p className="mt-1 text-sm text-slate-300">{profile.rejectionReason}</p>
            </div>
          )}

          {profile.status === "SUSPENDED" && profile.rejectionReason && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-400">Lý do tạm khóa</p>
              <p className="mt-1 text-sm text-slate-300">{profile.rejectionReason}</p>
            </div>
          )}

          {/* ── Quick stats — fields already returned by /coaches/me only ── */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-5 lg:grid-cols-4">
            <StatTile icon={StatusIcon} label="Trạng thái" value={statusMeta.label} />
            <StatTile icon={Dumbbell} label="Môn thể thao" value={`${profile.sports.length} môn`} />
            <StatTile icon={ImageIcon} label="Ảnh portfolio" value={`${profile.portfolioImages.length} ảnh`} />
            <StatTile icon={FileText} label="Minh chứng & tài liệu" value={`${documentCount} tệp`} />
          </div>
        </CardContent>
      </Card>

      {/* ── Task cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TaskCard
          icon={UserCog}
          accent="orange"
          title="Hồ sơ huấn luyện viên"
          description="Cập nhật thông tin, ảnh minh chứng, tài liệu xác minh và portfolio công khai."
          href="/coach/apply"
          ctaLabel="Quản lý hồ sơ"
        />

        <TaskCard
          icon={ClipboardList}
          accent="orange"
          title="Yêu cầu buổi huấn luyện"
          description="Xem và phản hồi các yêu cầu từ người chơi."
          href="/coach/manage/requests"
          ctaLabel="Xem yêu cầu"
        />

        <TaskCard
          icon={CalendarClock}
          accent="orange"
          title="Lịch rảnh làm việc"
          description="Thiết lập khung giờ bạn thường nhận buổi huấn luyện trong tuần."
          href="/coach/manage/availability"
          ctaLabel="Thiết lập lịch rảnh"
        />

        <TaskCard
          icon={CalendarDays}
          accent="green"
          title="Lịch buổi huấn luyện"
          description="Xem các buổi huấn luyện đã được xác nhận, trạng thái thanh toán và đánh dấu hoàn thành."
          href="/coach/manage/sessions"
          ctaLabel="Xem lịch buổi huấn luyện"
        />

        {isActive ? (
          <TaskCard
            icon={Globe2}
            accent="green"
            title="Hồ sơ công khai"
            description="Xem trang hồ sơ mà người chơi nhìn thấy."
            href={`/coach/${profile.id}`}
            ctaLabel="Xem hồ sơ công khai"
          />
        ) : (
          <TaskCard
            icon={Globe2}
            accent="green"
            title="Hồ sơ công khai"
            description="Trang hồ sơ công khai sẽ hiển thị thông tin của bạn tới người chơi sau khi được duyệt."
            disabledNote="Hồ sơ công khai chỉ hiển thị sau khi được duyệt."
          />
        )}
      </div>
    </div>
  );
}
