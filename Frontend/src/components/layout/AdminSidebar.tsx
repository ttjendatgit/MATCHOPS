"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Dumbbell,
  LogOut,
  UserCheck,
  X,
  PlayCircle,
  Calendar,
  Users2,
  CreditCard,
  TrendingUp,
  Settings,
  Receipt,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/branding";
import { clearAuthData, getStoredUser } from "@/lib/auth";
import type { User } from "@/types/auth";

const navItems = [
  { href: "/admin",            icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/admin/venues",     icon: Building2,       label: "Duyệt cơ sở" },
  { href: "/admin/owner-applications", icon: Store, label: "ĐK Chủ sân" },
  { href: "/admin/coaches",    icon: UserCheck,       label: "Huấn luyện viên" },
  { href: "/admin/users",      icon: Users,           label: "Người dùng" },
  { href: "/admin/courts",     icon: PlayCircle,      label: "Sân" },
  { href: "/admin/bookings",   icon: Calendar,        label: "Lịch đặt" },
  { href: "/admin/matches",    icon: Users2,          label: "Trận đấu" },
  { href: "/admin/membership", icon: CreditCard,      label: "Membership" },
  { href: "/admin/transactions", icon: Receipt,         label: "Giao dịch" },
  { href: "/admin/sports",     icon: Dumbbell,        label: "Môn thể thao" },
  { href: "/admin/analytics",  icon: TrendingUp,      label: "Phân tích" },
  { href: "/admin/settings",   icon: Settings,        label: "Cài đặt" },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const handleLogout = () => {
    clearAuthData();
    router.push("/");
  };

  const initials = (user?.fullName ?? "Admin")
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
        "border-r border-[rgba(255,128,0,0.2)] bg-[#0A0A0A]",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo area */}
      <div className="relative flex h-16 shrink-0 items-center gap-2.5 border-b border-[rgba(255,128,0,0.15)] px-5 overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#86D232]/60 via-[#86D232]/30 to-transparent" />
        <Link href="/admin" aria-label="MatchOps Admin — Tổng quan">
          <BrandLogo size="sm" />
        </Link>
        <span className="ml-auto rounded-md bg-[rgba(255,128,0,0.15)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FF8000]">
          ADMIN
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
          Quản trị hệ thống
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
                      ? "bg-[rgba(134,210,50,0.12)] text-white"
                      : "text-[#C4C7C9] hover:bg-[#141414] hover:text-white"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[#86D232]" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-all duration-150",
                      active
                        ? "text-[#86D232]"
                        : "text-[#C4C7C9]/60 group-hover:text-[#C4C7C9] group-hover:scale-110"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#86D232]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-[rgba(255,128,0,0.15)] p-4">
        <div className="flex items-center gap-3 rounded-lg bg-[#141414] px-3 py-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-[rgba(134,210,50,0.2)] text-xs font-bold text-[#86D232]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.fullName ?? "Admin"}
            </p>
            <p className="truncate text-xs text-[#C4C7C9]/60">{user?.email ?? "admin@matchops.vn"}</p>
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
