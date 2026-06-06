import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Người dùng – Admin" };

const users = [
  { id: "1", fullName: "Nguyễn Văn A", email: "nguyenvana@example.com", role: "USER",  status: "ACTIVE",    createdAt: "2026-01-15", bookingCount: 24 },
  { id: "2", fullName: "Trần Thị B",   email: "tranthib@example.com",   role: "OWNER", status: "ACTIVE",    createdAt: "2026-02-10", bookingCount: 5 },
  { id: "3", fullName: "Lê Văn C",     email: "levanc@example.com",     role: "USER",  status: "SUSPENDED", createdAt: "2026-03-05", bookingCount: 2 },
];

const roleLabels: Record<string, string> = { USER: "Người dùng", OWNER: "Chủ sân", ADMIN: "Admin" };
const statusVariant: Record<string, any> = { ACTIVE: "success", SUSPENDED: "destructive", INACTIVE: "muted" };
const statusLabel: Record<string, string> = { ACTIVE: "Hoạt động", SUSPENDED: "Đã khoá", INACTIVE: "Tạm dừng" };

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý người dùng" description="Xem và quản lý tài khoản người dùng trên nền tảng" />

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Tìm theo tên, email..." className="w-72 bg-white" />
        <Select>
          <SelectTrigger className="w-36 bg-white"><SelectValue placeholder="Vai trò" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="USER">Người dùng</SelectItem>
            <SelectItem value="OWNER">Chủ sân</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-40 bg-white"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
            <SelectItem value="SUSPENDED">Đã khoá</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Người dùng</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Vai trò</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Đặt sân</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày tham gia</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
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
                      <Badge variant="outline" className="text-xs">{roleLabels[u.role]}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusVariant[u.status]} className="text-xs">{statusLabel[u.status]}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-600 tabular-nums">{u.bookingCount}</td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      {u.status === "ACTIVE" ? (
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5 text-xs">Khoá</Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs">Mở khoá</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
