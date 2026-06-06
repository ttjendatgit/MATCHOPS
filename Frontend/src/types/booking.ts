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
  customerName?: string;
  customerPhone?: string;
  expireAt?: string;
  note?: string;
  createdAt: string;
  venueName?: string;
  courtName?: string;
  sportName?: string;
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
