"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type BackLinkProps = {
  label?: string;
  fallbackHref?: string;
  className?: string;
  /** Dùng Link thay vì router.back() khi cần đích cố định */
  href?: string;
  /** pill = nút viền, dễ thấy trên desktop & mobile */
  variant?: "text" | "pill";
};

const variantClasses = {
  text: cn(
    "inline-flex min-h-11 items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/40 focus-visible:rounded-lg",
  ),
  pill: cn(
    "inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5",
    "text-sm font-medium text-slate-300 transition-all",
    "hover:border-white/20 hover:bg-white/[0.08] hover:text-white",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/40",
  ),
};

export function BackLink({
  label = "Quay lại",
  fallbackHref = "/",
  className,
  href,
  variant = "pill",
}: BackLinkProps) {
  const router = useRouter();
  const classes = cn(variantClasses[variant], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }} className={classes}>
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}

/** Thanh back + tiêu đề — hiển thị trên mọi breakpoint */
export function DetailPageHeader({
  title,
  backLabel,
  fallbackHref,
  href,
  className,
  variant = "pill",
}: {
  title?: string;
  backLabel?: string;
  fallbackHref?: string;
  href?: string;
  className?: string;
  variant?: "text" | "pill";
}) {
  return (
    <div
      className={cn(
        "mb-6",
        "sticky top-16 z-30 -mx-4 border-b border-white/5 bg-[#030303]/95 px-4 py-3 backdrop-blur-md",
        "md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none",
        className,
      )}
    >
      <BackLink label={backLabel} fallbackHref={fallbackHref} href={href} variant={variant} />
      {title && (
        <h1 className="mt-3 line-clamp-2 text-lg font-bold text-white md:mt-4 md:text-2xl">
          {title}
        </h1>
      )}
    </div>
  );
}
