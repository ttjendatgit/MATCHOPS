"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";

interface UserAdminResponseDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  status: string;
  createdAt: string;
}

const roleLabels: Record<string, string> = { USER: "Người dùng", OWNER: "Chủ sân", ADMIN: "Admin" };
const statusVariant: Record<string, any> = { ACTIVE: "success", SUSPENDED: "destructive", INACTIVE: "muted" };
const statusLabel: Record<string, string> = { ACTIVE: "Hoạt động", SUSPENDED: "Đã khoá", INACTIVE: "Tạm dừng" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAdminResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    apiFetch<ApiResponse<UserAdminResponseDto[]>>("/auth/admin/users", { token })
      .then(res => {
        setUsers(res.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý người dùng" description="Xem và quản lý tài khoản người dùng trên nền tảng" />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-[#FF8000]" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Người dùng</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Vai trò</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày tham gia</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                        Không có người dùng nào.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                                {u.fullName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-slate-900">{u.fullName}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className="text-xs">{roleLabels[u.role] || u.role}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={statusVariant[u.status]} className="text-xs">{statusLabel[u.status] || u.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td className="px-5 py-4 text-right">
                          {u.status === "ACTIVE" ? (
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5 text-xs">Khoá</Button>
                          ) : (
                            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs">Mở khoá</Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
