import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    // bg-slate-950: the 64px zone behind the transparent navbar is dark,
    // so it blends seamlessly into the dark hero instead of showing white.
    <div className="flex min-h-screen flex-col bg-slate-950">
      <PublicNavbar />
      {/* pt-16 reserves the 64px navbar height for non-hero pages.
          The hero (min-h-screen) is still large enough to fill the viewport
          and its vertically-centered content doesn't collide with the navbar. */}
      <main className="flex-1 pt-16">{children}</main>
      <PublicFooter />
    </div>
  );
}
