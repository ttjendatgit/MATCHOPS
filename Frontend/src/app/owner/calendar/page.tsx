"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { toast } from "sonner";
import type { ApiResponse } from "@/types/api";
import type {
  BookingSource,
  CourtCalendarEntry,
  CreateExternalBookingRequest,
  OwnerCourtCalendar,
} from "@/types/booking";

interface CourtDto {
  id: string;
  venueId: string;
  name: string;
  venueName?: string;
}

const SOURCE_OPTIONS: { value: BookingSource; label: string }[] = [
  { value: "ZALO", label: "Zalo" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "PHONE", label: "Điện thoại" },
  { value: "DIRECT", label: "Trực tiếp" },
  { value: "OTHER", label: "Khác" },
];

const SOURCE_LABELS: Record<string, string> = {
  MATCHOP: "MATCHOP",
  ZALO: "Zalo",
  FACEBOOK: "Facebook",
  PHONE: "Điện thoại",
  DIRECT: "Trực tiếp",
  OTHER: "Khác",
  BLOCKED: "Đã khóa",
  AVAILABLE: "Trống",
};

function isSlotInPast(slotDate: string, slotStart: string): boolean {
  const now = new Date();
  const todayLocal = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  if (slotDate < todayLocal) return true;
  if (slotDate > todayLocal) return false;

  return parseTime(slotStart) <= now.getHours() * 60 + now.getMinutes();
}

function parseTime(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function addMinutes(time: string, minutes: number): string {
  const total = parseTime(time) + minutes;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(slotStart: string, slotEnd: string, entry: CourtCalendarEntry): boolean {
  const s = parseTime(slotStart);
  const e = parseTime(slotEnd);
  const es = parseTime(entry.startTime);
  const ee = parseTime(entry.endTime);
  return es < e && ee > s;
}

function slotStyle(source: string): string {
  switch (source) {
    case "AVAILABLE":
      return "border-[rgba(134,210,50,0.35)] bg-[rgba(134,210,50,0.08)] text-[#86D232]";
    case "MATCHOP":
      return "border-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.12)] text-blue-300";
    case "ZALO":
      return "border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.12)] text-purple-300";
    case "FACEBOOK":
      return "border-[rgba(99,102,241,0.4)] bg-[rgba(99,102,241,0.12)] text-indigo-300";
    case "PHONE":
      return "border-[rgba(234,179,8,0.4)] bg-[rgba(234,179,8,0.12)] text-yellow-300";
    case "DIRECT":
      return "border-[rgba(255,128,0,0.4)] bg-[rgba(255,128,0,0.12)] text-[#FF8000]";
    case "OTHER":
      return "border-[rgba(156,163,175,0.4)] bg-[rgba(156,163,175,0.12)] text-gray-300";
    case "BLOCKED":
      return "border-[rgba(75,85,99,0.5)] bg-[rgba(75,85,99,0.2)] text-gray-400";
    default:
      return "border-[rgba(255,75,75,0.4)] bg-[rgba(255,75,75,0.12)] text-red-300";
  }
}

export default function OwnerCalendarPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [courts, setCourts] = useState<CourtDto[]>([]);
  const [courtId, setCourtId] = useState("");
  const [date, setDate] = useState(today);
  const [calendar, setCalendar] = useState<OwnerCourtCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [form, setForm] = useState({
    bookingSource: "ZALO" as BookingSource,
    customerName: "",
    customerPhone: "",
    startTime: "10:00",
    endTime: "11:00",
    notes: "",
  });

  const loadCourts = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    const res = await apiFetch<ApiResponse<CourtDto[]>>("/owner/courts", { token });
    const list = res.data ?? [];
    setCourts(list);
    if (!courtId && list.length > 0) {
      setCourtId(list[0].id);
    }
  }, [courtId]);

  const loadCalendar = useCallback(async () => {
    const token = getStoredToken();
    if (!token || !courtId || !date) return;

    setLoading(true);
    try {
      const res = await apiFetch<ApiResponse<OwnerCourtCalendar>>(
        `/owner/courts/${courtId}/calendar?date=${date}`,
        { token }
      );
      setCalendar(res.data ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tải lịch sân.");
      setCalendar(null);
    } finally {
      setLoading(false);
    }
  }, [courtId, date]);

  useEffect(() => {
    loadCourts().catch(console.error);
  }, [loadCourts]);

  useEffect(() => {
    if (courtId) {
      loadCalendar().catch(console.error);
    }
  }, [courtId, date, loadCalendar]);

  const slots = useMemo(() => {
    if (!calendar) return [];

    const result: {
      start: string;
      end: string;
      source: string;
      label: string;
      entry?: CourtCalendarEntry;
      available: boolean;
      isPast: boolean;
    }[] = [];

    let current = calendar.openingTime;
    const closing = calendar.closingTime;

    while (parseTime(current) < parseTime(closing)) {
      const end = addMinutes(current, 30);
      if (parseTime(end) > parseTime(closing)) break;

      const entry = calendar.entries.find((e) => overlaps(current, end, e));
      let source = "AVAILABLE";
      let label = SOURCE_LABELS.AVAILABLE;

      if (entry) {
        if (entry.entryType === "BLOCK") {
          source = "BLOCKED";
          label = SOURCE_LABELS.BLOCKED;
        } else {
          source = entry.bookingSource ?? "OTHER";
          label = SOURCE_LABELS[source] ?? source;
          if (entry.customerName) {
            label = `${label} — ${entry.customerName}`;
          }
        }
      }

      result.push({
        start: current,
        end,
        source,
        label,
        entry,
        available: !entry,
        isPast: isSlotInPast(calendar.date, current),
      });

      current = end;
    }

    return result;
  }, [calendar, date]);

  const openFormForSlot = (start: string, end: string) => {
    setSelectedSlot({ start, end });
    setForm((prev) => ({
      ...prev,
      startTime: start,
      endTime: end,
    }));
    setFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast.error("Vui lòng nhập tên và số điện thoại khách.");
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    setFormOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirmCreate = async () => {
    const token = getStoredToken();
    if (!token || !courtId) return;

    setSaving(true);
    try {
      const payload: CreateExternalBookingRequest = {
        courtId,
        bookingDate: date,
        startTime: form.startTime,
        endTime: form.endTime,
        bookingSource: form.bookingSource,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        notes: form.notes.trim() || undefined,
      };

      await apiFetch("/owner/bookings/external", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      });

      toast.success(
        "Đã thêm lịch thành công. Khung giờ này hiện không thể được đặt bởi người dùng MATCHOP."
      );
      setConfirmOpen(false);
      setForm({
        bookingSource: "ZALO",
        customerName: "",
        customerPhone: "",
        startTime: "10:00",
        endTime: "11:00",
        notes: "",
      });
      await loadCalendar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tạo lịch ngoài hệ thống.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEntry = async (bookingId: string) => {
    const token = getStoredToken();
    if (!token) return;

    setSaving(true);
    try {
      await apiFetch(`/owner/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ reason: "Hủy lịch ngoài hệ thống" }),
      });
      toast.success("Đã hủy lịch ngoài cho sân.");
      await loadCalendar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể hủy lịch.");
    } finally {
      setSaving(false);
    }
  };

  const selectedCourt = courts.find((c) => c.id === courtId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch sân thống nhất"
        description="Quản lý tất cả lịch đặt: MATCHOP, Zalo, Facebook, điện thoại và khóa sân."
      />

      <div className="flex flex-wrap gap-4 rounded-xl border border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] p-4">
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <Label htmlFor="court">Sân</Label>
          <Select value={courtId} onValueChange={setCourtId}>
            <SelectTrigger id="court" className="border-[rgba(134,210,50,0.28)] bg-[#141414] text-white">
              <SelectValue placeholder="Chọn sân" />
            </SelectTrigger>
            <SelectContent>
              {courts.map((court) => (
                <SelectItem key={court.id} value={court.id}>
                  {court.venueName ? `${court.venueName} — ` : ""}
                  {court.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[160px] space-y-1.5">
          <Label htmlFor="date">Ngày</Label>
          <Input
            id="date"
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[#C4C7C9]">
        {[
          ["AVAILABLE", "Trống"],
          ["MATCHOP", "MATCHOP"],
          ["ZALO", "Zalo"],
          ["FACEBOOK", "Facebook"],
          ["PHONE", "Điện thoại"],
          ["DIRECT", "Trực tiếp"],
          ["BLOCKED", "Đã khóa"],
        ].map(([key, label]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 ${slotStyle(key)}`}>
            <span className="h-2 w-2 rounded-full bg-current opacity-80" />
            {label}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#C4C7C9]">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Đang tải lịch sân...
        </div>
      ) : !calendar ? (
        <p className="py-8 text-center text-[#C4C7C9]">Không có dữ liệu lịch sân.</p>
      ) : (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            {calendar.courtName}
            <span className="ml-2 text-sm font-normal text-[#C4C7C9]">
              {calendar.venueName} · {calendar.date}
            </span>
          </h2>

          <div className="grid gap-2">
            {slots.map((slot) => (
              <div
                key={`${slot.start}-${slot.end}`}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                  slot.isPast && slot.available
                    ? "border-[rgba(156,163,175,0.25)] bg-[rgba(156,163,175,0.06)] text-[#C4C7C9]/60"
                    : slotStyle(slot.source)
                }`}
              >
                <div>
                  <p className="font-medium">
                    {slot.start} – {slot.end}
                  </p>
                  <p className="text-sm opacity-90">
                    {slot.isPast && slot.available ? "Đã qua" : slot.label}
                  </p>
                </div>

                <div className="flex gap-2">
                  {slot.available && !slot.isPast && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => openFormForSlot(slot.start, slot.end)}
                    >
                      <Plus className="h-4 w-4" />
                      Thêm lịch ngoài
                    </Button>
                  )}
                  {slot.entry?.bookingId &&
                    slot.entry.bookingSource &&
                    slot.entry.bookingSource !== "MATCHOP" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={saving}
                        onClick={() => handleCancelEntry(slot.entry!.bookingId!)}
                      >
                        Hủy lịch
                      </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm lịch ngoài hệ thống</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nguồn booking</Label>
              <Select
                value={form.bookingSource}
                onValueChange={(v) => setForm((f) => ({ ...f, bookingSource: v as BookingSource }))}
              >
                <SelectTrigger className="border-[rgba(134,210,50,0.28)] bg-[#141414] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerName">Tên khách</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerPhone">Số điện thoại</Label>
              <Input
                id="customerPhone"
                value={form.customerPhone}
                onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startTime">Giờ bắt đầu</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">Giờ kết thúc</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit">Tiếp tục</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận lịch ngoài hệ thống</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-[#C4C7C9]">
            <p>Bạn đang tạo lịch ngoài hệ thống:</p>
            <ul className="list-inside list-disc space-y-1 text-white">
              <li>Sân: {selectedCourt?.name ?? calendar?.courtName}</li>
              <li>
                Thời gian: {form.startTime} – {form.endTime} ({date})
              </li>
              <li>Nguồn: {SOURCE_LABELS[form.bookingSource]}</li>
              <li>Khách: {form.customerName}</li>
            </ul>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
              Quay lại
            </Button>
            <Button onClick={handleConfirmCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xác nhận lịch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
