"use client";

import { ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  recommendations: string[];
  variant?: "light" | "dark";
  className?: string;
};

export function AIRecommendationsCard({ recommendations, variant = "dark", className }: Props) {
  const isDark = variant === "dark";

  return (
    <Card className={cn(isDark ? "border-white/10 bg-slate-950/50 text-white" : "border-slate-200 bg-white text-slate-900", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4 text-[#86D232]" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className={cn("space-y-3 text-sm", isDark ? "text-slate-200" : "text-slate-700")}>
          {recommendations.length > 0 ? (
            recommendations.map((item) => (
              <li key={item} className="rounded-lg border border-current/10 p-3">
                {item}
              </li>
            ))
          ) : (
            <li className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>No recommendations yet.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
