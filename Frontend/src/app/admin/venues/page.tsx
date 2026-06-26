"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, MoreHorizontal, CheckCircle2, XCircle, PauseCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { VenueStatusBadge } from "@/components/shared/StatusBadge";
import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { VenueResponseDto } from "@/types/venue";

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<VenueResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await apiFetch<ApiResponse<VenueResponseDto[]>>("/admin/venues", { token });
      setVenues(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (venue: VenueResponseDto) => {
    setConfirmDialog({
      open: true,
      title: "Duyệt cụm sân",
      description: `Bạn chắc chắn muốn duyệt ${venue.name}?`,
      onConfirm: async () => {
        try {
          await apiFetch(`/admin/venues/${venue.id}/approve`, {
            method: "PATCH",
            token: getStoredToken(),
          });
          loadVenues();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const handleReject = (venue: VenueResponseDto) => {
    setConfirmDialog({
      open: true,
      title: "Từ chối cụm sân",
      description: `Bạn chắc chắn muốn từ chối ${venue.name}?`,
      onConfirm: async () => {
        try {
          await apiFetch(`/admin/venues/${venue.id}/reject`, {
            method: "PATCH",
            token: getStoredToken(),
          });
          loadVenues();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const handleSuspend = (venue: VenueResponseDto) => {
    setConfirmDialog({
      open: true,
      title: "Tạm khóa cụm sân",
      description: `Bạn chắc chắn muốn tạm khóa ${venue.name}?`,
      onConfirm: async () => {
        try {
          await apiFetch(`/admin/venues/${venue.id}/suspend`, {
            method: "PATCH",
            token: getStoredToken(),
          });
          loadVenues();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const filteredVenues = venues.filter((venue) =>
    venue.name.toLowerCase().includes(search.toLowerCase()) ||
    venue.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý cụm sân</h1>
        <p className="text-sm text-[#C4C7C9]">Quản lý cụm sân (duyệt, từ chối, tạm khóa)</p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Tìm kiếm theo tên hoặc thành phố..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-[#0A0A0A] border-[rgba(134,210,50,0.2)] text-white placeholder:text-[#C4C7C9]/40"
        />
      </div>

      <Card className="border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] text-white">
        <CardHeader>
          <CardTitle className="text-lg">Tất cả cụm sân</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(134,210,50,0.2)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Cụm sân</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Chủ sân</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Ngày tạo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#C4C7C9]/60">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(134,210,50,0.2)]">
                {filteredVenues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[#C4C7C9]">
                      Không tìm thấy cụm sân nào.
                    </td>
                  </tr>
                ) : (
                  filteredVenues.map((venue) => (
                    <tr key={venue.id} className="hover:bg-[#141414]/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {venue.coverImageUrl && (
                            <img
                              src={venue.coverImageUrl}
                              alt={venue.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-white">{venue.name}</p>
                            <p className="text-xs text-[#C4C7C9]/60 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {venue.city}, {venue.district}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#C4C7C9]/80">{venue.ownerName}</td>
                      <td className="px-4 py-4">
                        <VenueStatusBadge status={venue.status} />
                      </td>
                      <td className="px-4 py-4 text-[#C4C7C9]/60">
                        {new Date(venue.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(venue.status === "PENDING_APPROVAL" || venue.status === "DRAFT") && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApprove(venue)}
                              >
                                Duyệt
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleReject(venue)}
                              >
                                Không duyệt
                              </Button>
                            </>
                          )}
                          {venue.status === "ACTIVE" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                              onClick={() => handleSuspend(venue)}
                            >
                              Tạm khóa
                            </Button>
                          )}
                        </div>
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
