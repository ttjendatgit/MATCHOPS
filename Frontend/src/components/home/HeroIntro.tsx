"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// Bold geometric M — forward-angled pillar tops, clean V valley, uniform arm width.
// viewBox 220×160 — pillar width 34px, arm ~28px, valley outer y=92 inner y=118.
function MLogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Main body — parallelogram-topped pillars give a forward-motion cut */}
      <path
        d="M12 22 L46 10 L110 92 L174 10 L208 22 L208 148 L174 148 L174 38 L110 118 L46 38 L46 148 L12 148 Z"
        fill="#00f5d4"
      />
      {/* Top-ridge specular strip — bright chamfer along the arm peaks */}
      <path
        d="M50 10 L110 88 L170 10 L174 10 L110 92 L46 10 Z"
        fill="#ecfdf5"
        opacity="0.32"
      />
      {/* Left-pillar shadow wedge — adds 3-D depth */}
      <path
        d="M12 22 L12 148 L26 148 L26 22 Z"
        fill="#042f2e"
        opacity="0.58"
      />
    </svg>
  );
}

export function HeroIntro() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Dev bypass: append ?intro=1 to always replay, ignoring sessionStorage.
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
      // ── Initial states ─────────────────────────────────────────────────────
      gsap.set(".mi-intro-logo", {
        xPercent: -50,
        yPercent: -50,
        autoAlpha: 0,
        scale: 0.65,
        rotate: -5,
      });

      // Wordmark: center via GSAP (avoids CSS transform conflict with y tween)
      gsap.set(".mi-intro-wordmark", {
        xPercent: -50,
        autoAlpha: 0,
        y: 10,
      });

      gsap.set(".mi-center-beam", {
        autoAlpha: 0,
        scaleY: 0.15,
        transformOrigin: "center center",
      });

      gsap.set(".mi-speed-line", {
        autoAlpha: 0,
        y: -120,
      });

      gsap.set(".mi-split-panel", {
        xPercent: 0,
        filter: "blur(0px)",
      });

      // ── Master timeline (~2.8s total) ──────────────────────────────────────
      const tl = gsap.timeline({
        onComplete: () => {
          // Only persist when not in forced-replay dev mode
          if (!forceReplay) sessionStorage.setItem("matchops_intro_seen", "1");
        },
      });

      // Phase 1 — M logo materialises (0–0.6s)
      tl.to(".mi-intro-logo", {
        autoAlpha: 1,
        scale: 1,
        rotate: 0,
        duration: 0.6,
        ease: "power4.out",
      })

        // Wordmark rises in while logo is still appearing (t=0.5s)
        .to(
          ".mi-intro-wordmark",
          { autoAlpha: 1, y: 0, duration: 0.35, ease: "power3.out" },
          0.5,
        )

        // Phase 2 — athletic charge-up, back-ease overshoot (0.6–0.82s)
        .to(".mi-intro-logo", {
          scale: 1.20,
          duration: 0.22,
          ease: "back.out(1.2)",
        })

        .to({}, { duration: 0.08 })

        // "open" marker — all split effects from here (t ≈ 0.9s)
        .add("open")

        // Emerald-cyan beam at seam
        .to(
          ".mi-center-beam",
          { autoAlpha: 1, scaleY: 1, duration: 0.32, ease: "power3.out" },
          "open",
        )

        // Speed lines burst downward
        .to(
          ".mi-speed-line",
          {
            autoAlpha: 0.55,
            y: 180,
            duration: 0.72,
            stagger: 0.04,
            ease: "power2.out",
          },
          "open",
        )

        // Brief motion blur at peak velocity
        .to(".mi-split-panel", { filter: "blur(2px)", duration: 0.14 }, "open")

        // Layer 1 — front, fastest (carries M logo + wordmark)
        .to(".mi-layer-1-left",  { xPercent: -100, duration: 1.0, ease: "power4.inOut" }, "open")
        .to(".mi-layer-1-right", { xPercent:  100, duration: 1.0, ease: "power4.inOut" }, "open")

        // Layer 2 — +0.18s stagger (emerald layer — visibly different from layer 1)
        .to(".mi-layer-2-left",  { xPercent: -100, duration: 1.0, ease: "power4.inOut" }, "open+=0.18")
        .to(".mi-layer-2-right", { xPercent:  100, duration: 1.0, ease: "power4.inOut" }, "open+=0.18")

        // Layer 3 — +0.36s stagger (cyan layer — visibly different from layer 2)
        .to(".mi-layer-3-left",  { xPercent: -100, duration: 1.0, ease: "power4.inOut" }, "open+=0.36")
        .to(".mi-layer-3-right", { xPercent:  100, duration: 1.0, ease: "power4.inOut" }, "open+=0.36")

        // Beam dissipates
        .to(
          ".mi-center-beam",
          { autoAlpha: 0, scaleY: 1.45, duration: 0.45, ease: "power3.out" },
          "open+=0.55",
        )

        // Blur clears
        .to(".mi-split-panel", { filter: "blur(0px)", duration: 0.22 }, "open+=0.65")

        // 0.25s hold after layer 3 completes (open+=0.36+1.0=1.36),
        // fade starts at open+=1.61 → t≈2.51s, overlay gone by t≈2.76s
        .to(root, { autoAlpha: 0, duration: 0.25 }, "open+=1.61")
        .set(root, { display: "none" });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="mi-intro-root" aria-hidden="true">
      {/* Layer 3 — back, cyan-ocean (clearly distinct from layers 1+2) */}
      <div className="mi-split-panel mi-split-left mi-layer-3-left">
        <div className="mi-full-stage mi-stage-three" />
      </div>
      <div className="mi-split-panel mi-split-right mi-layer-3-right">
        <div className="mi-full-stage mi-stage-three" />
      </div>

      {/* Layer 2 — mid, forest-emerald (clearly distinct from layer 1) */}
      <div className="mi-split-panel mi-split-left mi-layer-2-left">
        <div className="mi-full-stage mi-stage-two" />
      </div>
      <div className="mi-split-panel mi-split-right mi-layer-2-right">
        <div className="mi-full-stage mi-stage-two" />
      </div>

      {/* Layer 1 — front, near-black navy: M logo + wordmark split with panels */}
      <div className="mi-split-panel mi-split-left mi-layer-1-left">
        <div className="mi-full-stage mi-stage-one">
          <MLogoMark className="mi-intro-logo" />
          <span className="mi-intro-wordmark">MATCHOPS</span>
        </div>
      </div>
      <div className="mi-split-panel mi-split-right mi-layer-1-right">
        <div className="mi-full-stage mi-stage-one">
          <MLogoMark className="mi-intro-logo" />
          <span className="mi-intro-wordmark">MATCHOPS</span>
        </div>
      </div>

      {/* Visual effects */}
      <div className="mi-center-beam" />
      <div className="mi-speed-lines" aria-hidden="true">
        <span className="mi-speed-line" />
        <span className="mi-speed-line" />
        <span className="mi-speed-line" />
        <span className="mi-speed-line" />
        <span className="mi-speed-line" />
      </div>
    </div>
  );
}
