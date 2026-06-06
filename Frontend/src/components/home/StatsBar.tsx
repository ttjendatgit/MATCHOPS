"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const STATS = [
  { end: 3000,  suffix: "+", label: "Sân thể thao",  note: "trên toàn quốc" },
  { end: 50000, suffix: "+", label: "Người dùng",    note: "hoạt động hằng tháng" },
  { end: 98,    suffix: "%", label: "Hài lòng",      note: "đánh giá từ người chơi" },
  { end: 30,    suffix: "s", label: "Xác nhận",      note: "đặt sân trung bình" },
] as const;

function Counter({
  end,
  suffix,
  triggered,
}: {
  end: number;
  suffix: string;
  triggered: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!triggered) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setCount(end);
      return;
    }

    const duration = 1800;
    let startTs: number | undefined;
    let rafId: number;

    const tick = (ts: number) => {
      if (startTs === undefined) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setCount(end);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [triggered, end]);

  const display =
    count >= 1000 ? count.toLocaleString("vi-VN") : count.toString();

  return (
    <span className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

export function StatsBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Thống kê nền tảng MatchOps"
      className="relative bg-slate-900 overflow-hidden"
    >
      <style>{`
        @keyframes statsbar-shimmer {
          0%   { transform: translateX(-100%); }
          60%, 100% { transform: translateX(400%); }
        }
        .statsbar-shimmer { animation: statsbar-shimmer 5s ease-in-out infinite; }
      `}</style>

      {/* Top border — emerald primary glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />
      {/* Top border — cyan accent layer */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
      {/* Bottom border */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      {/* Emerald left radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_90%_at_15%_50%,rgba(16,185,129,0.09),transparent)]" />
      {/* Cyan right radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_90%_at_85%_50%,rgba(6,182,212,0.07),transparent)]" />
      {/* Center top glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(16,185,129,0.06),transparent)]" />

      {/* Shimmer sweep — decorative */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="statsbar-shimmer absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
        />
      </div>

      <div className="mx-auto max-w-7xl">
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-6 py-11 text-center",
                i !== 0 && "lg:border-l lg:border-white/8",
                i >= 2 && "border-t border-white/8 lg:border-t-0"
              )}
            >
              <dd className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-br from-emerald-300 via-cyan-300 to-teal-200 bg-clip-text text-transparent leading-none">
                <Counter
                  end={stat.end}
                  suffix={stat.suffix}
                  triggered={triggered}
                />
              </dd>
              <dt className="mt-0.5 text-sm font-semibold text-slate-200">{stat.label}</dt>
              <p className="text-xs text-slate-400">{stat.note}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
