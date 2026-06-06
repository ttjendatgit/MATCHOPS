import type { Booking, BookingStatus, BookingPaymentStatus } from "@/types/booking";
import {
  getDurationHours,
  type BookingConfirmation,
  type PaymentMethod,
} from "@/lib/mock/bookingMockData";

// ─── Normalised display type ──────────────────────────────────────────────────
// Unified shape for both BookingConfirmation (localStorage) and Booking (mock).

export interface DisplayBooking {
  id: string;
  venueName: string;
  courtName: string;
  sportName: string;
  date: string;           // "YYYY-MM-DD"
  startTime: string;      // "HH:mm"
  endTime: string;        // "HH:mm"
  durationHours: number;
  totalPrice: number;
  paymentMethod?: PaymentMethod;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  venueId?: string;
  courtId?: string;
  note?: string;
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

export type FilterKey = "ALL" | "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export const FILTER_TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING_PAYMENT", label: "Chờ thanh toán" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã huỷ" },
];

const CANCELLED_STATUSES: BookingStatus[] = [
  "CANCELLED_BY_USER",
  "CANCELLED_BY_OWNER",
  "EXPIRED",
  "NO_SHOW",
];

export function matchesFilter(booking: DisplayBooking, filter: FilterKey): boolean {
  if (filter === "ALL") return true;
  if (filter === "CANCELLED") return CANCELLED_STATUSES.includes(booking.status);
  // At this point filter is narrowed to "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED"
  return booking.status === filter;
}

// ─── Payment labels ───────────────────────────────────────────────────────────

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  MOMO: "Ví MoMo",
  VNPAY: "VNPay",
  CASH: "Tiền mặt tại sân",
};

export const PAYMENT_LABELS_SHORT: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Chuyển khoản",
  MOMO: "MoMo",
  VNPAY: "VNPay",
  CASH: "Tiền mặt",
};

// ─── Normalizers ──────────────────────────────────────────────────────────────

export function normalizeConfirmation(c: BookingConfirmation): DisplayBooking {
  return {
    id: c.bookingId,
    venueName: c.venueName,
    courtName: c.courtName,
    sportName: c.sportName,
    date: c.date,
    startTime: c.startTime,
    endTime: c.endTime,
    durationHours: c.durationHours,
    totalPrice: c.totalPrice,
    paymentMethod: c.paymentMethod,
    status: c.status,
    paymentStatus: c.paymentStatus,
    customerName: c.customerName,
    customerPhone: c.customerPhone,
    createdAt: c.createdAt,
    venueId: c.venueId,
    courtId: c.courtId,
    note: c.note,
  };
}

export function normalizeBooking(b: Booking): DisplayBooking {
  const start = b.startTime.substring(0, 5);
  const end = b.endTime.substring(0, 5);
  return {
    id: b.id,
    venueName: b.venueName ?? "—",
    courtName: b.courtName ?? "—",
    sportName: b.sportName ?? "—",
    date: b.bookingDate,
    startTime: start,
    endTime: end,
    durationHours: getDurationHours(start, end),
    totalPrice: b.totalPrice,
    paymentMethod: undefined,
    status: b.status,
    paymentStatus: b.paymentStatus,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    createdAt: b.createdAt,
    venueId: b.venueId,
    courtId: b.courtId,
    note: b.note,
  };
}

// ─── Date / time helpers ──────────────────────────────────────────────────────

export function formatDuration(hours: number): string {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

export function formatDateVN(dateStr: string): string {
  const labels = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const d = new Date(`${dateStr}T12:00:00`);
  const parts = dateStr.split("-");
  return `${labels[d.getDay()]}, ${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatDateVNShort(dateStr: string): string {
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const d = new Date(`${dateStr}T12:00:00`);
  const parts = dateStr.split("-");
  return `${labels[d.getDay()]} ${parts[2]}/${parts[1]}`;
}
