"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  Loader2,
  Lock,
  Plus,
  Save,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type {
  CoachAvailabilitySlot,
  CoachDayOfWeek,
  CoachProfileMeResponse,
  UpdateCoachAvailabilityPayload,
} from "@/types/coach";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Day metadata — display Monday→Sunday, values match System.DayOfWeek ──

const DAYS: { value: CoachDayOfWeek; label: string }[] = [
  { value: 1, label: "Thứ hai" },
  { value: 2, label: "Thứ ba" },
  { value: 3, label: "Thứ tư" },
  { value: 4, label: "Thứ năm" },
  { value: 5, label: "Thứ sáu" },
  { value: 6, label: "Thứ bảy" },
  { value: 0, label: "Chủ nhật" },
];

interface EditableSlot {
  key: string;
  dayOfWeek: CoachDayOfWeek;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

let tempKeyCounter = 0;
function nextTempKey(): string {
  tempKeyCounter += 1;
  return `new-${tempKeyCounter}`;
}

function slotToEditable(slot: CoachAvailabilitySlot): EditableSlot {
  return {
    key: slot.id,
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isEnabled: slot.isEnabled,
  };
}

function validateSlots(slots: EditableSlot[]): string | null {
  for (const slot of slots) {
    if (!slot.startTime || !slot.endTime) {
      return "Vui lòng nhập đầy đủ giờ bắt đầu và giờ kết thúc.";
    }
    if (slot.startTime >= slot.endTime) {
      return "Giờ bắt đầu phải trước giờ kết thúc.";
    }
  }

  for (const day of DAYS) {
    const daySlots = slots
      .filter((s) => s.dayOfWeek === day.value && s.isEnabled)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (let i = 1; i < daySlots.length; i++) {
      if (daySlots[i].startTime < daySlots[i - 1].endTime) {
        return `Các khung giờ đang bật vào ${day.label.toLowerCase()} bị trùng nhau.`;
      }
    }
  }

  return null;
}

// ─── Slot row ────────────────────────────────────────────────────────────────

function SlotRow({
  slot,
  disabled,
  onChange,
  onRemove,
}: {
  slot: EditableSlot;
  disabled: boolean;
  onChange: (patch: Partial<EditableSlot>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.08] bg-slate-950/40 p-2.5">
      <label className="flex items-center gap-1.5 text-xs text-slate-500">
        <input
          type="checkbox"
          checked={slot.isEnabled}
          disabled={disabled}
          onChange={(e) => onChange({ isEnabled: e.target.checked })}
          className="h-4 w-4 rounded border-white/20 bg-slate-900 accent-[#FF8000] disabled:cursor-not-allowed"
          aria-label="Bật khung giờ này"
        />
        Bật
      </label>

      <input
        type="time"
        value={slot.startTime}
        disabled={disabled}
        onChange={(e) => onChange({ startTime: e.target.value })}
        aria-label="Giờ bắt đầu"
        className="h-9 rounded-lg border border-white/10 bg-slate-900 px-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span className="text-slate-600" aria-hidden>
        –
      </span>
      <input
        type="time"
        value={slot.endTime}
        disabled={disabled}
        onChange={(e) => onChange({ endTime: e.target.value })}
        aria-label="Giờ kết thúc"
        className="h-9 rounded-lg border border-white/10 bg-slate-900 px-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] disabled:cursor-not-allowed disabled:opacity-50"
      />

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Xoá khung giờ này"
        className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PageMode = "loading" | "ready" | "no-profile" | "error";

export default function CoachAvailabilityPage() {
  const router = useRouter();

  const [mode, setMode] = useState<PageMode>("loading");
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [slots, setSlots] = useState<EditableSlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setPageError(null);
    try {
      const profileRes = await apiFetch<ApiResponse<CoachProfileMeResponse>>("/coaches/me", { token });
      if (!profileRes.success || !profileRes.data) {
        setPageError(profileRes.message || "Không thể tải hồ sơ huấn luyện viên.");
        setMode("error");
        return;
      }
      setIsSuspended(profileRes.data.status === "SUSPENDED");

      const availabilityRes = await apiFetch<ApiResponse<CoachAvailabilitySlot[]>>(
        "/coaches/me/availability",
        { token }
      );
      if (availabilityRes.success && availabilityRes.data) {
        setSlots(availabilityRes.data.map(slotToEditable));
        setMode("ready");
      } else {
        setPageError(availabilityRes.message || "Không thể tải lịch rảnh.");
        setMode("error");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setMode("no-profile");
        return;
      }
      const message = err instanceof Error ? err.message : "Không thể tải lịch rảnh.";
      setPageError(message);
      setMode("error");
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login?redirect=/coach/manage/availability");
      return;
    }
    setMode("loading");
    fetchAll();
  }, [router, fetchAll]);

  function addSlot(day: CoachDayOfWeek) {
    setSlots((prev) => [
      ...prev,
      { key: nextTempKey(), dayOfWeek: day, startTime: "18:00", endTime: "19:00", isEnabled: true },
    ]);
  }

  function updateSlot(key: string, patch: Partial<EditableSlot>) {
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function removeSlot(key: string) {
    setSlots((prev) => prev.filter((s) => s.key !== key));
  }

  async function handleSave() {
    const validationError = validateSlots(slots);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);

    const token = getStoredToken();
    setSaving(true);
    try {
      const payload: UpdateCoachAvailabilityPayload = {
        slots: slots.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isEnabled: s.isEnabled,
        })),
      };

      const res = await apiFetch<ApiResponse<CoachAvailabilitySlot[]>>("/coaches/me/availability", {
        method: "PUT",
        token,
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        setSlots(res.data.map(slotToEditable));
        toast.success("Đã lưu lịch rảnh.");
      } else {
        toast.error(res.message || "Không thể lưu lịch rảnh.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể lưu lịch rảnh.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

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
            fetchAll();
          }}
          className="mt-6 bg-[#FF8000] text-white hover:bg-[#FF8000]/90"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  // ── No coach profile ─────────────────────────────────────────────────────

  if (mode === "no-profile") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06]">
          <UserPlus className="h-6 w-6 text-slate-500" aria-hidden />
        </span>
        <h1 className="text-xl font-bold text-white">Bạn chưa có hồ sơ huấn luyện viên</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
          Đăng ký làm huấn luyện viên để thiết lập lịch rảnh và bắt đầu nhận yêu cầu buổi huấn
          luyện.
        </p>
        <Button asChild className="mt-6 bg-[#FF8000] text-white hover:bg-[#FF8000]/90">
          <Link href="/coach/apply">Đăng ký làm Huấn luyện viên</Link>
        </Button>
      </div>
    );
  }

  // ── Editor ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/coach/manage"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50 rounded"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Quay lại trang quản lý huấn luyện viên
      </Link>

      <div className="mb-6 max-w-2xl">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <CalendarClock className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
          Lịch rảnh làm việc
        </div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Thiết lập lịch rảnh</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
          Chọn những khung giờ trong tuần bạn thường nhận buổi huấn luyện. Đây chỉ là gợi ý —
          huấn luyện viên vẫn sẽ xác nhận lại thời gian cụ thể với từng yêu cầu.
        </p>
      </div>

      {isSuspended && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400"
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Hồ sơ huấn luyện viên đang bị tạm khóa, không thể chỉnh sửa lịch rảnh.
        </div>
      )}

      <div className="space-y-3">
        {DAYS.map((day) => {
          const daySlots = slots.filter((s) => s.dayOfWeek === day.value);
          return (
            <Card key={day.value} className="border-white/10 bg-slate-900/50">
              <CardContent className="space-y-3 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-white">{day.label}</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSuspended}
                    onClick={() => addSlot(day.value)}
                    className="gap-1 text-[#FF8000] hover:bg-[#FF8000]/10 hover:text-[#FF8000]"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Thêm khung giờ
                  </Button>
                </div>

                {daySlots.length === 0 ? (
                  <p className="text-xs text-slate-600">Chưa có khung giờ nào.</p>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map((slot) => (
                      <SlotRow
                        key={slot.key}
                        slot={slot}
                        disabled={isSuspended}
                        onChange={(patch) => updateSlot(slot.key, patch)}
                        onRemove={() => removeSlot(slot.key)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {formError && (
        <div
          role="alert"
          className={cn(
            "mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400"
          )}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {formError}
        </div>
      )}

      <div className="sticky bottom-4 mt-6">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSuspended || saving}
          className="w-full gap-2 bg-[#FF8000] py-5 text-sm font-bold text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:bg-[#FF8000]/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden />
              Lưu lịch rảnh
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
