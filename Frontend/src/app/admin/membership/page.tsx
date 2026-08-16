"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, TrendingUp, CheckCircle2, Clock, XCircle, RefreshCw, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MembershipPlanDto {
  id: string;
  code: string;
  name: string;
  targetRole: string;
  tier: string;
  pricePerMonth: number;
  pricePerYear?: number | null;
  isActive: boolean;
}

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
  subscriptionsByPlan: Record<string, number>;
  subscriptionsByTier: Record<string, number>;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ── Status Config ────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; variant: string; icon: React.ElementType }> = {
  ACTIVE: { label: "Hoạt động", variant: "success", icon: CheckCircle2 },
  PENDING: { label: "Chờ thanh toán", variant: "warning", icon: Clock },
  EXPIRED: { label: "Hết hạn", variant: "secondary", icon: Clock },
  CANCELLED: { label: "Đã hủy", variant: "destructive", icon: XCircle },
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminMembershipPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionDto[]>([]);
  const [plans, setPlans] = useState<MembershipPlanDto[]>([]);
  const [stats, setStats] = useState<MembershipStatisticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const [subRes, plansRes, statsRes] = await Promise.all([
        apiFetch<ApiResponse<AdminSubscriptionDto[]>>("/admin/membership/subscriptions", { token }),
        apiFetch<ApiResponse<MembershipPlanDto[]>>("/admin/membership/plans", { token }),
        apiFetch<ApiResponse<MembershipStatisticsDto>>("/admin/membership/statistics", { token }),
      ]);

      if (subRes.data) setSubscriptions(subRes.data);
      if (plansRes.data) setPlans(plansRes.data);
      if (statsRes.data) setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load membership data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (subscriptionId: string) => {
    const token = getStoredToken();
    if (!token) return;

    if (!subscriptionId || subscriptionId === "undefined") {
      toast.error("Không tìm thấy mã subscription. Vui lòng tải lại trang.");
      return;
    }

    if (!window.confirm("Xác nhận user đã chuyển khoản và kích hoạt gói này?")) return;

    setConfirmingId(subscriptionId);
    try {
      await apiFetch<ApiResponse<unknown>>(
        "/admin/membership/confirm-payment",
        {
          method: "POST",
          token,
          body: JSON.stringify({ subscriptionId }),
        },
      );
      toast.success("Đã kích hoạt gói thành viên.");
      await loadData();
    } catch (err) {
      console.error(err);
      const message =
        err instanceof ApiError
          ? err.message
          : "Không thể kích hoạt gói. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleExportSubscriptions = () => {
    if (filteredSubscriptions.length === 0) {
      toast.error("Không có dữ liệu để xuất.");
      return;
    }
    const headers = ["Họ tên", "Email", "Vai trò", "Gói", "Tier", "Giá", "Trạng thái", "Bắt đầu", "Hết hạn"];
    const rows = filteredSubscriptions.map((sub) => [
      sub.userFullName,
      sub.userEmail,
      sub.userRole,
      sub.planName,
      sub.planTier,
      sub.planPrice.toString(),
      sub.status,
      sub.startedAt,
      sub.expiresAt ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `membership-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Xuất danh sách subscription thành công.");
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      !search ||
      sub.userFullName.toLowerCase().includes(search.toLowerCase()) ||
      sub.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      sub.planName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-[#FF8000]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý Membership</h1>
          <p className="text-sm text-[#C4C7C9]">Quản lý gói thành viên và subscriptions</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-[rgba(134,210,50,0.2)] bg-[#141414] text-white"
          onClick={handleExportSubscriptions}
          disabled={filteredSubscriptions.length === 0}
        >
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Tổng Subscriptions"
            value={stats.totalSubscriptions}
            color="text-blue-400"
          />
          <StatCard
            icon={CheckCircle2}
            label="Đang hoạt động"
            value={stats.activeSubscriptions}
            color="text-green-400"
          />
          <StatCard
            icon={CreditCard}
            label="Doanh thu/tháng"
            value={`${(stats.totalRevenue / 1000).toFixed(0)}K`}
            color="text-[#FF8000]"
          />
          <StatCard
            icon={TrendingUp}
            label="Gói trả phí"
            value={stats.paidPlanUsers}
            color="text-purple-400"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Tìm kiếm theo tên, email, gói..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white placeholder:text-[#C4C7C9]/40"
        />
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("")}
            className={statusFilter === "" ? "bg-[#FF8000]" : "border-[rgba(134,210,50,0.2)] text-white"}
          >
            Tất cả
          </Button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={statusFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(key)}
              className={statusFilter === key ? "bg-[#FF8000]" : "border-[rgba(134,210,50,0.2)] text-white"}
            >
              {config.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A]">
        <CardHeader>
          <CardTitle className="text-lg">Danh sách Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(134,210,50,0.2)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Người dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Gói</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Giá</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Bắt đầu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Hết hạn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(134,210,50,0.2)]">
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[#C4C7C9]">
                      Không tìm thấy subscription nào.
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => {
                    const status = statusConfig[sub.status] || statusConfig.EXPIRED;
                    const StatusIcon = status.icon;
                    return (
                      <tr key={sub.subscriptionId} className="hover:bg-[#141414]/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,128,0,0.12)] text-[#FF8000] font-bold text-sm">
                              {sub.userFullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-white">{sub.userFullName}</p>
                              <p className="text-xs text-[#C4C7C9]/60">{sub.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-white">{sub.planName}</p>
                          <p className="text-xs text-[#C4C7C9]/60">{sub.planTier}</p>
                        </td>
                        <td className="px-4 py-4 text-white">
                          {sub.planPrice === 0 ? (
                            <span className="text-[#86D232]">Miễn phí</span>
                          ) : (
                            `${(sub.planPrice / 1000).toLocaleString("vi-VN")}K`
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={status.variant as any} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-[#C4C7C9]/60">
                          {new Date(sub.startedAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-4 text-[#C4C7C9]/60">
                          {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString("vi-VN") : "—"}
                        </td>
                        <td className="px-4 py-4">
                          {sub.status === "PENDING" ? (
                            <Button
                              size="sm"
                              className="bg-[#FF8000] hover:bg-[#FF8000]/85"
                              disabled={confirmingId === sub.subscriptionId}
                              onClick={() => handleConfirmPayment(sub.subscriptionId)}
                            >
                              {confirmingId === sub.subscriptionId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Xác nhận CK"
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-[#C4C7C9]/40">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Plans Overview */}
      <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A]">
        <CardHeader>
          <CardTitle className="text-lg">Các gói Membership</CardTitle>
          <p className="text-sm text-[#C4C7C9]/60">
            Số người đang dùng từng gói (ACTIVE hoặc PENDING).
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {plans.map((plan) => {
              const planSubs = subscriptions.filter(
                (s) => s.planId === plan.id && (s.status === "ACTIVE" || s.status === "PENDING"),
              );
              const activeCount = planSubs.filter((s) => s.status === "ACTIVE").length;

              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    plan.isActive
                      ? "border-[rgba(134,210,50,0.2)] bg-[#141414] hover:border-[rgba(255,128,0,0.3)]"
                      : "border-red-500/20 bg-red-950/10 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{plan.name}</p>
                      <p className="text-xs text-[#C4C7C9]/60">{plan.targetRole}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {plan.tier}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#FF8000]">
                      {plan.pricePerMonth === 0
                        ? "0"
                        : (plan.pricePerMonth / 1000).toLocaleString("vi-VN")}
                    </span>
                    <span className="text-sm text-[#C4C7C9]/60">
                      {plan.pricePerMonth === 0 ? "đ" : ".000đ/tháng"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="font-medium text-[#86D232]">
                      {activeCount} đang dùng
                    </span>
                    {planSubs.length > activeCount && (
                      <span className="text-amber-400">{planSubs.length - activeCount} chờ CK</span>
                    )}
                  </div>
                  {planSubs.length > 0 ? (
                    <ul className="mt-3 max-h-28 space-y-1.5 overflow-y-auto border-t border-[rgba(134,210,50,0.1)] pt-3">
                      {planSubs.slice(0, 5).map((sub) => (
                        <li key={sub.subscriptionId} className="text-xs">
                          <p className="truncate font-medium text-white">{sub.userFullName}</p>
                          <p className="truncate text-[#C4C7C9]/50">{sub.userEmail}</p>
                        </li>
                      ))}
                      {planSubs.length > 5 && (
                        <li className="text-[10px] text-[#C4C7C9]/40">
                          +{planSubs.length - 5} người khác
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="mt-3 border-t border-[rgba(134,210,50,0.1)] pt-3 text-xs text-[#C4C7C9]/40">
                      Chưa có người dùng gói này
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A]">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`rounded-lg bg-[#141414] p-3 ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-[#C4C7C9]/60">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
