"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right";
  title?: string;
};

/** Slide drawer cho mobile — thay sidebar/dropdown desktop */
export function MobileDrawer({
  open,
  onClose,
  children,
  side = "left",
  title = "Menu",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Đóng menu"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-y-0 flex w-[min(100vw-3rem,320px)] flex-col bg-[#0A0A0A] shadow-2xl",
          "motion-safe:animate-in motion-safe:duration-300",
          side === "left"
            ? "left-0 border-r border-white/10 motion-safe:slide-in-from-left"
            : "right-0 border-l border-white/10 motion-safe:slide-in-from-right",
        )}
      >
        <div className="flex h-14 shrink-0 items-center border-b border-white/10 px-4">
          <p className="text-sm font-semibold text-white">{title}</p>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-3">{children}</div>
      </div>
    </div>
  );
}
