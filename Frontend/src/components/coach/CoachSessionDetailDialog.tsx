"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Mail,
  MapPin,
  Phone,
  Receipt,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CoachSessionResponse } from "@/types/coach";
import {
  PAYMENT_STATUS_META,
  STATUS_META,
  formatDateTimeVi,
  formatPrice,
  formatViDate,
  parseDateOnly,
} from "@/lib/coach-session-calendar";

interface CoachSessionDetailDialogProps {
  session: CoachSessionResponse | null;
  onOpenChange: (open: boolean) => void;
  onRequestComplete: (session: CoachSessionResponse) => void;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-slate-200">{value}</p>
      </div>
    </div>
  );
}

export function CoachSessionDetailDialog({ session, onOpenChange, onRequestComplete }: CoachSessionDetailDialogProps) {
  const statusMeta = session ? STATUS_META[session.status] : null;
  const paymentMeta = session ? PAYMENT_STATUS_META[session.paymentStatus] : null;
  const canComplete = !!session && session.status === "PAID" && session.paymentStatus === "PAID";

  return (
    <Dialog open={session !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        {session && statusMeta && paymentMeta && (
          <>
            <DialogHeader>
              <DialogTitle>{session.requesterName}</DialogTitle>
              <DialogDescription>Chi tiết buổi huấn luyện.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={statusMeta.badgeVariant} className="gap-1 px-2.5 py-1 text-xs">
                <statusMeta.icon className="h-3.5 w-3.5" aria-hidden />
                {statusMeta.label}
              </Badge>
              <Badge variant={paymentMeta.badgeVariant} className="gap-1 px-2.5 py-1 text-xs">
                <paymentMeta.icon className="h-3.5 w-3.5" aria-hidden />
                {paymentMeta.label}
              </Badge>
            </div>

            <div className="grid gap-3.5 rounded-xl border border-white/[0.08] bg-slate-900/50 p-4 sm:grid-cols-2">
              {session.requesterEmail && (
                <DetailRow icon={Mail} label="Email người yêu cầu" value={session.requesterEmail} />
              )}
              {session.requesterPhoneNumber && (
                <DetailRow icon={Phone} label="Số điện thoại" value={session.requesterPhoneNumber} />
              )}
              {session.sportName && <DetailRow icon={Dumbbell} label="Môn thể thao" value={session.sportName} />}
              {session.scheduledDate && (
                <DetailRow icon={CalendarDays} label="Ngày" value={formatViDate(parseDateOnly(session.scheduledDate))} />
              )}
              <DetailRow icon={Clock3} label="Khung giờ" value={session.scheduledTimeSlot ?? "Chưa rõ giờ"} />
              {session.durationMinutes && (
                <DetailRow icon={Clock3} label="Thời lượng" value={`${session.durationMinutes} phút`} />
              )}
              {session.locationNote && <DetailRow icon={MapPin} label="Địa điểm" value={session.locationNote} />}
              <DetailRow icon={Wallet} label="Học phí" value={formatPrice(session.priceAmount, session.currency)} />
            </div>

            {(session.paymentTransactionCode || session.paidAt || session.completedAt) && (
              <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-slate-950/40 p-3.5 text-xs text-slate-500">
                {session.paymentTransactionCode && (
                  <div className="flex items-center gap-1.5">
                    <Receipt className="h-3 w-3 shrink-0" aria-hidden />
                    Mã giao dịch: <span className="font-mono text-slate-400">{session.paymentTransactionCode}</span>
                  </div>
                )}
                {session.paidAt && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
                    Thanh toán lúc {formatDateTimeVi(session.paidAt)}
                  </div>
                )}
                {session.completedAt && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
                    Hoàn thành lúc {formatDateTimeVi(session.completedAt)}
                  </div>
                )}
              </div>
            )}

            {canComplete && (
              <DialogFooter>
                <Button
                  type="button"
                  className="w-full gap-2 bg-[#86D232] text-[#0A0A0A] hover:bg-[#86D232]/90 sm:w-auto"
                  onClick={() => onRequestComplete(session)}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Đánh dấu hoàn thành
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
