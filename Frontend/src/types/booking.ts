export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED_BY_USER"
  | "CANCELLED_BY_OWNER"
  | "EXPIRED"
  | "NO_SHOW";

export type BookingPaymentStatus = "UNPAID" | "PAID" | "FAILED" | "REFUNDED";
export type BookingType = "ONLINE" | "OFFLINE" | "ADMIN";

export type BookingSource =
  | "MATCHOP"
  | "ZALO"
  | "FACEBOOK"
  | "PHONE"
  | "DIRECT"
  | "OTHER";

export interface Booking {
  id: string;
  userId?: string;
  ownerId?: string;
  venueId: string;
  courtId: string;
  sportId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  bookingType: BookingType;
  bookingSource?: BookingSource;
  customerName?: string;
  customerPhone?: string;
  expireAt?: string;
  note?: string;
  createdAt: string;
  venueName?: string;
  courtName?: string;
  sportName?: string;
}

export interface CourtCalendarEntry {
  bookingId?: string;
  blockId?: string;
  entryType: "BOOKING" | "BLOCK";
  startTime: string;
  endTime: string;
  status: string;
  bookingSource?: BookingSource;
  customerName?: string;
  note?: string;
}

export interface OwnerCourtCalendar {
  courtId: string;
  courtName: string;
  venueName: string;
  date: string;
  openingTime: string;
  closingTime: string;
  entries: CourtCalendarEntry[];
}

export interface CreateExternalBookingRequest {
  courtId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  bookingSource: BookingSource;
  customerName: string;
  customerPhone: string;
  notes?: string;
}

export interface CreateBookingRequest {
  courtId: string;
  sportId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  note?: string;
  customerName?: string;
  customerPhone?: string;
}
