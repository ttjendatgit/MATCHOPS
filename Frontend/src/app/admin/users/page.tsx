"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, MoreHorizontal, UserMinus, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/auth";

const statusVariant: Record<string, any> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
};

const roleVariant: Record<string, any> = {
  ADMIN: "outline",
  OWNER: "secondary",
  USER: "outline",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await apiFetch<ApiResponse<User[]>>("/auth/admin/users", { token });
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = (user: User) => {
    setConfirmDialog({
      open: true,
      title: "Tạm khóa người dùng",
      description: `Bạn chắc chắn muốn tạm khóa ${user.fullName}?`,
      onConfirm: async () => {
        try {
          await apiFetch(`/auth/admin/users/${user.id}/suspend`, {
            method: "PATCH",
            token: getStoredToken(),
          });
          loadUsers();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const handleActivate = (user: User) => {
    setConfirmDialog({
      open: true,
      title: "Kích hoạt người dùng",
      description: `Bạn chắc chắn muốn kích hoạt ${user.fullName}?`,
      onConfirm: async () => {
        try {
          await apiFetch(`/auth/admin/users/${user.id}/activate`, {
            method: "PATCH",
            token: getStoredToken(),
          });
          loadUsers();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý người dùng</h1>
        <p className="text-sm text-[#C4C7C9]">Quản lý tất cả người dùng trên nền tảng MATCHOPS</p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Tìm kiếm người dùng theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white placeholder:text-[#C4C7C9]/40"
        />
      </div>

      <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] text-white">
        <CardHeader>
          <CardTitle className="text-lg">Tất cả người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(134,210,50,0.2)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Người dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Vai trò</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Ngày tạo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(134,210,50,0.2)]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[#C4C7C9]">
                      Không tìm thấy người dùng nào.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#141414]/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,128,0,0.12)] text-[#FF8000] font-bold">
                            {user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{user.fullName}</p>
                            <p className="text-xs text-[#C4C7C9]/60">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={statusVariant[user.status]}>{user.status}</Badge>
                      </td>
                      <td className="px-4 py-4 text-[#C4C7C9]/60">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#C4C7C9]">
                              <span className="sr-only">Mở menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-[rgba(134,210,50,0.2)]">
                            <DropdownMenuItem className="text-white cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            {user.status === "ACTIVE" && (
                              <DropdownMenuItem className="text-red-400 cursor-pointer" onClick={() => handleSuspend(user)}>
                                <UserMinus className="mr-2 h-4 w-4" />
                                Tạm khóa
                              </DropdownMenuItem>
                            )}
                            {user.status !== "ACTIVE" && (
                              <DropdownMenuItem className="text-green-400 cursor-pointer" onClick={() => handleActivate(user)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Kích hoạt
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
