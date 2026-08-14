"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, Zap, Home, ShieldOff } from "lucide-react";
import Link from "next/link";
import { getStoredUser, getStoredToken, verifySession } from "@/lib/auth";
import type { User } from "@/types/auth";
import { OwnerSidebar } from "@/components/layout/OwnerSidebar";

function decodeTokenRole(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ?? null;
  } catch {
    return null;
  }
}

export default function OwnerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const stored = getStoredUser();

    setMounted(true);

    if (!token || !stored) {
      router.replace("/login?redirect=/owner");
      return;
    }

    const tokenRole = decodeTokenRole(token);
    if (tokenRole && tokenRole !== stored.role) {
      // Token role differs from localStorage — verify with server for authoritative role.
      verifySession().then((fresh) => {
        if (fresh && fresh.role === "OWNER") {
          setUser(fresh);
        } else {
          // Role is not OWNER even after refresh — redirect to home.
          router.replace("/");
        }
      });
    } else {
      setUser(stored);
    }
  }, [router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030303]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF8000] shadow-[0_0_20px_rgba(255,128,0,0.4)]">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white font-heading tracking-tight">MatchOps</span>
          </div>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#141414] border-t-[#FF8000]" />
          <p className="text-xs text-[#C4C7C9]/50">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== "OWNER") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030303] p-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-[rgba(134,210,50,0.2)] bg-[#0A0A0A] p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(255,75,75,0.25)] bg-[rgba(255,75,75,0.08)]">
              <ShieldOff className="h-8 w-8 text-[#FF4B4B]" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-white font-heading">
              Truy cập bị từ chối
            </h1>
            <p className="mb-1 text-sm text-[#C4C7C9]">
              Bạn không có quyền truy cập khu vực chủ sân.
            </p>
            <p className="mb-6 text-xs text-[#C4C7C9]/40">
              Vai trò hiện tại:{" "}
              <span className="font-medium text-[#C4C7C9]/60">{user.role}</span>
            </p>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF8000] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#FF8000]/85 active:scale-[0.98]"
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
    <div className="flex min-h-screen overflow-x-hidden bg-[#030303]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <OwnerSidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-[rgba(134,210,50,0.15)] bg-[#030303]/95 px-4 backdrop-blur-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Mở menu"
            className="touch-target flex items-center justify-center rounded-lg border border-[rgba(134,210,50,0.25)] text-[#C4C7C9] transition-colors hover:bg-[#141414] hover:text-white"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF8000] shadow-[0_0_10px_rgba(255,128,0,0.35)]">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white font-heading">MatchOps</span>
          </div>
          <span className="ml-auto rounded-md bg-[rgba(255,128,0,0.15)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FF8000]">
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
