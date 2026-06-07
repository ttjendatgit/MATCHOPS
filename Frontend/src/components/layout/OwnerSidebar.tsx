"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck2,
  DollarSign,
  TrendingUp,
  UserCircle,
  ChevronRight,
  LogOut,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clearAuthData } from "@/lib/auth";
import type { User } from "@/types/auth";

const navItems = [
  { href: "/owner",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/owner/venues",   icon: Building2,       label: "Cụm sân" },
  { href: "/owner/bookings", icon: CalendarCheck2,  label: "Lịch đặt" },
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
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-800 px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-slate-900" />
        </div>
        <span className="text-base font-bold tracking-tight text-white font-heading">
          MatchOps
        </span>
        <span className="ml-auto rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
          OWNER
        </span>
        <button
          onClick={onClose}
          aria-label="Đóng menu"
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
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
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-primary" : "text-slate-500"
                    )}
                  />
                  {item.label}
                  {active && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user.fullName}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
