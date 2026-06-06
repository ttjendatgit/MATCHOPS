import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { VenueStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const metadata: Metadata = { title: "Duyệt cơ sở – Admin" };

const venues = [
  { id: "1", name: "Sân tennis Quận 1 Premium", ownerName: "Nguyễn Minh", ownerEmail: "minh@example.com", city: "TP.HCM", district: "Quận 1", courtCount: 4, createdAt: "2026-05-29", status: "PENDING_APPROVAL" as const },
  { id: "2", name: "SportZone Cầu Giấy", ownerName: "Trần Văn Hùng", ownerEmail: "hung@example.com", city: "Hà Nội", district: "Cầu Giấy", courtCount: 8, createdAt: "2026-05-30", status: "PENDING_APPROVAL" as const },
  { id: "3", name: "Sân cầu lông Phú Mỹ Hưng", ownerName: "Lê Thị C", ownerEmail: "lethic@example.com", city: "TP.HCM", district: "Quận 7", courtCount: 10, createdAt: "2026-04-10", status: "ACTIVE" as const },
  { id: "4", name: "BadmintonHub Hải Châu", ownerName: "Phạm Văn D", ownerEmail: "phamvand@example.com", city: "Đà Nẵng", district: "Hải Châu", courtCount: 6, createdAt: "2026-03-15", status: "SUSPENDED" as const },
];

export default function AdminVenuesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý cơ sở" description="Duyệt, từ chối và quản lý trạng thái các cơ sở trên nền tảng" />

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Tìm tên cơ sở, chủ sân..." className="w-72 bg-white" />
        <Select>
          <SelectTrigger className="w-44 bg-white"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Chờ duyệt</SelectItem>
            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
            <SelectItem value="SUSPENDED">Đã khoá</SelectItem>
            <SelectItem value="REJECTED">Từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cơ sở</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Chủ sân</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Địa điểm</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {venues.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{v.name}</p>
                      <p className="text-xs text-slate-400">{v.courtCount} sân · {v.createdAt}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-900">{v.ownerName}</p>
                      <p className="text-xs text-slate-400">{v.ownerEmail}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{v.district}, {v.city}</td>
                    <td className="px-5 py-4"><VenueStatusBadge status={v.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {v.status === "PENDING_APPROVAL" && (
                          <>
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5 text-xs">Từ chối</Button>
                            <Button size="sm" className="text-xs">Duyệt</Button>
                          </>
                        )}
                        {v.status === "ACTIVE" && (
                          <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">Tạm khoá</Button>
                        )}
                        {v.status === "SUSPENDED" && (
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs">Mở khoá</Button>
                        )}
                      </div>
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
