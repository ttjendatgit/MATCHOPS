"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  CalendarCheck2,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Star,
  User as UserIcon,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import {
  getStoredUser,
  getStoredToken,
  clearAuthData,
  verifySession,
} from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api";
import { BrandMark } from "@/components/branding";
import type { User } from "@/types/auth";
import type { ApiResponse } from "@/types/api";
import type { CoachProfileMeResponse } from "@/types/coach";

/**
 * Decode the role claim from a JWT without cryptographic verification.
 * We only decode for display-matching; server-side is authoritative.
 * Returns null if token is missing or cannot be decoded.
 */
function decodeTokenRole(token: string | null): string | null {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    return (
      payload[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ] ?? null
    );
  } catch {
    return null;
  }
}

// ─── Nav data ─────────────────────────────────────────────────────────────────
//
// FIX:
// Removed duplicated navigation items.
// Every href is now unique, so key={link.href} will also be unique.

const navLinks = [
  { href: "/", label: "Trang", exact: true },
  { href: "/venues", label: "Sân thể thao", exact: false },
  { href: "/coach", label: "Huấn luyện viên", exact: false },
  { href: "/match", label: "Ghép", exact: false },
  { href: "/ai-chat", label: "AI", exact: false },
  { href: "/pricing", label: "Gói", exact: false },
] as const;

function checkActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

// ─── Logo mark — shared between mobile (left) and desktop (center) ────────────

function LogoMark() {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center"
      aria-label="MatchOps — Trang chủ"
    >
      <BrandMark
        size={36}
        title="MatchOps"
        className="transition-transform duration-200 group-hover:scale-[1.03]"
      />
    </Link>
  );
}

// ─── Nav link — vertical text-flip micro-animation ────────────────────────────

type NavLinkProps = {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
};

function NavLink({
  href,
  label,
  active,
  onClick,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative px-3 py-2 text-sm font-medium rounded-full",
        "group overflow-hidden transition-all duration-200",
        active
          ? "bg-[#FF8000]/14 text-[#FF8000] border border-[#FF8000]/32 shadow-sm shadow-[#FF8000]/18"
          : "border border-transparent text-slate-300 hover:text-white hover:bg-white/[0.07]"
      )}
    >
      <span className="relative block overflow-hidden h-5 leading-5 whitespace-nowrap">
        <span className="block whitespace-nowrap motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:-translate-y-full">
          {label}
        </span>

        <span className="absolute top-full left-0 block whitespace-nowrap text-white motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:-translate-y-full">
          {label}
        </span>
      </span>
    </Link>
  );
}

// ─── User avatar dropdown ─────────────────────────────────────────────────────

type UserDropdownProps = {
  user: User;
  hasCoachProfile: boolean;
  onLogout: () => void;
};

const dropdownMenuItems = [
  {
    href: "/profile",
    label: "Trang cá nhân",
    icon: UserIcon,
  },
  {
    href: "/account/subscription",
    label: "Gói của tôi",
    icon: Star,
  },
  {
    href: "/match/rooms",
    label: "Phòng chờ ghép đối",
    icon: Users,
  },
  {
    href: "/bookings",
    label: "Lịch đặt của tôi",
    icon: CalendarCheck2,
  },
  {
    href: "/coach/requests",
    label: "Yêu cầu của tôi",
    icon: ClipboardList,
  },
  {
    href: "/coach/sessions",
    label: "Buổi huấn luyện của tôi",
    icon: CalendarClock,
  },
  {
    href: "/change-password",
    label: "Đổi mật khẩu",
    icon: KeyRound,
  },
  {
    href: "/account/settings",
    label: "Cài đặt tài khoản",
    icon: Settings,
  },
];

const coachManageMenuItem = {
  href: "/coach/manage",
  label: "Quản lý huấn luyện viên",
  icon: UserCog,
};

function UserDropdown({
  user,
  hasCoachProfile,
  onLogout,
}: UserDropdownProps) {
  const items = hasCoachProfile
    ? [
        ...dropdownMenuItems.slice(0, 6),
        coachManageMenuItem,
        ...dropdownMenuItems.slice(6),
      ]
    : dropdownMenuItems;

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);

    return () =>
      document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const initials = user.fullName.slice(0, 2).toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Tài khoản của ${user.fullName}`}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-1.5 py-1",
          "border transition-all duration-200",
          open
            ? "border-[#FF8000]/28 bg-[#FF8000]/8 shadow-[0_0_18px_rgba(255,128,0,0.28)]"
            : "border-[#FF8000]/15 bg-[#FF8000]/[0.05] hover:border-[#FF8000]/28 hover:bg-[#FF8000]/8 hover:shadow-[0_0_14px_rgba(255,128,0,0.22)]"
        )}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF8000]/12 border border-[#FF8000]/22">
          <span className="text-[10px] font-bold text-[#FF8000]">
            {initials}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "h-3 w-3 text-slate-400 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-[calc(100%+8px)] z-50",
            "w-60 overflow-hidden rounded-2xl",
            "bg-slate-950/95 backdrop-blur-xl",
            "border border-white/10",
            "shadow-2xl shadow-black/60",
            "ring-1 ring-[#FF8000]/[0.10]"
          )}
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-sm font-semibold text-white truncate">
              {user.fullName}
            </p>

            <p className="text-xs text-slate-500 truncate">
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="p-1.5 space-y-0.5">
            {items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-300 transition-all duration-150 hover:bg-white/[0.06] hover:text-white group"
              >
                <Icon
                  className="h-3.5 w-3.5 text-slate-500 group-hover:text-[#FF8000] transition-colors duration-150"
                  aria-hidden
                />

                {label}
              </Link>
            ))}
          </div>

          {/* Separator + logout */}
          <div className="border-t border-white/[0.06] p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-400 transition-all duration-150 hover:bg-red-500/[0.08] hover:text-red-400 group"
            >
              <LogOut
                className="h-3.5 w-3.5 text-slate-500 group-hover:text-red-400 transition-colors duration-150"
                aria-hidden
              />

              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function PublicNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // null while unchecked/checking — link stays hidden until the check resolves true.
  const [hasCoachProfile, setHasCoachProfile] =
    useState<boolean | null>(null);

  // Close mobile menu on route change + re-sync auth state on every navigation.
  useEffect(() => {
    setMobileOpen(false);
    setUser(getStoredUser());
  }, [pathname]);

  // On first mount, validate the stored token against /api/auth/me
  // so stale or expired tokens are cleared and the navbar reflects
  // the real auth state.
  //
  // Also detect role mismatches: if the role stored in localStorage
  // doesn't match the role encoded in the JWT, force a server-side
  // session verification to pick up the authoritative role.
  useEffect(() => {
    const stored = getStoredUser();
    const tokenRole = decodeTokenRole(getStoredToken());

    if (stored && tokenRole && stored.role !== tokenRole) {
      // Token claims a different role than localStorage — verify with server.
      verifySession().then((fresh) => {
        if (fresh) setUser(fresh);
      });
    } else {
      verifySession().then(setUser);
    }
  }, []);

  // Check coach-profile ownership once per logged-in identity
  // (not on every route change) so the "Quản lý huấn luyện viên"
  // link only shows for users who actually have a CoachProfile.
  //
  // A 404 just means no profile — not an error.
  useEffect(() => {
    if (!user) {
      setHasCoachProfile(null);
      return;
    }

    const token = getStoredToken();

    if (!token) {
      setHasCoachProfile(null);
      return;
    }

    setHasCoachProfile(null);

    let cancelled = false;

    apiFetch<ApiResponse<CoachProfileMeResponse>>(
      "/coaches/me",
      { token }
    )
      .then((res) => {
        if (!cancelled) {
          setHasCoachProfile(!!(res.success && res.data));
        }
      })
      .catch((err) => {
        if (cancelled) return;

        setHasCoachProfile(
          err instanceof ApiError && err.status === 404
            ? false
            : null
        );
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Scroll-aware — becomes opaque glass after 20 px.
  useEffect(() => {
    const onScroll = () =>
      setScrolled(window.scrollY > 20);

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () =>
      window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogout() {
    clearAuthData();
    setUser(null);
    setHasCoachProfile(null);
    router.push("/");
  }

  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 z-50",
        "motion-safe:transition-all motion-safe:duration-300",
        scrolled
          ? [
              "bg-slate-950/88 backdrop-blur-xl",
              "border-b border-white/[0.08]",
              "shadow-[0_4px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,128,0,0.06)]",
            ]
          : "bg-transparent border-b border-transparent"
      )}
    >
      {/* ── Main bar ── */}
      <div className="mx-auto h-16 max-w-7xl px-5 sm:px-6 flex items-center">

        {/* ── Mobile row: menu + logo + actions ── */}
        <div className="flex w-full items-center gap-2 md:hidden">
          <button
            type="button"
            className="touch-target flex shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-nav"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          <div className="flex flex-1 justify-center">
            <LogoMark />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/account/settings"
              className="touch-target flex items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Thông báo và cài đặt"
            >
              <Bell className="h-5 w-5" aria-hidden />
            </Link>
            {user ? (
              <Link
                href="/profile"
                className="touch-target flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#FF8000]/30 bg-[#FF8000]/10 text-xs font-bold text-[#FF8000]"
                aria-label="Trang cá nhân"
              >
                {user.fullName?.charAt(0)?.toUpperCase() ?? "U"}
              </Link>
            ) : (
              <Link
                href="/login"
                className="touch-target flex items-center justify-center rounded-full px-2 text-xs font-semibold text-[#FF8000]"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>

        {/* ── Desktop 3-col grid ── */}
        <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] items-center w-full gap-x-4">

          {/* Col 1 — primary nav links */}
          <nav
            className="flex items-center gap-0.5"
            aria-label="Primary navigation"
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={checkActive(
                  pathname,
                  link.href,
                  link.exact
                )}
              />
            ))}
          </nav>

          {/* Col 2 — centered logo mark */}
          <LogoMark />

          {/* Col 3 — auth / user actions */}
          <div className="flex items-center justify-end gap-2.5">
            {user ? (
              /* ── Logged-in ── */
              <div className="flex items-center gap-2">

                {user.role === "USER" && (
                  <Link
                    href="/become-owner"
                    className="flex items-center gap-1.5 rounded-full border border-[#FF8000]/22 bg-[#FF8000]/[0.05] px-3.5 py-2 text-xs font-medium text-[#FF8000] transition-all duration-200 hover:border-[#FF8000]/35 hover:bg-[#FF8000]/10"
                  >
                    <Building2 className="h-3.5 w-3.5" aria-hidden />
                    Trở thành chủ sân
                  </Link>
                )}

                {user.role === "OWNER" && (
                  <Link
                    href="/owner"
                    className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-white/30 hover:bg-white/5 hover:text-white"
                  >
                    <LayoutDashboard
                      className="h-3.5 w-3.5"
                      aria-hidden
                    />
                    Dashboard Chủ sân
                  </Link>
                )}

                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 rounded-full border border-[#FF8000]/22 bg-[#FF8000]/[0.05] px-3.5 py-2 text-xs font-medium text-[#FF8000] transition-all duration-200 hover:border-[#FF8000]/35 hover:bg-[#FF8000]/10"
                  >
                    <LayoutDashboard
                      className="h-3.5 w-3.5"
                      aria-hidden
                    />
                    Dashboard Admin
                  </Link>
                )}

                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 rounded-full border border-[#86D232]/30 bg-[#86D232]/[0.08] px-3.5 py-2 text-xs font-semibold text-[#86D232] transition-all duration-200 hover:border-[#86D232]/50 hover:bg-[#86D232]/[0.14] hover:shadow-[0_0_14px_rgba(134,210,50,0.25)]"
                  >
                    <ShieldCheck
                      className="h-3.5 w-3.5"
                      aria-hidden
                    />
                    Quản trị
                  </Link>
                )}

                <Link
                  href="/bookings"
                  className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-[#FF8000]/22 hover:bg-[#FF8000]/[0.05] hover:text-white"
                >
                  <CalendarCheck2
                    className="h-3.5 w-3.5"
                    aria-hidden
                  />
                  Lịch đặt
                </Link>

                <UserDropdown
                  user={user}
                  hasCoachProfile={!!hasCoachProfile}
                  onLogout={handleLogout}
                />
              </div>
            ) : (
              /* ── Guest ── */
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-[#FF8000]/22 hover:bg-[#FF8000]/[0.05] hover:text-white"
                >
                  Đăng nhập
                </Link>

                <Link
                  href="/register"
                  className="rounded-full bg-[#FF8000] px-4 py-2 text-sm font-bold text-white shadow-[0_0_22px_rgba(255,128,0,0.45)] transition-all duration-200 hover:-translate-y-px hover:bg-[#FF8000]/90 hover:shadow-[0_0_32px_rgba(255,128,0,0.65)]"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile slide drawer ── */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Menu MatchOps"
      >
        <div id="public-mobile-nav" className="space-y-1">

          {/* Nav links */}
          {navLinks.map((link) => {
            const active = checkActive(
              pathname,
              link.href,
              link.exact
            );

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[#FF8000]/8 text-[#FF8000] border border-[#FF8000]/15"
                    : "border border-transparent text-slate-400 hover:bg-white/[0.07] hover:text-white"
                )}
                onClick={() =>
                  setMobileOpen(false)
                }
              >
                {link.label}
              </Link>
            );
          })}

          <div className="h-px bg-white/[0.08] my-2" />

          {user ? (
            /* ── Mobile: logged-in section ── */
            <>
              {/* User identity */}
              <div className="flex items-center gap-2.5 rounded-xl border border-[#FF8000]/15 bg-[#FF8000]/[0.04] px-3.5 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#FF8000]/22 bg-[#FF8000]/8">
                  <span className="text-[11px] font-bold text-[#FF8000]">
                    {user.fullName
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-300">
                    {user.fullName}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                  </p>
                </div>
              </div>

              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl border border-transparent px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
                onClick={() =>
                  setMobileOpen(false)
                }
              >
                <UserIcon
                  className="h-4 w-4"
                  aria-hidden
                />
                Trang cá nhân
              </Link>

              <Link
                href="/bookings"
                className="flex items-center gap-2 rounded-xl border border-transparent px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
                onClick={() =>
                  setMobileOpen(false)
                }
              >
                <CalendarCheck2
                  className="h-4 w-4"
                  aria-hidden
                />
                Lịch đặt của tôi
              </Link>

              <Link
                href="/coach/requests"
                className="flex items-center gap-2 rounded-xl border border-transparent px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
                onClick={() =>
                  setMobileOpen(false)
                }
              >
                <ClipboardList
                  className="h-4 w-4"
                  aria-hidden
                />
                Yêu cầu của tôi
              </Link>

              <Link
                href="/coach/sessions"
                className="flex items-center gap-2 rounded-xl border border-transparent px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
                onClick={() =>
                  setMobileOpen(false)
                }
              >
                <CalendarClock
                  className="h-4 w-4"
                  aria-hidden
                />
                Buổi huấn luyện của tôi
              </Link>

              {hasCoachProfile && (
                <Link
                  href="/coach/manage"
                  className="flex items-center gap-2 rounded-xl border border-transparent px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                >
                  <UserCog
                    className="h-4 w-4"
                    aria-hidden
                  />
                  Quản lý huấn luyện viên
                </Link>
              )}

              <Link
                href="/change-password"
                className="flex items-center gap-2 rounded-xl border border-transparent px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
                onClick={() =>
                  setMobileOpen(false)
                }
              >
                <KeyRound
                  className="h-4 w-4"
                  aria-hidden
                />
                Đổi mật khẩu
              </Link>

              <Link
                href="/account/settings"
                className="flex items-center gap-2 rounded-xl border border-transparent px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
                onClick={() =>
                  setMobileOpen(false)
                }
              >
                <Settings
                  className="h-4 w-4"
                  aria-hidden
                />
                Cài đặt tài khoản
              </Link>

              {user.role === "USER" && (
                <Link
                  href="/become-owner"
                  className="flex items-center gap-2 rounded-xl border border-[#FF8000]/20 bg-[#FF8000]/[0.04] px-3.5 py-2.5 text-sm font-medium text-[#FF8000] transition-all duration-200 hover:bg-[#FF8000]/[0.07]"
                  onClick={() => setMobileOpen(false)}
                >
                  <Building2 className="h-4 w-4" aria-hidden />
                  Trở thành chủ sân
                </Link>
              )}

              {user.role === "OWNER" && (
                <Link
                  href="/owner"
                  className="flex items-center gap-2 rounded-xl border border-transparent px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                >
                  <LayoutDashboard
                    className="h-4 w-4"
                    aria-hidden
                  />
                  Dashboard Chủ sân
                </Link>
              )}

              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-xl border border-[#FF8000]/20 bg-[#FF8000]/[0.04] px-3.5 py-2.5 text-sm font-medium text-[#FF8000] transition-all duration-200 hover:bg-[#FF8000]/[0.07]"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                >
                  <LayoutDashboard
                    className="h-4 w-4"
                    aria-hidden
                  />
                  Dashboard Admin
                </Link>
              )}

              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-xl border border-[#86D232]/20 bg-[#86D232]/[0.06] px-3.5 py-2.5 text-sm font-semibold text-[#86D232] transition-all duration-200 hover:border-[#86D232]/35 hover:bg-[#86D232]/[0.12]"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                >
                  <ShieldCheck
                    className="h-4 w-4"
                    aria-hidden
                  />
                  Quản trị hệ thống
                </Link>
              )}

              <div className="h-px bg-white/[0.06] my-1" />

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl border border-transparent px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-red-500/[0.07] hover:text-red-400"
              >
                <LogOut
                  className="h-4 w-4"
                  aria-hidden
                />
                Đăng xuất
              </button>
            </>
          ) : (
            /* ── Mobile: guest section ── */
            <>
              <Link
                href="/login"
                className="flex items-center rounded-xl border border-white/10 px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-[#FF8000]/20 hover:bg-[#FF8000]/[0.05] hover:text-white"
                onClick={() =>
                  setMobileOpen(false)
                }
              >
                Đăng nhập
              </Link>

              <Link
                href="/register"
                className="mt-1 flex items-center justify-center rounded-xl bg-[#FF8000] px-3.5 py-2.5 text-sm font-bold text-white shadow-[0_0_22px_rgba(255,128,0,0.45)] transition-all duration-200 hover:bg-[#FF8000]/90 hover:shadow-[0_0_32px_rgba(255,128,0,0.65)]"
                onClick={() =>
                  setMobileOpen(false)
                }
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </MobileDrawer>
    </div>
  );
}