import { Metadata } from "next";
import { Plus, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Môn thể thao – Admin" };

const sports = [
  { id: "1", name: "Cầu lông",    venueCount: 480, status: "ACTIVE" },
  { id: "2", name: "Bóng đá",     venueCount: 320, status: "ACTIVE" },
  { id: "3", name: "Tennis",      venueCount: 240, status: "ACTIVE" },
  { id: "4", name: "Bóng rổ",     venueCount: 160, status: "ACTIVE" },
  { id: "5", name: "Bóng chuyền", venueCount: 120, status: "ACTIVE" },
  { id: "6", name: "Pickleball",  venueCount:  80, status: "ACTIVE" },
];

export default function AdminSportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Môn thể thao"
        description="Quản lý danh mục môn thể thao trên nền tảng"
        action={
          <Button><Plus className="h-4 w-4" />Thêm môn</Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sports.map((sport) => (
          <Card key={sport.id} className="transition hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <Dumbbell className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{sport.name}</p>
                <p className="text-xs text-slate-500">{sport.venueCount} cơ sở</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="success" className="text-xs">Hoạt động</Badge>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500">Sửa</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
