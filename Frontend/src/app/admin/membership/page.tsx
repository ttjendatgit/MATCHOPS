"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, TrendingUp, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý Membership</h1>
        <p className="text-sm text-[#C4C7C9]">Quản lý gói thành viên và subscriptions</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(134,210,50,0.2)]">
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[#C4C7C9]">
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
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const tierCount = stats?.subscriptionsByTier[plan.tier] || 0;
              return (
                <div
                  key={plan.id}
                  className={`rounded-lg border p-4 ${
                    plan.isActive
                      ? "border-[rgba(134,210,50,0.2)] bg-[#141414]"
                      : "border-red-500/20 bg-red-950/10 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white">{plan.name}</p>
                      <p className="text-xs text-[#C4C7C9]/60">{plan.targetRole}</p>
                    </div>
                    {!plan.isActive && (
                      <Badge variant="destructive" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#FF8000]">
                      {(plan.pricePerMonth / 1000).toLocaleString("vi-VN")}
                    </span>
                    <span className="text-sm text-[#C4C7C9]/60">.000đ/tháng</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#C4C7C9]/60">
                    <span>{tierCount} subscriptions</span>
                    <Badge variant="outline" className="text-xs">{plan.tier}</Badge>
                  </div>
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
