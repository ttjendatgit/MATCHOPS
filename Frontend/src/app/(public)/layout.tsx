"use client";

import { usePathname } from "next/navigation";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { cn } from "@/lib/utils";

const FULLSCREEN_ROUTES = ["/chat", "/ai-chat"];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some((route) => pathname?.startsWith(route));

  return (
    <div
      className={cn(
        "flex flex-col overflow-x-hidden bg-[#030303]",
        isFullscreen ? "h-screen overflow-hidden" : "min-h-screen"
      )}
    >
      <PublicNavbar />
      <main
        className={cn(
          "flex flex-1 flex-col pt-16",
          isFullscreen
            ? "min-h-0 overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0"
            : "pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0"
        )}
      >
        {children}
      </main>
      {!isFullscreen && (
        <div className="hidden md:block">
          <PublicFooter />
        </div>
      )}
      <MobileBottomNav />
    </div>
  );
}
