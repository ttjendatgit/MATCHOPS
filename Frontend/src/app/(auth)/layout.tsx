import Link from "next/link";
import { SmokeyBackground } from "@/components/login-form";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030303] px-4 py-12">
      {/* Orange smokey WebGL background */}
      <SmokeyBackground color="#FF8000" backdropBlurAmount="md" />

      {/* MatchOps logo */}
      <Link href="/" className="group relative z-10 mb-2 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF8000] shadow-lg shadow-[#FF8000]/35 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-[#FF8000]/55">
          <span className="select-none font-black italic text-[20px] text-white leading-none" aria-hidden>M</span>
        </div>
        <span className="select-none text-xl font-black uppercase tracking-[0.06em] leading-none text-white drop-shadow-[0_0_14px_rgba(255,128,0,0.22)] transition-opacity duration-200 group-hover:opacity-90">
          Match
          <span className="bg-gradient-to-r from-[#FF8000] via-[#FF9A20] to-[#86D232] bg-clip-text text-transparent">
            Ops
          </span>
        </span>
      </Link>

      {/* Brand slogan */}
      <p className="relative z-10 mb-8 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C4C7C9]/50 select-none">
        Match More<span className="mx-1.5 text-[#FF8000]" aria-hidden>·</span>Play More
      </p>

      {/* Page content */}
      <div className="relative z-10 flex w-full justify-center">
        {children}
      </div>
    </div>
  );
}
