"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, Zap, Home, ShieldOff } from "lucide-react";
import Link from "next/link";
import { getStoredUser, getStoredToken } from "@/lib/auth";
import type { User } from "@/types/auth";
import { OwnerSidebar } from "@/components/layout/OwnerSidebar";

export default function OwnerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const u = getStoredUser();

    setMounted(true);

    if (!token || !u) {
      router.replace("/login?redirect=/owner");
      return;
    }

    setUser(u);
  }, [router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-white font-heading">MatchOps</span>
          </div>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== "OWNER") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
              <ShieldOff className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-white font-heading">
              Truy cập bị từ chối
            </h1>
            <p className="mb-1 text-sm text-slate-400">
              Bạn không có quyền truy cập khu vực chủ sân.
            </p>
            <p className="mb-6 text-xs text-slate-600">
              Vai trò hiện tại:{" "}
              <span className="font-medium text-slate-500">{user.role}</span>
            </p>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:opacity-90"
            >
              <Home className="h-4 w-4" />
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <OwnerSidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Mở menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-bold text-white font-heading">MatchOps</span>
          </div>
          <span className="ml-auto rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
            OWNER
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
