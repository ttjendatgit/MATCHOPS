import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#030303]">
      <PublicNavbar />
      <main className="flex-1 pt-16 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <div className="hidden md:block">
        <PublicFooter />
      </div>
      <MobileBottomNav />
    </div>
  );
}
