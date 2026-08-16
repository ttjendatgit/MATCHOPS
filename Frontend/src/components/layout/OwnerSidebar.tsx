"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck2,
  CalendarDays,
  DollarSign,
  TrendingUp,
  UserCircle,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clearAuthData } from "@/lib/auth";
import { BrandLogo } from "@/components/branding";
import type { User } from "@/types/auth";

const navItems = [
  { href: "/owner",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/owner/venues",   icon: Building2,       label: "Cụm sân" },
  { href: "/owner/bookings", icon: CalendarCheck2,  label: "Lịch đặt" },
  { href: "/owner/calendar", icon: CalendarDays,    label: "Lịch sân" },
  { href: "/owner/pricing",  icon: DollarSign,      label: "Bảng giá" },
  { href: "/owner/revenue",  icon: TrendingUp,      label: "Doanh thu" },
  { href: "/owner/profile",  icon: UserCircle,      label: "Hồ sơ chủ sân" },
];

interface OwnerSidebarProps {
  user: User;
  open: boolean;
  onClose: () => void;
}

export function OwnerSidebar({ user, open, onClose }: OwnerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/owner" ? pathname === "/owner" : pathname.startsWith(href);

  const handleLogout = () => {
    clearAuthData();
    router.push("/");
  };

  const initials = user.fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out",
        "border-r border-[rgba(134,210,50,0.2)] bg-[#0A0A0A]",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo area */}
      <div className="relative flex h-16 shrink-0 items-center gap-2.5 border-b border-[rgba(134,210,50,0.15)] px-5 overflow-hidden">
        {/* Subtle orange glow behind logo */}
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#FF6A00]/60 via-[#FF6A00]/30 to-transparent" />
        <Link href="/owner" aria-label="MatchOps Owner — Dashboard">
          <BrandLogo size="sm" />
        </Link>
        <span className="ml-auto rounded-md bg-[rgba(255,106,0,0.15)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FF6A00]">
          OWNER
        </span>
        <button
          onClick={onClose}
          aria-label="Đóng menu"
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#C4C7C9] transition-colors hover:bg-[#141414] hover:text-white lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#C4C7C9]/40">
          Menu
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-[rgba(255,128,0,0.12)] text-white"
                      : "text-[#C4C7C9] hover:bg-[#141414] hover:text-white"
                  )}
                >
                  {/* Active left accent bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[#FF8000]" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-all duration-150",
                      active
                        ? "text-[#FF8000]"
                        : "text-[#C4C7C9]/60 group-hover:text-[#C4C7C9] group-hover:scale-110"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF8000]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-[rgba(134,210,50,0.15)] p-4">
        <div className="flex items-center gap-3 rounded-lg bg-[#141414] px-3 py-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-[rgba(255,128,0,0.2)] text-xs font-bold text-[#FF8000]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user.fullName}
            </p>
            <p className="truncate text-xs text-[#C4C7C9]/60">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#C4C7C9]/50 transition-colors hover:bg-[rgba(255,75,75,0.15)] hover:text-[#FF4B4B]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
