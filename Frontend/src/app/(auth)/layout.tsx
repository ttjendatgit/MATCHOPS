import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      {/* Sports collage background — absolute within relative container, no -z tricks */}
      <div className="absolute inset-0 overflow-hidden bg-[#030303]">
        <Image
          src="/images/auth-sports-bg.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
          aria-hidden={true}
        />
        {/* Layer 1: 40% dark base — image stays visible, form remains readable */}
        <div className="absolute inset-0 bg-black/40" />
        {/* Layer 2: soft edge vignette only — draws focus inward toward form */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_65%_at_50%_50%,transparent_0%,rgba(0,0,0,0.18)_100%)]" />
        {/* Layer 3: micro orange warmth to harmonise with brand accent */}
        <div className="absolute inset-0 bg-[rgba(255,128,0,0.04)]" />
      </div>

      {/* MatchOps logo */}
      <Link href="/" className="group relative z-10 mb-2 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF8000] shadow-lg shadow-[#FF8000]/35 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-[#FF8000]/55">
          <span className="brand-wordmark select-none italic text-[20px] text-white leading-none" aria-hidden>M</span>
        </div>
        <span className="brand-wordmark select-none text-xl uppercase leading-none text-white drop-shadow-[0_0_14px_rgba(255,128,0,0.22)] transition-opacity duration-200 group-hover:opacity-90">
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
