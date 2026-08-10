"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ForecastMetric } from "@/types/dashboard";

type Props = {
  forecast: ForecastMetric[];
  variant?: "light" | "dark";
  className?: string;
};

export function ForecastCard({ forecast, variant = "dark", className }: Props) {
  const isDark = variant === "dark";

  return (
    <Card className={cn(isDark ? "border-white/10 bg-slate-950/50 text-white" : "border-slate-200 bg-white text-slate-900", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-[#FF8000]" />
          Dự báo
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {forecast.length > 0 ? (
          forecast.map((item) => (
            <div key={item.label} className={cn("rounded-lg border p-4", isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
              <p className={cn("text-xs uppercase tracking-wide", isDark ? "text-slate-400" : "text-slate-500")}>
                {item.label}
              </p>
              <p className="mt-1 text-lg font-semibold">{item.value}</p>
            </div>
          ))
        ) : (
          <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>Không có dự báo nào.</p>
        )}
      </CardContent>
    </Card>
  );
}
