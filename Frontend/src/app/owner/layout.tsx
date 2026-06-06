import { OwnerSidebar } from "@/components/layout/OwnerSidebar";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <OwnerSidebar />
      <div className="flex-1 pl-60">
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
