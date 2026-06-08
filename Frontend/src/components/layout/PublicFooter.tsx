import Link from "next/link";
import { TextHoverEffect, FooterBackgroundGradient } from "@/components/hover-footer";

// ─── Link data ────────────────────────────────────────────────────────────────

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Trang chủ",        href: "/"        },
      { label: "Sân thể thao",     href: "/venues"  },
      { label: "Huấn luyện viên",  href: "/coach"   },
      { label: "Ghép đối",         href: "/match"   },
    ],
  },
  {
    title: "Booking",
    links: [
      { label: "Tìm sân",       href: "/venues"   },
      { label: "Lịch đặt sân",  href: "/bookings" },
      { label: "Bảng giá",      href: "#"         },
      { label: "Thanh toán",    href: "#"         },
    ],
  },
  {
    title: "Owner",
    links: [
      { label: "Quản lý sân",  href: "/owner"          },
      { label: "Bảng giá",     href: "#"               },
      { label: "Booking",      href: "/owner/bookings" },
      { label: "Báo cáo",      href: "#"               },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Liên hệ",    href: "#" },
      { label: "Trợ giúp",   href: "#" },
      { label: "Điều khoản", href: "#" },
      { label: "Chính sách", href: "#" },
    ],
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#030303]">
      {/* Radial ambient background */}
      <FooterBackgroundGradient />

      {/* Top separator glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF8000]/40 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Brand + columns ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-10 pb-10 pt-16 md:grid-cols-6">
          {/* Brand — 2 cols on md */}
          <div className="col-span-2">
            <Link href="/" className="group flex w-fit items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF8000] shadow-md shadow-[#FF8000]/30 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-[#FF8000]/45 group-hover:scale-105">
                <span className="brand-wordmark select-none italic text-[16px] text-white leading-none" aria-hidden>M</span>
              </div>
              <span className="brand-wordmark select-none text-[15px] uppercase leading-none text-white transition-opacity duration-200 group-hover:opacity-90">
                Match
                <span className="bg-gradient-to-r from-[#FF8000] via-[#FF9A20] to-[#86D232] bg-clip-text text-transparent">
                  Ops
                </span>
              </span>
            </Link>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C4C7C9]/50 select-none">
              Match More<span className="mx-1.5 text-[#FF8000]" aria-hidden>·</span>Play More
            </p>
          </div>

          {/* Four link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors duration-200 hover:text-[#FF8000]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── MATCHOPS interactive hover text ──────────────────────────── */}
        <div className="h-36 w-full sm:h-44 md:h-52">
          <TextHoverEffect text="MATCHOPS" duration={0.3} />
        </div>

        {/* ── Bottom row ───────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 border-t border-white/[0.06] py-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">
            © 2026 MatchOps. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="#"
              className="text-xs text-slate-500 transition-colors duration-200 hover:text-[#FF8000]"
            >
              Điều khoản
            </Link>
            <Link
              href="#"
              className="text-xs text-slate-500 transition-colors duration-200 hover:text-[#FF8000]"
            >
              Bảo mật
            </Link>
            <Link
              href="#"
              className="text-xs text-slate-500 transition-colors duration-200 hover:text-[#FF8000]"
            >
              Liên hệ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
