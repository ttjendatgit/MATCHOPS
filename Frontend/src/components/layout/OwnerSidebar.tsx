"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, CalendarCheck2,
  MapPin, ChevronRight, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/owner",          icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/owner/venues",   icon: Building2,       label: "Cơ sở của tôi" },
  { href: "/owner/bookings", icon: CalendarCheck2,  label: "Đặt sân" },
];

export function OwnerSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/owner" ? pathname === "/owner" : pathname.startsWith(href);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-slate-100 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <MapPin className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-slate-900">MatchOps</span>
        <span className="ml-auto rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
          OWNER
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-slate-400")} />
                  {item.label}
                  {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">OW</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">Chủ sân</p>
            <p className="truncate text-xs text-slate-500">owner@matchops.vn</p>
          </div>
          <button className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
