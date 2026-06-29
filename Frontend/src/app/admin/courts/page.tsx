"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CourtStatusBadge } from "@/components/shared/StatusBadge";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import { toast } from "sonner";

interface CourtResponseDto {
  id: string;
  venueId: string;
  venueName: string;
  sportId: string;
  sportName: string;
  name: string;
  type?: string;
  capacity?: number;
  locationNote?: string;
  description?: string;
  imageUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCourtsPage() {
  const [courts, setCourts] = useState<CourtResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCourts();
  }, []);

  const loadCourts = async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await apiFetch<ApiResponse<CourtResponseDto[]>>("/admin/courts", { token });
      setCourts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const token = getStoredToken();
    if (!token) return;
    try {
      await apiFetch(`/admin/courts/${id}/status`, {
        method: "PATCH",
        token,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setCourts((prev) => prev.map((court) => (court.id === id ? { ...court, status } : court)));
      toast.success("Cập nhật trạng thái sân thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật trạng thái sân!");
    }
  };

  const filteredCourts = courts.filter((court) =>
    court.name.toLowerCase().includes(search.toLowerCase()) ||
    court.venueName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý sân</h1>
        <p className="text-sm text-[#C4C7C9]">Quản lý sân trên toàn bộ cụm sân</p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Tìm kiếm sân theo tên hoặc cụm sân..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white placeholder:text-[#C4C7C9]/40"
        />
      </div>

      <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] text-white">
        <CardHeader>
          <CardTitle className="text-lg">Tất cả sân</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(134,210,50,0.2)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Sân</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Cụm sân</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Môn thể thao</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(134,210,50,0.2)]">
                {filteredCourts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[#C4C7C9]">
                      Không tìm thấy sân nào.
                    </td>
                  </tr>
                ) : (
                  filteredCourts.map((court) => (
                    <tr key={court.id} className="hover:bg-[#141414]/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {court.imageUrl && (
                            <img src={court.imageUrl} alt={court.name} className="h-12 w-12 rounded-lg object-cover" />
                          )}
                          <div>
                            <p className="font-medium text-white">{court.name}</p>
                            <p className="text-xs text-[#C4C7C9]/60">
                              {court.type} • {court.capacity} người
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#C4C7C9]/80">{court.venueName}</td>
                      <td className="px-4 py-4 text-[#C4C7C9]/80">{court.sportName}</td>
                      <td className="px-4 py-4">
                        <CourtStatusBadge status={court.status as any} />
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
                            {court.status !== "ACTIVE" && (
                              <DropdownMenuItem className="text-green-400 cursor-pointer" onClick={() => updateStatus(court.id, "ACTIVE")}>
                                Kích hoạt
                              </DropdownMenuItem>
                            )}
                            {court.status === "ACTIVE" && (
                              <DropdownMenuItem className="text-amber-400 cursor-pointer" onClick={() => updateStatus(court.id, "MAINTENANCE")}>
                                Bảo trì
                              </DropdownMenuItem>
                            )}
                            {court.status === "ACTIVE" && (
                              <DropdownMenuItem className="text-gray-400 cursor-pointer" onClick={() => updateStatus(court.id, "INACTIVE")}>
                                Vô hiệu hóa
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
    </div>
  );
}
