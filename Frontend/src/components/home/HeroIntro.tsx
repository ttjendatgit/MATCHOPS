"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// ── Bold geometric M mark ──────────────────────────────────────────────────────
function MLogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 22 L46 10 L110 92 L174 10 L208 22 L208 148 L174 148 L174 38 L110 118 L46 38 L46 148 L12 148 Z"
        fill="#FF8000"
      />
      {/* Top-ridge specular — bright chamfer along the arm peaks */}
      <path
        d="M50 10 L110 88 L170 10 L174 10 L110 92 L46 10 Z"
        fill="#fff7ed"
        opacity="0.44"
      />
      {/* Left-pillar shadow — 3-D depth */}
      <path d="M12 22 L12 148 L26 148 L26 22 Z" fill="#1a0800" opacity="0.58" />
      {/* Right-pillar shadow — symmetric depth */}
      <path d="M194 22 L194 148 L208 148 L208 22 Z" fill="#1a0800" opacity="0.38" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
//
// Architecture: all display content (M, glow, wordmark, light-sweep) lives as
// direct children of mi-intro-root — NOT inside the split panels. This prevents
// the 50 vw panel seam from cutting through the logo / text and appearing as a
// vertical crack or corrupting letter-forms (e.g. "MATCHOPS" → "MATHOPS").
//
// The split panels are pure colour slabs. The mi-bg-canvas below them provides
// a seamless cinematic background visible as panels pull apart.
//
// Dev replay: append ?intro=1 to any page URL to force replay.

export function HeroIntro() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const forceReplay =
      process.env.NODE_ENV === "development" ||
      new URLSearchParams(window.location.search).get("intro") === "1";

    if (!forceReplay && sessionStorage.getItem("matchops_intro_seen")) {
      root.style.display = "none";
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.display = "none";
      if (!forceReplay) sessionStorage.setItem("matchops_intro_seen", "1");
      return;
    }

    const ctx = gsap.context(() => {

      // ── Initial states ───────────────────────────────────────────────────────

      gsap.set(".mi-intro-logo", {
        xPercent: -50,
        yPercent: -50,
        autoAlpha: 0,
        scale: 0.35,
        rotate: -6,
      });

      gsap.set(".mi-logo-glow", {
        xPercent: -50,
        yPercent: -50,
        autoAlpha: 0,
        scale: 0.4,
      });

      gsap.set(".mi-intro-wordmark", {
        xPercent: -50,
        autoAlpha: 0,
        y: 16,
      });

      gsap.set(".mi-center-beam", {
        autoAlpha: 0,
        scaleY: 0.04,
        transformOrigin: "center 35%",
      });

      gsap.set(".mi-speed-line", {
        autoAlpha: 0,
        y: -160,
      });

      gsap.set(".mi-split-panel", {
        xPercent: 0,
        filter: "blur(0px)",
      });

      // Rotation pivot anchored to the outer edge of each panel — creates a
      // subtle "peel-away" effect instead of a flat horizontal slide on exit.
      gsap.set(".mi-split-left",  { rotate: 0, transformOrigin: "left center" });
      gsap.set(".mi-split-right", { rotate: 0, transformOrigin: "right center" });

      gsap.set(".mi-impact-ring", {
        xPercent: -50,
        yPercent: -50,
        autoAlpha: 0,
        scale: 0.3,
      });

      gsap.set(".mi-light-sweep", {
        autoAlpha: 0,
        scaleX: 0,
        transformOrigin: "left center",
      });

      // ── Master timeline (~2.0 s total) ───────────────────────────────────────
      const tl = gsap.timeline({
        onComplete: () => {
          if (!forceReplay) sessionStorage.setItem("matchops_intro_seen", "1");
        },
      });

      // ── Phase 1: atmosphere + M materialise (0 – 0.45 s) ────────────────────

      // Glow orb builds first — creates a lit stage before the M arrives
      tl.to(".mi-logo-glow", {
        autoAlpha: 0.78,
        scale: 1.0,
        duration: 0.45,
        ease: "power3.out",
      });

      // M snaps in on top of the glow — sharp, large, dramatic
      tl.to(".mi-intro-logo", {
        autoAlpha: 1,
        scale: 1.0,
        rotate: 0,
        duration: 0.45,
        ease: "power4.out",
      }, "<");

      // Wordmark rises in just after M appears
      tl.to(".mi-intro-wordmark", {
        autoAlpha: 1,
        y: 0,
        duration: 0.28,
        ease: "power3.out",
      }, 0.32);

      // ── Phase 2: metallic light sweep across the M (0.35 – 0.75 s) ──────────

      tl.to(".mi-light-sweep", {
        autoAlpha: 1,
        scaleX: 1,
        duration: 0.18,
        ease: "power2.out",
      }, 0.35);

      tl.to(".mi-light-sweep", {
        autoAlpha: 0,
        duration: 0.22,
        ease: "power2.in",
      }, 0.53);

      // ── Phase 3: athletic charge-up (0.45 – 0.65 s) ─────────────────────────

      // M swells beyond rest scale — kinetic tension before the release
      tl.to(".mi-intro-logo", {
        scale: 1.35,
        duration: 0.20,
        ease: "back.out(2.0)",
      }, 0.45);

      tl.to(".mi-logo-glow", {
        scale: 1.85,
        autoAlpha: 0.95,
        duration: 0.20,
        ease: "power2.in",
      }, 0.45);

      // Brief hold — viewer registers the peak M before the split
      tl.to({}, { duration: 0.12 });

      // ── "open" marker (~0.77 s) — all split effects fire from here ───────────
      tl.add("open");

      // Impact ring bursts outward — shockwave from the split point
      tl.to(".mi-impact-ring", {
        autoAlpha: 0.85,
        scale: 1.8,
        duration: 0.12,
        ease: "power3.out",
      }, "open");
      tl.to(".mi-impact-ring", {
        autoAlpha: 0,
        scale: 3.8,
        duration: 0.40,
        ease: "power2.out",
      }, "open+=0.10");

      // M explodes outward — becomes the kinetic energy for the split
      tl.to(".mi-intro-logo", {
        autoAlpha: 0,
        scale: 1.65,
        duration: 0.22,
        ease: "power2.out",
      }, "open");

      // Wordmark fades upward — clean exit before panels rip
      tl.to(".mi-intro-wordmark", {
        autoAlpha: 0,
        y: -12,
        duration: 0.18,
        ease: "power2.out",
      }, "open");

      // Glow expands into final energy burst — the split "source"
      tl.to(".mi-logo-glow", {
        scale: 4.2,
        autoAlpha: 0,
        duration: 0.48,
        ease: "power2.out",
      }, "open");

      // Beam materialises — sword of light at the seam
      tl.to(".mi-center-beam", {
        autoAlpha: 1,
        scaleY: 1,
        duration: 0.22,
        ease: "power3.out",
      }, "open");

      // Speed lines burst down (7 lines, tight stagger)
      tl.to(".mi-speed-line", {
        autoAlpha: 0.72,
        y: 220,
        duration: 0.55,
        stagger: 0.025,
        ease: "power2.out",
      }, "open");
      tl.to(".mi-speed-line", {
        autoAlpha: 0,
        duration: 0.16,
        ease: "power1.in",
      }, "open+=0.50");

      // Motion blur at peak velocity — panels feel physically real
      tl.to(".mi-split-panel", { filter: "blur(3px)", duration: 0.10 }, "open");

      // ── Layer 1 — fastest, power4.out snap + subtle peel ────────────────────
      tl.to(".mi-layer-1-left",  { xPercent: -100, rotate: -0.6, duration: 0.52, ease: "power4.out" }, "open");
      tl.to(".mi-layer-1-right", { xPercent:  100, rotate:  0.6, duration: 0.52, ease: "power4.out" }, "open");

      // ── Layer 2 (+0.10 s) — power3.out ──────────────────────────────────────
      tl.to(".mi-layer-2-left",  { xPercent: -100, rotate: -0.5, duration: 0.58, ease: "power3.out" }, "open+=0.10");
      tl.to(".mi-layer-2-right", { xPercent:  100, rotate:  0.5, duration: 0.58, ease: "power3.out" }, "open+=0.10");

      // ── Layer 3 (+0.20 s) — circ.out, final curtain pull ────────────────────
      tl.to(".mi-layer-3-left",  { xPercent: -100, rotate: -0.4, duration: 0.65, ease: "circ.out" }, "open+=0.20");
      tl.to(".mi-layer-3-right", { xPercent:  100, rotate:  0.4, duration: 0.65, ease: "circ.out" }, "open+=0.20");

      // Beam shoots upward and vanishes — directional energy release
      tl.to(".mi-center-beam", {
        autoAlpha: 0,
        y: -80,
        scaleY: 1.3,
        duration: 0.30,
        ease: "power2.in",
      }, "open+=0.42");

      // Blur dissolves — motion settles into clean hero
      tl.to(".mi-split-panel", { filter: "blur(0px)", duration: 0.18 }, "open+=0.56");

      // Layer 3 ends at open+0.85. 0.15 s breather → fade at open+1.00.
      tl.to(root, { autoAlpha: 0, duration: 0.22 }, "open+=1.00");
      tl.set(root, { display: "none" });

    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="mi-intro-root" aria-hidden="true">

      {/* ── 1. Seamless cinematic background — no panel seam, always consistent */}
      <div className="mi-bg-canvas" />

      {/* ── 2. Atmospheric depth blobs — direct children, not panel-clipped */}
      <div className="mi-ambient-blob mi-blob-orange" />
      <div className="mi-ambient-blob mi-blob-green" />

      {/* ── 3. Split panel colour slabs — PURE colour, no display content inside */}

      {/* Layer 3 — back, sport-green */}
      <div className="mi-split-panel mi-split-left mi-layer-3-left">
        <div className="mi-full-stage mi-stage-three" />
      </div>
      <div className="mi-split-panel mi-split-right mi-layer-3-right">
        <div className="mi-full-stage mi-stage-three" />
      </div>

      {/* Layer 2 — mid, energy-orange */}
      <div className="mi-split-panel mi-split-left mi-layer-2-left">
        <div className="mi-full-stage mi-stage-two" />
      </div>
      <div className="mi-split-panel mi-split-right mi-layer-2-right">
        <div className="mi-full-stage mi-stage-two" />
      </div>

      {/* Layer 1 — front, dark */}
      <div className="mi-split-panel mi-split-left mi-layer-1-left">
        <div className="mi-full-stage mi-stage-one" />
      </div>
      <div className="mi-split-panel mi-split-right mi-layer-1-right">
        <div className="mi-full-stage mi-stage-one" />
      </div>

      {/* ── 4. M logo elements — single unified elements, z-index above all panels */}
      {/*    No panel clipping → M is intact, "MATCHOPS" is never split at the seam */}
      <div className="mi-logo-glow" />
      <div className="mi-light-sweep" />
      <MLogoMark className="mi-intro-logo" />
      <span className="mi-intro-wordmark">MATCHOPS</span>

      {/* ── 5. Impact ring — expands outward at split moment */}
      <div className="mi-impact-ring" />

      {/* ── 6. Visual effects */}
      <div className="mi-center-beam" />
      <div className="mi-speed-lines" aria-hidden="true">
        <span className="mi-speed-line" />
        <span className="mi-speed-line" />
        <span className="mi-speed-line" />
        <span className="mi-speed-line" />
        <span className="mi-speed-line" />
        <span className="mi-speed-line" />
        <span className="mi-speed-line" />
      </div>

    </div>
  );
}
