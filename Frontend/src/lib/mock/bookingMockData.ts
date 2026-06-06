import type { Sport, Court, PriceRule } from "@/types/court";
import type { Venue } from "@/types/venue";
import type { Booking } from "@/types/booking";

// ─── Internal type ────────────────────────────────────────────────────────────
// Represents a time range that is already booked on a specific court + date.
// Used exclusively by the availability helper functions below.
interface BookedSlot {
  courtId: string;
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export type PaymentMethod = "BANK_TRANSFER" | "MOMO" | "VNPAY" | "CASH";

export interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  description: string;
  /** Lucide icon component name */
  iconName: string;
}

// ─── Booking draft ────────────────────────────────────────────────────────────
// Passed between /booking/summary → /booking/payment → /booking/success
// via sessionStorage under BOOKING_SESSION_KEY.

export const BOOKING_SESSION_KEY = "matchops_booking_draft" as const;

export interface BookingDraft {
  venueId: string;
  venueName: string;
  courtId: string;
  courtName: string;
  sportId: string;
  sportName: string;
  date: string;          // "YYYY-MM-DD"
  startTime: string;     // "HH:mm"
  endTime: string;       // "HH:mm"
  durationHours: number;
  pricePerHour: number;  // effective rate for display; may be an average if crossing rule boundaries
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  note?: string;
  paymentMethod?: PaymentMethod;
}

// ─── Booking confirmation ────────────────────────────────────────────────────
// Written to sessionStorage by /booking/payment, read by /booking/success.

export const BOOKING_CONFIRMATION_KEY = "matchops_booking_confirmation" as const;

// localStorage key for the persisted mock bookings list (across sessions).
export const LOCAL_BOOKINGS_KEY = "matchops_mock_bookings" as const;

export interface BookingConfirmation extends BookingDraft {
  bookingId: string;
  paymentMethod: PaymentMethod;
  status: "CONFIRMED";
  paymentStatus: "PAID";
  createdAt: string;
}

// ─── Sports ───────────────────────────────────────────────────────────────────

export const MOCK_SPORTS: Sport[] = [
  { id: "s1", name: "Cầu lông", status: "ACTIVE" },
  { id: "s2", name: "Bóng đá", status: "ACTIVE" },
  { id: "s3", name: "Tennis", status: "ACTIVE" },
  { id: "s4", name: "Bóng rổ", status: "ACTIVE" },
  { id: "s5", name: "Bóng chuyền", status: "ACTIVE" },
  { id: "s6", name: "Pickleball", status: "ACTIVE" },
];

// ─── Price rules ──────────────────────────────────────────────────────────────
// Declaration order matters: MOCK_PRICE_RULES must precede MOCK_COURTS.
// Rules are non-overlapping per dayType within a single court.
// Higher priority value = evaluated first when computing segment overlap.

export const MOCK_PRICE_RULES: PriceRule[] = [
  // ── Venue 1 · Sân A1 – Cầu lông (c1) ──────────────────────────────────────
  { id: "pr-c1-1", courtId: "c1", dayType: "WEEKDAY", startTime: "06:00", endTime: "17:00", pricePerHour: 80000,  priority: 2, status: "ACTIVE" },
  { id: "pr-c1-2", courtId: "c1", dayType: "WEEKDAY", startTime: "17:00", endTime: "22:00", pricePerHour: 120000, priority: 2, status: "ACTIVE" },
  { id: "pr-c1-3", courtId: "c1", dayType: "WEEKEND", startTime: "06:00", endTime: "22:00", pricePerHour: 150000, priority: 1, status: "ACTIVE" },

  // ── Venue 1 · Sân A2 – Cầu lông (c2) ──────────────────────────────────────
  { id: "pr-c2-1", courtId: "c2", dayType: "WEEKDAY", startTime: "06:00", endTime: "17:00", pricePerHour: 80000,  priority: 2, status: "ACTIVE" },
  { id: "pr-c2-2", courtId: "c2", dayType: "WEEKDAY", startTime: "17:00", endTime: "22:00", pricePerHour: 120000, priority: 2, status: "ACTIVE" },
  { id: "pr-c2-3", courtId: "c2", dayType: "WEEKEND", startTime: "06:00", endTime: "22:00", pricePerHour: 150000, priority: 1, status: "ACTIVE" },

  // ── Venue 1 · Sân B1 – Tennis (c3) ─────────────────────────────────────────
  { id: "pr-c3-1", courtId: "c3", dayType: "WEEKDAY", startTime: "06:00", endTime: "17:00", pricePerHour: 150000, priority: 2, status: "ACTIVE" },
  { id: "pr-c3-2", courtId: "c3", dayType: "WEEKDAY", startTime: "17:00", endTime: "22:00", pricePerHour: 200000, priority: 2, status: "ACTIVE" },
  { id: "pr-c3-3", courtId: "c3", dayType: "WEEKEND", startTime: "06:00", endTime: "22:00", pricePerHour: 250000, priority: 1, status: "ACTIVE" },

  // ── Venue 2 · Sân 5 người A – Bóng đá (c4) ─────────────────────────────────
  { id: "pr-c4-1", courtId: "c4", dayType: "WEEKDAY", startTime: "06:00", endTime: "17:00", pricePerHour: 200000, priority: 2, status: "ACTIVE" },
  { id: "pr-c4-2", courtId: "c4", dayType: "WEEKDAY", startTime: "17:00", endTime: "23:00", pricePerHour: 280000, priority: 2, status: "ACTIVE" },
  { id: "pr-c4-3", courtId: "c4", dayType: "WEEKEND", startTime: "06:00", endTime: "23:00", pricePerHour: 350000, priority: 1, status: "ACTIVE" },

  // ── Venue 2 · Sân 5 người B – Bóng đá (c5) ─────────────────────────────────
  { id: "pr-c5-1", courtId: "c5", dayType: "WEEKDAY", startTime: "06:00", endTime: "17:00", pricePerHour: 200000, priority: 2, status: "ACTIVE" },
  { id: "pr-c5-2", courtId: "c5", dayType: "WEEKDAY", startTime: "17:00", endTime: "23:00", pricePerHour: 280000, priority: 2, status: "ACTIVE" },
  { id: "pr-c5-3", courtId: "c5", dayType: "WEEKEND", startTime: "06:00", endTime: "23:00", pricePerHour: 350000, priority: 1, status: "ACTIVE" },

  // ── Venue 2 · Sân bóng rổ (c6) – flat rate all week ────────────────────────
  { id: "pr-c6-1", courtId: "c6", dayType: "ALL", startTime: "06:00", endTime: "23:00", pricePerHour: 100000, priority: 1, status: "ACTIVE" },

  // ── Venue 3 · Sân 1 – Tennis (c7) ──────────────────────────────────────────
  { id: "pr-c7-1", courtId: "c7", dayType: "WEEKDAY", startTime: "07:00", endTime: "21:00", pricePerHour: 180000, priority: 2, status: "ACTIVE" },
  { id: "pr-c7-2", courtId: "c7", dayType: "WEEKEND", startTime: "07:00", endTime: "21:00", pricePerHour: 250000, priority: 1, status: "ACTIVE" },

  // ── Venue 3 · Sân 2 – Tennis (c8) ──────────────────────────────────────────
  { id: "pr-c8-1", courtId: "c8", dayType: "WEEKDAY", startTime: "07:00", endTime: "21:00", pricePerHour: 180000, priority: 2, status: "ACTIVE" },
  { id: "pr-c8-2", courtId: "c8", dayType: "WEEKEND", startTime: "07:00", endTime: "21:00", pricePerHour: 250000, priority: 1, status: "ACTIVE" },
];

// ─── Courts ───────────────────────────────────────────────────────────────────
// priceRules are embedded here for convenience; they mirror MOCK_PRICE_RULES.

export const MOCK_COURTS: Court[] = [
  // ── Venue 1 ─────────────────────────────────────────────────────────────────
  {
    id: "c1",
    venueId: "1",
    sportId: "s1",
    name: "Sân A1 – Cầu lông",
    type: "Tiêu chuẩn",
    capacity: 4,
    locationNote: "Tầng 1, khu A",
    description: "Sàn gỗ PVC chuyên dụng, đèn chiếu sáng LED 600W, lưới Victor.",
    status: "ACTIVE",
    priceRules: MOCK_PRICE_RULES.filter((r) => r.courtId === "c1"),
    createdAt: "2025-01-10T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "c2",
    venueId: "1",
    sportId: "s1",
    name: "Sân A2 – Cầu lông",
    type: "Tiêu chuẩn",
    capacity: 4,
    locationNote: "Tầng 1, khu A",
    description: "Sàn gỗ PVC chuyên dụng, đèn chiếu sáng LED 600W, lưới Yonex.",
    status: "ACTIVE",
    priceRules: MOCK_PRICE_RULES.filter((r) => r.courtId === "c2"),
    createdAt: "2025-01-10T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "c3",
    venueId: "1",
    sportId: "s3",
    name: "Sân B1 – Tennis",
    type: "Mặt cứng",
    capacity: 4,
    locationNote: "Tầng 1, khu B",
    description: "Hard court chuẩn ITF, lưới Tretorn, đèn chiếu sáng 1000W.",
    status: "ACTIVE",
    priceRules: MOCK_PRICE_RULES.filter((r) => r.courtId === "c3"),
    createdAt: "2025-01-10T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
  },

  // ── Venue 2 ─────────────────────────────────────────────────────────────────
  {
    id: "c4",
    venueId: "2",
    sportId: "s2",
    name: "Sân 5 người A – Bóng đá",
    type: "Cỏ nhân tạo",
    capacity: 10,
    locationNote: "Khu A – Ngoài trời có mái che",
    description: "Cỏ nhân tạo thế hệ mới, 4 cột đèn chiếu sáng, khung thành chuẩn.",
    status: "ACTIVE",
    priceRules: MOCK_PRICE_RULES.filter((r) => r.courtId === "c4"),
    createdAt: "2025-02-15T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "c5",
    venueId: "2",
    sportId: "s2",
    name: "Sân 5 người B – Bóng đá",
    type: "Cỏ nhân tạo",
    capacity: 10,
    locationNote: "Khu B – Ngoài trời",
    description: "Cỏ nhân tạo thế hệ mới, 4 cột đèn chiếu sáng, khu vực thay đồ riêng.",
    status: "ACTIVE",
    priceRules: MOCK_PRICE_RULES.filter((r) => r.courtId === "c5"),
    createdAt: "2025-02-15T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "c6",
    venueId: "2",
    sportId: "s4",
    name: "Sân bóng rổ – Bóng rổ",
    type: "Sàn gỗ",
    capacity: 10,
    locationNote: "Nhà thi đấu trong nhà",
    description: "Sàn parquet chuẩn NBA, 2 trụ bóng rổ, hệ thống bảng điện tử.",
    status: "ACTIVE",
    priceRules: MOCK_PRICE_RULES.filter((r) => r.courtId === "c6"),
    createdAt: "2025-02-15T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
  },

  // ── Venue 3 ─────────────────────────────────────────────────────────────────
  {
    id: "c7",
    venueId: "3",
    sportId: "s3",
    name: "Sân 1 – Tennis",
    type: "Sân đất nện",
    capacity: 4,
    locationNote: "Ngoài trời, có mái che kéo",
    description: "Clay court chuẩn Roland Garros, lưới Head, khu vực khán giả.",
    status: "ACTIVE",
    priceRules: MOCK_PRICE_RULES.filter((r) => r.courtId === "c7"),
    createdAt: "2025-03-01T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "c8",
    venueId: "3",
    sportId: "s3",
    name: "Sân 2 – Tennis",
    type: "Mặt cứng",
    capacity: 4,
    locationNote: "Trong nhà, máy lạnh",
    description: "Hard court trong nhà có điều hòa trung tâm, lưới Wilson, ánh sáng 2000W.",
    status: "ACTIVE",
    priceRules: MOCK_PRICE_RULES.filter((r) => r.courtId === "c8"),
    createdAt: "2025-03-01T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
  },
];

// ─── Venues ───────────────────────────────────────────────────────────────────
// IDs "1", "2", "3" match the existing /venues list page routing.

export const MOCK_VENUES: Venue[] = [
  {
    id: "1",
    ownerId: "owner-001",
    name: "Sân cầu lông Phú Mỹ Hưng",
    address: "12 Nguyễn Lương Bằng",
    city: "TP.HCM",
    district: "Quận 7",
    ward: "Phú Mỹ Hưng",
    description:
      "Cơ sở thể thao hiện đại với 2 sân cầu lông và 1 sân tennis được trang bị đèn chiếu sáng LED, sàn gỗ PVC chuyên dụng. Bãi gửi xe rộng, nước uống miễn phí, phòng thay đồ nam/nữ.",
    openingTime: "06:00",
    closingTime: "22:00",
    status: "ACTIVE",
    createdAt: "2025-01-10T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
    courts: MOCK_COURTS.filter((c) => c.venueId === "1"),
  },
  {
    id: "2",
    ownerId: "owner-002",
    name: "SportHub Bình Thạnh",
    address: "55 Phan Văn Trị",
    city: "TP.HCM",
    district: "Bình Thạnh",
    ward: "Phường 11",
    description:
      "Phức hợp thể thao đa năng với 2 sân bóng đá cỏ nhân tạo và 1 sân bóng rổ trong nhà. Hệ thống chiếu sáng cột đèn, căng tin tiện lợi, bãi giữ xe rộng.",
    openingTime: "05:30",
    closingTime: "23:00",
    status: "ACTIVE",
    createdAt: "2025-02-15T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
    courts: MOCK_COURTS.filter((c) => c.venueId === "2"),
  },
  {
    id: "3",
    ownerId: "owner-003",
    name: "Sân tennis Tân Bình Elite",
    address: "88 Trường Chinh",
    city: "TP.HCM",
    district: "Tân Bình",
    ward: "Phường 15",
    description:
      "Chuyên biệt về tennis với 2 loại mặt sân: clay ngoài trời và hard court trong nhà có điều hòa. Đội ngũ nhân viên chuyên nghiệp, máy bắn bóng cho thuê.",
    openingTime: "07:00",
    closingTime: "21:00",
    status: "ACTIVE",
    createdAt: "2025-03-01T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
    courts: MOCK_COURTS.filter((c) => c.venueId === "3"),
  },
];

// ─── Booked time slots ────────────────────────────────────────────────────────
// Simulates existing reservations for availability checks.
// Not exported – consumed only by the helper functions below.

const MOCK_BOOKED_SLOTS: BookedSlot[] = [
  // c1 – Sân A1 Cầu lông · Tuesday 2026-06-03
  { courtId: "c1", date: "2026-06-03", startTime: "09:00", endTime: "10:30" },
  { courtId: "c1", date: "2026-06-03", startTime: "14:00", endTime: "15:30" },
  { courtId: "c1", date: "2026-06-03", startTime: "19:00", endTime: "20:00" },
  // c1 – Saturday 2026-06-07
  { courtId: "c1", date: "2026-06-07", startTime: "08:00", endTime: "09:30" },
  { courtId: "c1", date: "2026-06-07", startTime: "16:00", endTime: "18:00" },
  { courtId: "c1", date: "2026-06-07", startTime: "20:00", endTime: "21:30" },

  // c2 – Sân A2 Cầu lông · Tuesday 2026-06-03
  { courtId: "c2", date: "2026-06-03", startTime: "07:00", endTime: "08:30" },
  { courtId: "c2", date: "2026-06-03", startTime: "11:00", endTime: "12:30" },

  // c4 – Sân 5 người A Bóng đá · Tuesday 2026-06-03
  { courtId: "c4", date: "2026-06-03", startTime: "08:00", endTime: "10:00" },
  { courtId: "c4", date: "2026-06-03", startTime: "15:00", endTime: "17:00" },
  { courtId: "c4", date: "2026-06-03", startTime: "20:00", endTime: "22:00" },

  // c7 – Sân 1 Tennis · Thursday 2026-06-05
  { courtId: "c7", date: "2026-06-05", startTime: "10:00", endTime: "12:00" },
  { courtId: "c7", date: "2026-06-05", startTime: "17:00", endTime: "19:00" },
];

// ─── My Bookings ──────────────────────────────────────────────────────────────
// One entry per BookingStatus variant for comprehensive My Bookings UI testing.
// Prices are verified against MOCK_PRICE_RULES.

export const MOCK_MY_BOOKINGS: Booking[] = [
  {
    // Wednesday 2026-06-10 · c1 · 10:00–11:30 · WEEKDAY 06–17 · 80k/hr · 1.5hr = 120k
    id: "bk-001",
    userId: "user-001",
    venueId: "1",
    courtId: "c1",
    sportId: "s1",
    bookingDate: "2026-06-10",
    startTime: "10:00",
    endTime: "11:30",
    totalPrice: 120000,
    status: "CONFIRMED",
    paymentStatus: "PAID",
    bookingType: "ONLINE",
    customerName: "Nguyễn Văn Tâm",
    customerPhone: "0901234567",
    createdAt: "2026-06-01T08:30:00Z",
    venueName: "Sân cầu lông Phú Mỹ Hưng",
    courtName: "Sân A1 – Cầu lông",
    sportName: "Cầu lông",
  },
  {
    // Friday 2026-06-05 · c4 · 18:00–20:00 · WEEKDAY 17–23 · 280k/hr · 2hr = 560k
    id: "bk-002",
    userId: "user-001",
    venueId: "2",
    courtId: "c4",
    sportId: "s2",
    bookingDate: "2026-06-05",
    startTime: "18:00",
    endTime: "20:00",
    totalPrice: 560000,
    status: "PENDING_PAYMENT",
    paymentStatus: "UNPAID",
    bookingType: "ONLINE",
    customerName: "Nguyễn Văn Tâm",
    customerPhone: "0901234567",
    expireAt: "2026-06-03T20:30:00Z",
    createdAt: "2026-06-01T09:00:00Z",
    venueName: "SportHub Bình Thạnh",
    courtName: "Sân 5 người A – Bóng đá",
    sportName: "Bóng đá",
  },
  {
    // Tuesday 2026-05-20 · c7 · 09:00–11:00 · WEEKDAY 07–21 · 180k/hr · 2hr = 360k
    id: "bk-003",
    userId: "user-001",
    venueId: "3",
    courtId: "c7",
    sportId: "s3",
    bookingDate: "2026-05-20",
    startTime: "09:00",
    endTime: "11:00",
    totalPrice: 360000,
    status: "COMPLETED",
    paymentStatus: "PAID",
    bookingType: "ONLINE",
    customerName: "Nguyễn Văn Tâm",
    customerPhone: "0901234567",
    createdAt: "2026-05-18T10:00:00Z",
    venueName: "Sân tennis Tân Bình Elite",
    courtName: "Sân 1 – Tennis",
    sportName: "Tennis",
  },
  {
    // Thursday 2026-05-15 · c2 · 14:00–15:30 · WEEKDAY 06–17 · 80k/hr · 1.5hr = 120k
    id: "bk-004",
    userId: "user-001",
    venueId: "1",
    courtId: "c2",
    sportId: "s1",
    bookingDate: "2026-05-15",
    startTime: "14:00",
    endTime: "15:30",
    totalPrice: 120000,
    status: "CANCELLED_BY_USER",
    paymentStatus: "REFUNDED",
    bookingType: "ONLINE",
    customerName: "Nguyễn Văn Tâm",
    customerPhone: "0901234567",
    createdAt: "2026-05-13T14:00:00Z",
    venueName: "Sân cầu lông Phú Mỹ Hưng",
    courtName: "Sân A2 – Cầu lông",
    sportName: "Cầu lông",
  },
  {
    // Sunday 2026-05-10 · c4 · 17:00–19:00 · WEEKEND 06–23 · 350k/hr · 2hr = 700k
    id: "bk-005",
    userId: "user-001",
    venueId: "2",
    courtId: "c4",
    sportId: "s2",
    bookingDate: "2026-05-10",
    startTime: "17:00",
    endTime: "19:00",
    totalPrice: 700000,
    status: "EXPIRED",
    paymentStatus: "UNPAID",
    bookingType: "ONLINE",
    customerName: "Nguyễn Văn Tâm",
    customerPhone: "0901234567",
    expireAt: "2026-05-10T17:30:00Z",
    createdAt: "2026-05-10T16:00:00Z",
    venueName: "SportHub Bình Thạnh",
    courtName: "Sân 5 người A – Bóng đá",
    sportName: "Bóng đá",
  },
  {
    // Tuesday 2026-05-05 · c8 · 16:00–17:30 · WEEKDAY 07–21 · 180k/hr · 1.5hr = 270k
    id: "bk-006",
    userId: "user-001",
    venueId: "3",
    courtId: "c8",
    sportId: "s3",
    bookingDate: "2026-05-05",
    startTime: "16:00",
    endTime: "17:30",
    totalPrice: 270000,
    status: "NO_SHOW",
    paymentStatus: "PAID",
    bookingType: "ONLINE",
    customerName: "Nguyễn Văn Tâm",
    customerPhone: "0901234567",
    createdAt: "2026-05-03T11:00:00Z",
    venueName: "Sân tennis Tân Bình Elite",
    courtName: "Sân 2 – Tennis",
    sportName: "Tennis",
  },
];

// ─── Payment methods ──────────────────────────────────────────────────────────

export const MOCK_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "BANK_TRANSFER",
    label: "Chuyển khoản ngân hàng",
    description: "Thanh toán qua Internet Banking hoặc chuyển khoản trực tiếp",
    iconName: "Building2",
  },
  {
    id: "MOMO",
    label: "Ví MoMo",
    description: "Thanh toán nhanh qua ví điện tử MoMo",
    iconName: "Wallet",
  },
  {
    id: "VNPAY",
    label: "VNPay",
    description: "Cổng thanh toán VNPay – hỗ trợ thẻ ATM, VISA, Mastercard",
    iconName: "CreditCard",
  },
  {
    id: "CASH",
    label: "Tiền mặt tại sân",
    description: "Thanh toán khi đến sân. Vui lòng có mặt trước 15 phút",
    iconName: "Banknote",
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

/** Converts "HH:mm" to total minutes from midnight. */
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Converts total minutes from midnight to "HH:mm". */
function toTimeString(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Generates an array of "HH:mm" time strings at 30-minute intervals,
 * inclusive of both openingTime and closingTime.
 *
 * Used to populate start-time and end-time dropdowns in the booking panel.
 * The caller is responsible for filtering out invalid combinations
 * (e.g. end time must be after start time).
 */
export function generateTimeOptions(openingTime: string, closingTime: string): string[] {
  const start = toMinutes(openingTime);
  const end = toMinutes(closingTime);
  const options: string[] = [];
  for (let t = start; t <= end; t += 30) {
    options.push(toTimeString(t));
  }
  return options;
}

/** Returns the booking duration in hours as a decimal (e.g. 90 min → 1.5). */
export function getDurationHours(startTime: string, endTime: string): number {
  return (toMinutes(endTime) - toMinutes(startTime)) / 60;
}

export function getMockVenueById(id: string): Venue | undefined {
  return MOCK_VENUES.find((v) => v.id === id);
}

export function getMockCourtsForVenue(venueId: string): Court[] {
  return MOCK_COURTS.filter((c) => c.venueId === venueId);
}

export function getMockCourtById(courtId: string): Court | undefined {
  return MOCK_COURTS.find((c) => c.id === courtId);
}

export function getMockSportById(sportId: string): Sport | undefined {
  return MOCK_SPORTS.find((s) => s.id === sportId);
}

export function getMockPriceRulesForCourt(courtId: string): PriceRule[] {
  return MOCK_PRICE_RULES.filter((r) => r.courtId === courtId && r.status === "ACTIVE");
}

export function getMockBookedSlotsForDate(courtId: string, date: string): BookedSlot[] {
  return MOCK_BOOKED_SLOTS.filter((s) => s.courtId === courtId && s.date === date);
}

/**
 * Returns true if [startTime, endTime) overlaps with any existing booking
 * on the given court and date.
 */
export function isTimeRangeBooked(
  courtId: string,
  date: string,
  startTime: string,
  endTime: string,
): boolean {
  const reqStart = toMinutes(startTime);
  const reqEnd = toMinutes(endTime);
  return getMockBookedSlotsForDate(courtId, date).some((slot) => {
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);
    return reqStart < slotEnd && reqEnd > slotStart;
  });
}

/**
 * Calculates the total booking price for a given court, date, and time range.
 *
 * Supports bookings that span multiple price-rule windows (e.g. 16:00–18:00
 * crossing a 17:00 rate boundary on a weekday). Each overlapping segment is
 * billed at its own rule's pricePerHour.
 */
export function calculateBookingPrice(
  courtId: string,
  date: string,
  startTime: string,
  endTime: string,
): number {
  const rules = getMockPriceRulesForCourt(courtId);
  const day = new Date(date).getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = day === 0 || day === 6;

  const applicableRules = rules.filter(
    (r) =>
      r.dayType === "ALL" ||
      (isWeekend && r.dayType === "WEEKEND") ||
      (!isWeekend && r.dayType === "WEEKDAY"),
  );

  const reqStart = toMinutes(startTime);
  const reqEnd = toMinutes(endTime);

  let total = 0;
  for (const rule of applicableRules) {
    const ruleStart = toMinutes(rule.startTime);
    const ruleEnd = toMinutes(rule.endTime);
    const overlapStart = Math.max(reqStart, ruleStart);
    const overlapEnd = Math.min(reqEnd, ruleEnd);
    if (overlapEnd > overlapStart) {
      total += ((overlapEnd - overlapStart) / 60) * rule.pricePerHour;
    }
  }

  return Math.round(total);
}
