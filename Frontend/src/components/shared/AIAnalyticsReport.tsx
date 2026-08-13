"use client";

import ReactMarkdown from "react-markdown";
import { BrainCircuit, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardAiActionItem, DashboardAiRiskItem } from "@/types/dashboard";

type Props = {
  fullReport?: string;
  summary: string;
  actions?: DashboardAiActionItem[];
  riskItems?: DashboardAiRiskItem[];
  isFallback?: boolean;
  className?: string;
};

const levelVariant = (level: string) => {
  const u = level.toUpperCase();
  if (u === "CRITICAL") return "destructive" as const;
  if (u === "HIGH") return "warning" as const;
  if (u === "LOW") return "muted" as const;
  return "secondary" as const;
};

export function AIAnalyticsReport({
  fullReport,
  summary,
  actions = [],
  riskItems = [],
  isFallback,
  className,
}: Props) {
  return (
    <Card className={cn("border-white/10 bg-slate-950/50 text-white", className)}>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg bg-[#FF8000]/15 p-2">
            <BrainCircuit className="h-4 w-4 text-[#FF8000]" />
          </div>
          <CardTitle className="text-base font-semibold">Phân tích AI MATCHOP</CardTitle>
          {isFallback && (
            <Badge variant="secondary" className="text-[10px]">
              Phân tích nội bộ
            </Badge>
          )}
        </div>
        <p className="text-sm leading-6 text-slate-400">{summary}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {fullReport ? (
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-[#FF8000]">
            <ReactMarkdown>{fullReport}</ReactMarkdown>
          </div>
        ) : null}

        {riskItems.length > 0 && (
          <section className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-300">
              <Sparkles className="h-4 w-4" />
              Rủi ro ưu tiên
            </h4>
            <div className="space-y-2">
              {riskItems.map((risk) => (
                <div key={`${risk.level}-${risk.title}`} className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant={levelVariant(risk.level)}>{risk.level}</Badge>
                    <span className="text-sm font-medium text-white">{risk.title}</span>
                  </div>
                  <p className="text-xs text-slate-300">{risk.detail}</p>
                  {risk.evidence && <p className="mt-1 text-[11px] text-slate-500">Căn cứ: {risk.evidence}</p>}
                  {risk.suggestedAction && (
                    <p className="mt-1 text-[11px] text-[#86D232]">→ {risk.suggestedAction}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {actions.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-[#86D232]">Hành động đề xuất</h4>
            <div className="space-y-2">
              {actions.map((item) => (
                <div key={`${item.priority}-${item.action}`} className="rounded-lg border border-[#86D232]/20 bg-[#86D232]/5 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-[#86D232]">#{item.priority}</span>
                    <Badge variant={levelVariant(item.level)}>{item.level}</Badge>
                  </div>
                  <p className="text-sm font-medium text-white">{item.action}</p>
                  <p className="mt-1 text-xs text-slate-400">Lý do: {item.reason}</p>
                  {item.expectedImpact && (
                    <p className="mt-1 text-xs text-slate-400">Tác động: {item.expectedImpact}</p>
                  )}
                  {item.metric && <p className="mt-1 text-[11px] text-slate-500">KPI: {item.metric}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
