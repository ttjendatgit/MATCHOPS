"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { Download, FileText, Users, CreditCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import { downloadCSV, formatDateForExport, formatCurrencyForExport } from "@/lib/exportUtils";
import type { ApiResponse } from "@/types/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminSubscriptionDto {
  subscriptionId: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  userRole: string;
  planId: string;
  planName: string;
  planTier: string;
  status: string;
  planPrice: number;
  startedAt: string;
  expiresAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
}

interface MembershipStatisticsDto {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  pendingSubscriptions: number;
  totalRevenue: number;
  freePlanUsers: number;
  paidPlanUsers: number;
}

interface BookingReportResponseDto {
  generatedAt: string;
  fromDate?: string;
  toDate?: string;
  totalBookings: number;
  completedBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  completedRevenue: number;
  bookings: {
    id: string;
    venueName: string;
    courtName: string;
    sportName: string;
    customerName?: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    totalPrice: number;
    status: string;
    bookingType: string;
    createdAt: string;
  }[];
}

interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminSettingsPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExportMembershipReport = async () => {
    const token = getStoredToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    setExporting("membership");
    try {
      const res = await apiFetch<ApiResponse<{ subscriptions: AdminSubscriptionDto[]; statistics: MembershipStatisticsDto }>>(
        "/admin/reports/membership",
        { token }
      );

      if (res.success && res.data?.subscriptions) {
        const { subscriptions } = res.data;

        const columns = [
          { key: "userFullName" as keyof AdminSubscriptionDto, header: "Họ tên" },
          { key: "userEmail" as keyof AdminSubscriptionDto, header: "Email" },
          { key: "userRole" as keyof AdminSubscriptionDto, header: "Vai trò" },
          { key: "planName" as keyof AdminSubscriptionDto, header: "Gói" },
          { key: "planTier" as keyof AdminSubscriptionDto, header: "Tier" },
          { key: "status" as keyof AdminSubscriptionDto, header: "Trạng thái" },
          { key: "planPrice" as keyof AdminSubscriptionDto, header: "Giá/tháng" },
          { key: "startedAt" as keyof AdminSubscriptionDto, header: "Ngày bắt đầu" },
          { key: "expiresAt" as keyof AdminSubscriptionDto, header: "Ngày hết hạn" },
        ];

        // Transform data for export
        const exportData = subscriptions.map((sub) => ({
          ...sub,
          planPrice: formatCurrencyForExport(sub.planPrice),
          startedAt: formatDateForExport(sub.startedAt),
          expiresAt: formatDateForExport(sub.expiresAt),
        }));

        downloadCSV(exportData, columns, "membership_report");
        toast.success("Đã xuất báo cáo Membership");
      } else {
        toast.error("Không thể lấy dữ liệu membership");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi xuất báo cáo");
    } finally {
      setExporting(null);
    }
  };

  const handleExportBookingsReport = async () => {
    const token = getStoredToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    setExporting("bookings");
    try {
      const res = await apiFetch<ApiResponse<BookingReportResponseDto>>(
        "/admin/reports/bookings",
        { token }
      );

      if (res.success && res.data?.bookings) {
        const { bookings, totalBookings, completedBookings, totalRevenue, completedRevenue } = res.data;

        const columns = [
          { key: "id" as keyof typeof bookings[0], header: "Mã đơn" },
          { key: "venueName" as keyof typeof bookings[0], header: "Cụm sân" },
          { key: "courtName" as keyof typeof bookings[0], header: "Sân" },
          { key: "sportName" as keyof typeof bookings[0], header: "Môn" },
          { key: "customerName" as keyof typeof bookings[0], header: "Khách hàng" },
          { key: "bookingDate" as keyof typeof bookings[0], header: "Ngày đặt" },
          { key: "startTime" as keyof typeof bookings[0], header: "Bắt đầu" },
          { key: "endTime" as keyof typeof bookings[0], header: "Kết thúc" },
          { key: "totalPrice" as keyof typeof bookings[0], header: "Giá" },
          { key: "status" as keyof typeof bookings[0], header: "Trạng thái" },
          { key: "bookingType" as keyof typeof bookings[0], header: "Loại" },
          { key: "createdAt" as keyof typeof bookings[0], header: "Ngày tạo" },
        ];

        const exportData = bookings.map((b) => ({
          ...b,
          totalPrice: formatCurrencyForExport(b.totalPrice),
          createdAt: formatDateForExport(b.createdAt),
        }));

        downloadCSV(exportData, columns, "bookings_report");
        toast.success(`Đã xuất ${bookings.length} đơn đặt sân`);
      } else {
        toast.error("Không thể lấy dữ liệu bookings");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi xuất báo cáo");
    } finally {
      setExporting(null);
    }
  };

  const handleExportUsersReport = async () => {
    const token = getStoredToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    setExporting("users");
    try {
      const res = await apiFetch<ApiResponse<UserDto[]>>(
        "/auth/admin/users",
        { token }
      );

      if (res.success && res.data) {
        const users = res.data;

        const columns = [
          { key: "id" as keyof UserDto, header: "ID" },
          { key: "email" as keyof UserDto, header: "Email" },
          { key: "fullName" as keyof UserDto, header: "Họ tên" },
          { key: "phoneNumber" as keyof UserDto, header: "Số điện thoại" },
          { key: "role" as keyof UserDto, header: "Vai trò" },
          { key: "status" as keyof UserDto, header: "Trạng thái" },
          { key: "createdAt" as keyof UserDto, header: "Ngày tạo" },
        ];

        const exportData = users.map((u) => ({
          ...u,
          createdAt: formatDateForExport(u.createdAt),
        }));

        downloadCSV(exportData, columns, "users_report");
        toast.success(`Đã xuất ${users.length} người dùng`);
      } else {
        toast.error("Không thể lấy dữ liệu người dùng");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi xuất báo cáo");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Cài đặt" description="Cấu hình các cài đặt cho hệ thống" />

      {/* Export Section */}
      <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-[#FF8000]" />
            Xuất báo cáo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-[#C4C7C9]">
            Tải xuống các báo cáo dưới dạng file CSV để sử dụng trong Excel hoặc Google Sheets.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#141414] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[rgba(255,128,0,0.12)] p-2">
                  <CreditCard className="h-5 w-5 text-[#FF8000]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Báo cáo Membership</h3>
                  <p className="text-xs text-[#C4C7C9]/60">
                    Danh sách subscriptions và thống kê
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExportMembershipReport}
                disabled={exporting === "membership"}
                className="bg-[#FF8000] hover:bg-[#FF8000]/90"
              >
                {exporting === "membership" ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Tải CSV
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#141414] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[rgba(134,210,50,0.12)] p-2">
                  <FileText className="h-5 w-5 text-[#86D232]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Báo cáo Bookings</h3>
                  <p className="text-xs text-[#C4C7C9]/60">
                    Lịch sử đặt sân
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExportBookingsReport}
                disabled={exporting === "bookings"}
                variant="outline"
                className="border-[rgba(134,210,50,0.3)] text-white hover:bg-[rgba(134,210,50,0.1)]"
              >
                {exporting === "bookings" ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Tải CSV
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-[rgba(134,210,50,0.2)] bg-[#141414] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[rgba(100,100,255,0.12)] p-2">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Báo cáo Users</h3>
                  <p className="text-xs text-[#C4C7C9]/60">
                    Danh sách người dùng
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExportUsersReport}
                variant="outline"
                disabled={exporting === "users"}
                className="border-[rgba(134,210,50,0.3)] text-white hover:bg-[rgba(134,210,50,0.1)]"
              >
                {exporting === "users" ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Tải CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A]">
        <CardHeader>
          <CardTitle>Thông tin hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-[#C4C7C9]/60">
                Phiên bản
              </p>
              <p className="text-white">MATCHOPS v1.0.0</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-[#C4C7C9]/60">
                Ngày cập nhật gần nhất
              </p>
              <p className="text-white">
                {new Date().toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
