"use client";

import { useState } from "react";
import { Camera, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CoachPortfolioImageResponse } from "@/types/coach";

interface PublicPortfolioGalleryProps {
  coachName: string;
  images: CoachPortfolioImageResponse[];
}

export function PublicPortfolioGallery({ coachName, images }: PublicPortfolioGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const activeImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-slate-900/50 p-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
        <Camera className="h-4 w-4 text-[#86D232]" aria-hidden />
        Ảnh hoạt động
      </h2>

      {images.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <ImageOff className="h-4 w-4 shrink-0" aria-hidden />
          Huấn luyện viên chưa đăng ảnh hoạt động.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => {
            const label = image.caption
              ? `Ảnh hoạt động của ${coachName}: ${image.caption}`
              : `Ảnh hoạt động của ${coachName}`;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setLightboxIndex(index)}
                aria-label={`Xem ${label}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86D232]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.imageUrl}
                  alt={label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                {image.caption && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-slate-950/90 to-transparent px-2 pb-1.5 pt-4 text-left text-[11px] font-medium text-slate-200">
                    {image.caption}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-2xl">
          {activeImage && (
            <>
              <DialogHeader>
                <DialogTitle>Ảnh hoạt động</DialogTitle>
                {activeImage.caption && (
                  <DialogDescription>{activeImage.caption}</DialogDescription>
                )}
              </DialogHeader>
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImage.imageUrl}
                  alt={
                    activeImage.caption
                      ? `Ảnh hoạt động của ${coachName}: ${activeImage.caption}, phóng to`
                      : `Ảnh hoạt động của ${coachName}, phóng to`
                  }
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
              {images.length > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={lightboxIndex === 0}
                    onClick={() => setLightboxIndex((i) => (i !== null ? Math.max(0, i - 1) : i))}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Trước
                  </Button>
                  <span className="text-xs text-[#C4C7C9]/60">
                    {(lightboxIndex ?? 0) + 1}/{images.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={lightboxIndex === images.length - 1}
                    onClick={() =>
                      setLightboxIndex((i) => (i !== null ? Math.min(images.length - 1, i + 1) : i))
                    }
                    className="gap-1"
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
