"use client";

import { BrainCircuit, Lightbulb, ShieldAlert, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  summary: string;
  insights: string[];
  risks: string[];
  opportunities: string[];
  title?: string;
  variant?: "light" | "dark";
  className?: string;
};

export function AIInsightCard({
  summary,
  insights,
  risks,
  opportunities,
  title = "AI Summary",
  variant = "dark",
  className,
}: Props) {
  const isDark = variant === "dark";
  const panelClass = isDark
    ? "border-white/10 bg-slate-950/50 text-white"
    : "border-slate-200 bg-white text-slate-900";
  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";
  const listClass = isDark ? "text-slate-200" : "text-slate-700";

  return (
    <Card className={cn(panelClass, className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={cn("rounded-lg p-2", isDark ? "bg-[#FF8000]/15" : "bg-[#FF8000]/10")}>
            <BrainCircuit className="h-4 w-4 text-[#FF8000]" />
          </div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
        <p className={cn("text-sm leading-6", mutedClass)}>{summary}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <section>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-[#86D232]" />
            Key Insights
          </div>
          <ul className={cn("space-y-2 text-sm", listClass)}>
            {insights.length > 0 ? insights.map((item) => <li key={item}>- {item}</li>) : <li>- No insights yet.</li>}
          </ul>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            Risks
          </div>
          <ul className={cn("space-y-2 text-sm", listClass)}>
            {risks.length > 0 ? risks.map((item) => <li key={item}>- {item}</li>) : <li>- No major risks detected.</li>}
          </ul>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-sky-400" />
            Opportunities
          </div>
          <ul className={cn("space-y-2 text-sm", listClass)}>
            {opportunities.length > 0 ? opportunities.map((item) => <li key={item}>- {item}</li>) : <li>- No opportunities detected.</li>}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}
