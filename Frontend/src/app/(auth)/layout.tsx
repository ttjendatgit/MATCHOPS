import Link from "next/link";
import { Activity } from "lucide-react";
import { SmokeyBackground } from "@/components/login-form";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Emerald smokey WebGL background */}
      <SmokeyBackground color="#10B981" backdropBlurAmount="md" />

      {/* MatchOps logo */}
      <Link href="/" className="relative z-10 mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/30">
          <Activity className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <span className="text-xl font-black tracking-tight text-white select-none">
          Match
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Ops
          </span>
        </span>
      </Link>

      {/* Page content */}
      <div className="relative z-10 flex w-full justify-center">
        {children}
      </div>
    </div>
  );
}
