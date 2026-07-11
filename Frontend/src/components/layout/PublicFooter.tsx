import Link from "next/link";
import { BrandLogo } from "@/components/branding";
import { TextHoverEffect, FooterBackgroundGradient } from "@/components/hover-footer";

// ─── Link data ────────────────────────────────────────────────────────────────
// Items with an `href` point to a real, verified route and render as links.
// Items without an `href` have no real destination today — they stay in their
// original column/position as muted, non-interactive text rather than a dead
// "#" link or an invented route.

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Trang chủ",       href: "/"        },
      { label: "Sân thể thao",    href: "/venues"  },
      { label: "Huấn luyện viên", href: "/coach", comingSoon: true },
      { label: "Ghép đối",        href: "/match"   },
      { label: "Gói thành viên",  href: "/pricing" },
    ],
  },
  {
    title: "Booking",
    links: [
      { label: "Tìm sân",       href: "/venues"   },
      { label: "Lịch đặt sân",  href: "/bookings" },
      { label: "Bảng giá"                          },
      { label: "Thanh toán"                        },
    ],
  },
  {
    title: "Owner",
    links: [
      { label: "Quản lý sân" },
      { label: "Bảng giá"    },
      { label: "Booking"     },
      { label: "Báo cáo"     },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Liên hệ"    },
      { label: "Trợ giúp"   },
      { label: "Điều khoản" },
      { label: "Chính sách" },
    ],
  },
] as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

function ComingSoonBadge() {
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-white/15 bg-white/[0.07] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white/55">
      Sắp ra mắt
    </span>
  );
}

function FooterListItem({
  label,
  href,
  comingSoon,
}: {
  label: string;
  href?: string;
  comingSoon?: boolean;
}) {
  if (!href) {
    // No real destination — muted, non-interactive text. Same position and
    // list item, deliberately reduced prominence, no href="#", no role/
    // tabIndex/click handler pretending it's a link.
    return (
      <li>
        <span className="inline-block text-sm text-slate-600">{label}</span>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-400 transition-colors duration-200 hover:text-[#FF8000]"
      >
        <span>{label}</span>
        {comingSoon && <ComingSoonBadge />}
      </Link>
    </li>
  );
}

// A column is a semantic <nav> only when it actually contains navigation
// (at least one real link) — a column of purely inert labels is not a
// navigation landmark.
function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href?: string; comingSoon?: boolean }[];
}) {
  const hasRealLink = links.some((l) => l.href);
  const headingId = `footer-col-${title.toLowerCase()}`;
  const heading = (
    <h4 id={headingId} className="mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
      {title}
    </h4>
  );
  const list = (
    <ul className="space-y-2.5">
      {links.map((link) => (
        <FooterListItem key={link.label} {...link} />
      ))}
    </ul>
  );

  return hasRealLink ? (
    <nav aria-labelledby={headingId}>
      {heading}
      {list}
    </nav>
  ) : (
    <div>
      {heading}
      {list}
    </div>
  );
}

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
            <Link href="/" className="group flex w-fit items-center" aria-label="MatchOps — Trang chủ">
              <BrandLogo
                size="sm"
                title="MatchOps"
                className="transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C4C7C9]/50 select-none">
              Chơi đúng nơi. Gặp đúng người.
            </p>
          </div>

          {/* Four link columns */}
          {columns.map((col) => (
            <FooterColumn key={col.title} title={col.title} links={col.links} />
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
            <span className="text-xs text-slate-600">Điều khoản</span>
            <span className="text-xs text-slate-600">Bảo mật</span>
            <span className="text-xs text-slate-600">Liên hệ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
