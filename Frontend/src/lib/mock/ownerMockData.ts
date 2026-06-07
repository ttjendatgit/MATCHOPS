import type { BookingStatus } from "@/types/booking";
import type { VenueStatus } from "@/types/venue";

export const mockKpis = {
  revenueToday: 4850000,
  bookingsToday: 23,
  occupancyRate: 78,
  activeVenues: { current: 2, total: 3 },
  pendingApprovals: 1,
};

export const mockRevenueDelta = {
  revenue: { value: 12, positive: true, label: "so hôm qua" },
  bookings: { value: 3, positive: true, label: "so hôm qua" },
  occupancy: { value: 5, positive: false, label: "so tuần trước" },
};

export const mockRevenueChart: { day: string; value: number; label: string }[] = [
  { day: "T2", value: 64, label: "3.2M" },
  { day: "T3", value: 40, label: "2.0M" },
  { day: "T4", value: 84, label: "4.2M" },
  { day: "T5", value: 54, label: "2.7M" },
  { day: "T6", value: 90, label: "4.5M" },
  { day: "T7", value: 100, label: "5.0M" },
  { day: "CN", value: 72, label: "3.6M" },
];

export const mockRecentBookings: {
  id: string;
  customerName: string;
  venueName: string;
  courtName: string;
  time: string;
  status: BookingStatus;
  amount: number;
}[] = [
  {
    id: "bk1",
    customerName: "Nguyễn Văn Hùng",
    venueName: "Sân cầu lông Phú Mỹ Hưng",
    courtName: "Sân A1",
    time: "08:00 – 10:00",
    status: "CONFIRMED",
    amount: 160000,
  },
  {
    id: "bk2",
    customerName: "Trần Thị Mai",
    venueName: "Sân cầu lông Phú Mỹ Hưng",
    courtName: "Sân B2",
    time: "14:00 – 16:00",
    status: "PENDING_PAYMENT",
    amount: 200000,
  },
  {
    id: "bk3",
    customerName: "Lê Hoàng Nam",
    venueName: "SportHub Bình Thạnh",
    courtName: "Sân C1",
    time: "07:00 – 09:00",
    status: "CONFIRMED",
    amount: 160000,
  },
  {
    id: "bk4",
    customerName: "Phạm Thu Hà",
    venueName: "SportHub Bình Thạnh",
    courtName: "Sân D1",
    time: "16:00 – 18:00",
    status: "COMPLETED",
    amount: 200000,
  },
  {
    id: "bk5",
    customerName: "Vũ Minh Khoa",
    venueName: "Sân cầu lông Phú Mỹ Hưng",
    courtName: "Sân A3",
    time: "18:00 – 20:00",
    status: "CANCELLED_BY_USER",
    amount: 160000,
  },
];

export const mockVenueApprovals: {
  id: string;
  name: string;
  status: VenueStatus;
}[] = [
  { id: "v1", name: "Sân cầu lông Phú Mỹ Hưng", status: "ACTIVE" },
  { id: "v2", name: "SportHub Bình Thạnh", status: "PENDING_APPROVAL" },
  { id: "v3", name: "Arena Gò Vấp", status: "DRAFT" },
];

export const mockChecklist: { id: string; label: string; done: boolean }[] = [
  { id: "profile", label: "Hồ sơ chủ sân", done: true },
  { id: "bank", label: "Thông tin ngân hàng", done: true },
  { id: "photos", label: "Ảnh cụm sân", done: false },
  { id: "pricing", label: "Bảng giá", done: false },
  { id: "schedule", label: "Khung giờ hoạt động", done: true },
];

export const mockQuickActions: {
  label: string;
  href: string;
  description: string;
}[] = [
  { label: "Tạo cụm sân mới", href: "/owner/venues/new", description: "Thêm địa điểm mới" },
  { label: "Thêm sân", href: "/owner/venues", description: "Thêm sân vào cụm có sẵn" },
  { label: "Chặn khung giờ", href: "/owner/pricing", description: "Khoá lịch không cho đặt" },
  { label: "Xem lịch đặt", href: "/owner/bookings", description: "Toàn bộ đặt sân" },
];
