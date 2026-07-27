import { Badge } from "@/components/ui/badge";
import {
  BookingStatus,
  BookingPaymentStatus,
} from "@/types/booking";
import { VenueStatus } from "@/types/venue";
import { CourtStatus } from "@/types/court";
import { CoachProfileStatus } from "@/types/coach";

const venueStatusMap: Record<VenueStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "muted" | "info" }> = {
  DRAFT:            { label: "Nháp",          variant: "muted" },
  PENDING_APPROVAL: { label: "Chờ duyệt",     variant: "warning" },
  ACTIVE:           { label: "Hoạt động",     variant: "success" },
  INACTIVE:         { label: "Tạm dừng",      variant: "muted" },
  SUSPENDED:        { label: "Đã khoá",        variant: "destructive" },
  REJECTED:         { label: "Từ chối",        variant: "destructive" },
};

const courtStatusMap: Record<CourtStatus, { label: string; variant: "success" | "muted" | "warning" }> = {
  ACTIVE:      { label: "Hoạt động",  variant: "success" },
  INACTIVE:    { label: "Tạm dừng",   variant: "muted" },
  MAINTENANCE: { label: "Bảo trì",   variant: "warning" },
};

const bookingStatusMap: Record<BookingStatus, { label: string; variant: "warning" | "success" | "muted" | "destructive" | "info" }> = {
  PENDING_PAYMENT:    { label: "Chờ thanh toán", variant: "warning" },
  CONFIRMED:          { label: "Đã xác nhận",    variant: "success" },
  COMPLETED:          { label: "Hoàn thành",     variant: "info" },
  CANCELLED_BY_USER:  { label: "Huỷ bởi KH",    variant: "destructive" },
  CANCELLED_BY_OWNER: { label: "Huỷ bởi chủ",   variant: "destructive" },
  EXPIRED:            { label: "Hết hạn",        variant: "muted" },
  NO_SHOW:            { label: "Không đến",      variant: "muted" },
};

const paymentStatusMap: Record<BookingPaymentStatus, { label: string; variant: "warning" | "success" | "destructive" | "info" }> = {
  UNPAID:   { label: "Chưa thanh toán", variant: "warning" },
  PAID:     { label: "Đã thanh toán",   variant: "success" },
  FAILED:   { label: "Thất bại",        variant: "destructive" },
  REFUNDED: { label: "Đã hoàn tiền",    variant: "info" },
};

export function VenueStatusBadge({ status }: { status: VenueStatus }) {
  const config = venueStatusMap[status];
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}

export function CourtStatusBadge({ status }: { status: CourtStatus }) {
  const config = courtStatusMap[status];
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = bookingStatusMap[status];
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: BookingPaymentStatus }) {
  const config = paymentStatusMap[status];
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}

const coachStatusMap: Record<CoachProfileStatus, { label: string; variant: "warning" | "success" | "destructive" | "muted" }> = {
  PENDING_APPROVAL: { label: "Chờ duyệt", variant: "warning" },
  ACTIVE:            { label: "Đã duyệt", variant: "success" },
  REJECTED:          { label: "Từ chối",  variant: "destructive" },
  SUSPENDED:         { label: "Tạm khóa", variant: "muted" },
};

export function CoachStatusBadge({ status }: { status: CoachProfileStatus }) {
  const config = coachStatusMap[status];
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}
