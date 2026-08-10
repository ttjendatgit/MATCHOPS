"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardSeriesPoint } from "@/types/dashboard";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = {
  title?: string;
  description?: string;
  data: DashboardSeriesPoint[];
  variant?: "light" | "dark";
  className?: string;
};

export function RevenueAnalysisCard({
  title = "Revenue Analysis",
  description,
  data,
  variant = "dark",
  className,
}: Props) {
  const isDark = variant === "dark";

  return (
    <Card className={cn(isDark ? "border-white/10 bg-slate-950/50 text-white" : "border-slate-200 bg-white text-slate-900", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>{description}</p> : null}
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#FF8000" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#FF8000" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"} />
              <XAxis dataKey="label" stroke={isDark ? "#94a3b8" : "#64748b"} />
              <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} tickFormatter={(value) => formatCurrency(Number(value))} />
              <Tooltip
                formatter={(value: number) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: isDark ? "#020617" : "#ffffff",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                  borderRadius: "12px",
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#FF8000" fill="url(#revenueFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
