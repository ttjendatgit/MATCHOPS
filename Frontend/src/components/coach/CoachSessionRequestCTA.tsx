"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Loader2,
  LogIn,
  MapPin,
  MessageSquare,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type {
  CoachSessionRequestResponse,
  CreateCoachSessionRequestPayload,
} from "@/types/coach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CoachSport {
  sportId: string;
  sportName: string;
}

interface CoachSessionRequestCTAProps {
  coachId: string;
  coachDisplayName: string;
  sports: CoachSport[];
  /** "YYYY-MM-DD" prefilled from a selected weekly availability slot. */
  prefillDate?: string | null;
  /** "HH:mm-HH:mm" prefilled from a selected weekly availability slot. */
  prefillTimeSlot?: string | null;
  /** Human-readable summary of the selected slot, shown as a persistent selection indicator. */
  prefillLabel?: string | null;
}

const MAX_TIME_SLOT_LENGTH = 100;
const MAX_LOCATION_NOTE_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 1000;

function todayDateString(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

// ─── Sport chip (reused single-select pattern from the apply form) ─────────

function SportChoice({
  sport,
  selected,
  onSelect,
}: {
  sport: CoachSport;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold",
        "whitespace-nowrap transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        selected
          ? "bg-[#FF8000] text-white shadow-[0_0_18px_rgba(255,128,0,0.45)]"
          : "border border-white/[0.1] bg-slate-800/70 text-slate-400 hover:border-[#FF8000]/25 hover:bg-slate-800 hover:text-slate-200"
      )}
    >
      {selected ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Dumbbell className="h-3.5 w-3.5" aria-hidden />
      )}
      {sport.sportName}
    </button>
  );
}

export function CoachSessionRequestCTA({
  coachId,
  coachDisplayName,
  sports,
  prefillDate,
  prefillTimeSlot,
  prefillLabel,
}: CoachSessionRequestCTAProps) {
  const router = useRouter();

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const [sportId, setSportId] = useState<string>(sports.length === 1 ? sports[0].sportId : "");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [message, setMessage] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setSportId(sports.length === 1 ? sports[0].sportId : "");
    // Fall back to the selected availability slot (if any) rather than blanking it —
    // closing the dialog without submitting shouldn't lose the user's slot pick.
    setPreferredDate(prefillDate ?? "");
    setPreferredTimeSlot(prefillTimeSlot ?? "");
    setDurationMinutes("");
    setLocationNote("");
    setMessage("");
    setFormError(null);
  }

  // Sync prefilled values whenever the user picks a different availability slot.
  useEffect(() => {
    if (prefillDate) setPreferredDate(prefillDate);
    if (prefillTimeSlot) setPreferredTimeSlot(prefillTimeSlot);
  }, [prefillDate, prefillTimeSlot]);

  function handleCtaClick() {
    if (!getStoredToken()) {
      setAuthDialogOpen(true);
      return;
    }
    setFormOpen(true);
  }

  function validate(): string | null {
    if (preferredDate && preferredDate < todayDateString()) {
      return "Ngày mong muốn không được ở trong quá khứ.";
    }
    if (preferredTimeSlot.trim().length > MAX_TIME_SLOT_LENGTH) {
      return `Khung giờ mong muốn không được vượt quá ${MAX_TIME_SLOT_LENGTH} ký tự.`;
    }
    if (durationMinutes.trim() !== "") {
      const d = Number(durationMinutes);
      if (Number.isNaN(d) || d < 30 || d > 240) {
        return "Thời lượng buổi tập phải từ 30 đến 240 phút.";
      }
    }
    if (locationNote.trim().length > MAX_LOCATION_NOTE_LENGTH) {
      return `Ghi chú địa điểm không được vượt quá ${MAX_LOCATION_NOTE_LENGTH} ký tự.`;
    }
    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return `Lời nhắn không được vượt quá ${MAX_MESSAGE_LENGTH} ký tự.`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);

    const token = getStoredToken();
    if (!token) {
      setFormOpen(false);
      setAuthDialogOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateCoachSessionRequestPayload = {
        sportId: sportId || undefined,
        preferredDate: preferredDate || undefined,
        preferredTimeSlot: preferredTimeSlot.trim() || undefined,
        durationMinutes: durationMinutes.trim() !== "" ? Number(durationMinutes) : undefined,
        locationNote: locationNote.trim() || undefined,
        message: message.trim() || undefined,
      };

      const res = await apiFetch<ApiResponse<CoachSessionRequestResponse>>(
        `/coaches/${coachId}/session-requests`,
        { method: "POST", token, body: JSON.stringify(payload) }
      );

      if (res.success) {
        setFormOpen(false);
        resetForm();
        setSuccessOpen(true);
      } else {
        toast.error(res.message || "Không thể gửi yêu cầu buổi huấn luyện.");
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Không thể gửi yêu cầu buổi huấn luyện.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {prefillLabel && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#86D232]/25 bg-[#86D232]/5 p-3 text-xs">
          <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#86D232]" aria-hidden />
          <div>
            <p className="font-semibold text-[#86D232]">Khung giờ đã chọn: {prefillLabel}</p>
            <p className="mt-1 leading-relaxed text-slate-400">
              Khung giờ này dựa trên lịch rảnh thường tuần của huấn luyện viên. Huấn luyện viên sẽ
              xác nhận lại trước khi tạo buổi huấn luyện.
            </p>
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={handleCtaClick}
        className="w-full gap-2 bg-[#FF8000] py-3 text-sm font-bold text-white hover:bg-[#FF8000]/90 hover:shadow-[0_0_24px_rgba(255,128,0,0.4)]"
      >
        <Send className="h-4 w-4" aria-hidden />
        Yêu cầu buổi huấn luyện
      </Button>
      <p className="mt-3 text-center text-xs leading-relaxed text-slate-600">
        Gửi yêu cầu để huấn luyện viên xem xét và phản hồi. Đây chưa phải là lịch đã xác nhận.
      </p>

      {/* ── Auth-required state ── */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="max-w-sm text-center sm:text-center">
          <DialogHeader className="items-center text-center sm:text-center">
            <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full border border-[#FF8000]/30 bg-[#FF8000]/10">
              <LogIn className="h-6 w-6 text-[#FF8000]" aria-hidden />
            </div>
            <DialogTitle className="text-center">Cần đăng nhập để tiếp tục</DialogTitle>
            <DialogDescription className="text-center">
              Vui lòng đăng nhập để gửi yêu cầu buổi huấn luyện tới {coachDisplayName}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="button"
              className="w-full"
              onClick={() => router.push(`/login?redirect=/coach/${coachId}`)}
            >
              Đăng nhập
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setAuthDialogOpen(false)}
            >
              Để sau
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Request form ── */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yêu cầu buổi huấn luyện</DialogTitle>
            <DialogDescription>
              Gửi thông tin buổi tập mong muốn tới {coachDisplayName}. Huấn luyện viên sẽ xem xét
              và phản hồi yêu cầu này.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {sports.length > 1 && (
              <div className="space-y-2">
                <Label className="text-white">Môn thể thao</Label>
                <div role="radiogroup" aria-label="Chọn môn thể thao" className="flex flex-wrap gap-2">
                  {sports.map((sport) => (
                    <SportChoice
                      key={sport.sportId}
                      sport={sport}
                      selected={sportId === sport.sportId}
                      onSelect={() => setSportId(sport.sportId === sportId ? "" : sport.sportId)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="session-preferred-date" className="flex items-center gap-1.5 text-white">
                  <CalendarClock className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
                  Ngày mong muốn
                </Label>
                <Input
                  id="session-preferred-date"
                  type="date"
                  min={todayDateString()}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="border-white/10 bg-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-duration" className="flex items-center gap-1.5 text-white">
                  <Clock3 className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
                  Thời lượng (phút)
                </Label>
                <Input
                  id="session-duration"
                  type="number"
                  min={30}
                  max={240}
                  step={15}
                  inputMode="numeric"
                  placeholder="VD: 60"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="border-white/10 bg-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-time-slot" className="text-white">
                Khung giờ mong muốn
              </Label>
              <Input
                id="session-time-slot"
                value={preferredTimeSlot}
                onChange={(e) => setPreferredTimeSlot(e.target.value)}
                placeholder="VD: Buổi tối 19h-21h, cuối tuần..."
                maxLength={MAX_TIME_SLOT_LENGTH}
                className="border-white/10 bg-slate-900"
              />
              <p className="text-xs text-slate-500">
                Huấn luyện viên sẽ xác nhận lại thời gian phù hợp.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-location" className="flex items-center gap-1.5 text-white">
                <MapPin className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
                Ghi chú địa điểm
              </Label>
              <Input
                id="session-location"
                value={locationNote}
                onChange={(e) => setLocationNote(e.target.value)}
                placeholder="VD: Sân cầu lông ABC, Quận 7"
                maxLength={MAX_LOCATION_NOTE_LENGTH}
                className="border-white/10 bg-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-message" className="flex items-center gap-1.5 text-white">
                <MessageSquare className="h-3.5 w-3.5 text-[#FF8000]" aria-hidden />
                Lời nhắn
              </Label>
              <textarea
                id="session-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Giới thiệu ngắn về trình độ, mục tiêu tập luyện..."
                maxLength={MAX_MESSAGE_LENGTH}
                rows={3}
                className="flex w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white ring-offset-[#030303] placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] focus-visible:border-[rgba(255,128,0,0.5)] transition-colors resize-y"
              />
              <p className="text-right text-xs text-slate-600">{message.length}/{MAX_MESSAGE_LENGTH}</p>
            </div>

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {formError}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#FF8000] py-5 text-sm font-bold text-white hover:bg-[#FF8000]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Đang gửi yêu cầu...
                </>
              ) : (
                "Gửi yêu cầu"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Success confirmation ── */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-md text-center sm:text-center">
          <DialogHeader className="items-center text-center sm:text-center">
            <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full border border-[#86D232]/30 bg-[#86D232]/10 shadow-[0_0_24px_rgba(134,210,50,0.25)]">
              <CheckCircle2 className="h-7 w-7 text-[#86D232]" aria-hidden />
            </div>
            <DialogTitle className="text-center text-xl">
              Yêu cầu buổi huấn luyện đã được gửi
            </DialogTitle>
            <DialogDescription className="text-center">
              {coachDisplayName} sẽ xem xét và phản hồi yêu cầu của bạn sớm nhất có thể. Đây chưa
              phải là lịch tập đã được xác nhận.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-1">
            <Button type="button" className="w-full" onClick={() => router.push("/coach/requests")}>
              Xem yêu cầu của tôi
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setSuccessOpen(false)}
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
