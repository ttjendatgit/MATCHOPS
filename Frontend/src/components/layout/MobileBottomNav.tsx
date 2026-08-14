"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarCheck2,
  Home,
  MapPin,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Trang chủ", icon: Home, exact: true },
  { href: "/venues", label: "Tìm sân", icon: MapPin, exact: false },
  { href: "/bookings", label: "Đặt sân", icon: CalendarCheck2, exact: false },
  { href: "/account/settings", label: "Thông báo", icon: Bell, exact: false },
  { href: "/profile", label: "Cá nhân", icon: User, exact: false },
] as const;

const HIDDEN_PREFIXES = [
  "/login",
  "/register",
  "/verify-email",
  "/booking/payment",
  "/booking/summary",
  "/owner",
  "/admin",
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0A0A0A]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Điều hướng chính"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {TABS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF8000]/50",
                  active ? "text-[#FF8000]" : "text-slate-500 hover:text-slate-300",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-[#FF8000]")} aria-hidden />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
