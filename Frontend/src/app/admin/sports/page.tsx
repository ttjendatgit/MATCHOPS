"use client";

import { useEffect, useState } from "react";
import { Metadata } from "next";
import { Plus, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

interface SportResponseDto {
  id: string;
  name: string;
  status: string;
}

export default function AdminSportsPage() {
  const [sports, setSports] = useState<SportResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ApiResponse<SportResponseDto[]>>("/sports")
      .then(res => {
        setSports(res.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Môn thể thao"
        description="Quản lý danh mục môn thể thao trên nền tảng"
        action={
          <Button><Plus className="h-4 w-4" />Thêm môn</Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-[#FF8000]" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sports.map((sport) => (
            <Card key={sport.id} className="transition hover:shadow-md bg-slate-900 border-white/5">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF8000]/10">
                  <Dumbbell className="h-6 w-6 text-[#FF8000]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{sport.name}</p>
                  <p className="text-xs text-slate-500">ID: {sport.id.slice(0, 8)}...</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={sport.status === "ACTIVE" ? "success" : "secondary"} className="text-xs">
                    {sport.status === "ACTIVE" ? "Hoạt động" : "Ẩn"}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-400">Sửa</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
