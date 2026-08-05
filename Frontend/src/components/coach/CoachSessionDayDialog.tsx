"use client";

import { CalendarClock, Clock3, Dumbbell, Inbox } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CoachSessionResponse } from "@/types/coach";
import { PAYMENT_STATUS_META, STATUS_META, formatPrice, formatViDate } from "@/lib/coach-session-calendar";

interface CoachSessionDayDialogProps {
  date: Date | null;
  sessions: CoachSessionResponse[];
  onOpenChange: (open: boolean) => void;
  onSelectSession: (session: CoachSessionResponse) => void;
}

export function CoachSessionDayDialog({ date, sessions, onOpenChange, onSelectSession }: CoachSessionDayDialogProps) {
  return (
    <Dialog open={date !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lịch ngày {date ? formatViDate(date) : ""}</DialogTitle>
          <DialogDescription>
            {sessions.length > 0
              ? `${sessions.length} buổi huấn luyện trong ngày.`
              : "Chi tiết các buổi huấn luyện trong ngày."}
          </DialogDescription>
        </DialogHeader>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.06]">
              <Inbox className="h-5 w-5 text-slate-500" aria-hidden />
            </span>
            <p className="max-w-xs text-sm text-slate-400">Không có buổi huấn luyện nào trong ngày này.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {sessions.map((session) => {
              const statusMeta = STATUS_META[session.status];
              const paymentMeta = PAYMENT_STATUS_META[session.paymentStatus];
              const StatusIcon = statusMeta.icon;
              const PaymentIcon = paymentMeta.icon;

              return (
                <li key={session.id} className="rounded-xl border border-white/[0.08] bg-slate-900/50 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{session.requesterName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3" aria-hidden />
                          {session.scheduledTimeSlot ?? "Chưa rõ giờ"}
                        </span>
                        {session.sportName && (
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-3 w-3" aria-hidden />
                            {session.sportName}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-300">
                      {formatPrice(session.priceAmount, session.currency)}
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant={statusMeta.badgeVariant} className="gap-1 px-2 py-0.5 text-[11px]">
                      <StatusIcon className="h-3 w-3" aria-hidden />
                      {statusMeta.label}
                    </Badge>
                    <Badge variant={paymentMeta.badgeVariant} className="gap-1 px-2 py-0.5 text-[11px]">
                      <PaymentIcon className="h-3 w-3" aria-hidden />
                      {paymentMeta.label}
                    </Badge>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full gap-1.5"
                    onClick={() => onSelectSession(session)}
                  >
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                    Xem chi tiết
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
