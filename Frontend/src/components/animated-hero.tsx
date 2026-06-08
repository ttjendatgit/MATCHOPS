"use client";

import React, { useEffect, useRef, useState, ReactNode } from 'react';

interface ParticleHeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  primaryButton?: {
    text: string;
    onClick: () => void;
  };
  secondaryButton?: {
    text: string;
    onClick: () => void;
  };
  interactiveHint?: string;
  className?: string;
  particleCount?: number;
  children?: ReactNode;
}

export const ParticleHero: React.FC<ParticleHeroProps> = ({
  title = "FLUX",
  subtitle = "Digital Inferno",
  description = "Experience the mesmerizing dance of light and motion.",
  primaryButton,
  secondaryButton,
  interactiveHint = "Move to Create",
  className = "",
  particleCount = 15,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [staticCursor, setStaticCursor] = useState({ x: 0, y: 0 });
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isStaticAnimation, setIsStaticAnimation] = useState(false);
  const startTimeRef = useRef(Date.now());
  const lastMouseMoveRef = useRef(Date.now());

  const rows = particleCount;
  const totalParticles = rows * rows;

  // Initialize particles
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    container.innerHTML = '';
    particlesRef.current = [];

    for (let i = 0; i < totalParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle absolute rounded-full will-change-transform';
      
      // Calculate grid position
      const row = Math.floor(i / rows);
      const col = i % rows;
      const centerRow = Math.floor(rows / 2);
      const centerCol = Math.floor(rows / 2);
      
      // Distance from center for stagger effects
      const distanceFromCenter = Math.sqrt(
        Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
      );
      
      // Staggered scale (larger in center)
      const scale = Math.max(0.1, 1.2 - distanceFromCenter * 0.12);
      
      // Staggered opacity (more opaque in center)
      const opacity = Math.max(0.05, 1 - distanceFromCenter * 0.1);
      
      // Color intensity based on distance
      const lightness = Math.max(15, 75 - distanceFromCenter * 6);
      
      // Glow intensity
      const glowSize = Math.max(0.5, 6 - distanceFromCenter * 0.5);
      
      particle.style.cssText = `
        width: 0.4rem;
        height: 0.4rem;
        left: ${col * 1.8}rem;
        top: ${row * 1.8}rem;
        transform: scale(${scale});
        opacity: ${opacity};
        background: hsl(30, 100%, ${lightness}%);
        box-shadow: 0 0 ${glowSize * 0.2}rem 0 hsl(30, 100%, 50%);
        mix-blend-mode: screen;
        z-index: ${Math.round(totalParticles - distanceFromCenter * 5)};
        transition: transform 0.05s linear;
      `;
      
      container.appendChild(particle);
      particlesRef.current.push(particle);
    }
  }, [rows, totalParticles]);

  // Continuous animation
  useEffect(() => {
    const animate = () => {
      const currentTime = (Date.now() - startTimeRef.current) * 0.001;
      
      if (isAutoMode) {
        const x = Math.sin(currentTime * 0.3) * 200 + Math.sin(currentTime * 0.17) * 100;
        const y = Math.cos(currentTime * 0.2) * 150 + Math.cos(currentTime * 0.23) * 80;
        setCursor({ x, y });
      } else if (isStaticAnimation) {
        const timeSinceLastMove = Date.now() - lastMouseMoveRef.current;
        
        if (timeSinceLastMove > 200) {
          const animationStrength = Math.min((timeSinceLastMove - 200) / 1000, 1);
          const subtleX = Math.sin(currentTime * 1.5) * 20 * animationStrength;
          const subtleY = Math.cos(currentTime * 1.2) * 16 * animationStrength;
          
          setCursor({
            x: staticCursor.x + subtleX,
            y: staticCursor.y + subtleY
          });
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAutoMode, isStaticAnimation, staticCursor]);

  // Update particle positions
  useEffect(() => {
    particlesRef.current.forEach((particle, i) => {
      const row = Math.floor(i / rows);
      const col = i % rows;
      const centerRow = Math.floor(rows / 2);
      const centerCol = Math.floor(rows / 2);
      const distanceFromCenter = Math.sqrt(
        Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
      );
      
      const delay = distanceFromCenter * 8;
      const originalScale = Math.max(0.1, 1.2 - distanceFromCenter * 0.12);
      const dampening = Math.max(0.3, 1 - distanceFromCenter * 0.08);
      
      setTimeout(() => {
        const moveX = cursor.x * dampening;
        const moveY = cursor.y * dampening;
        
        particle.style.transform = `translate(${moveX}px, ${moveY}px) scale(${originalScale})`;
        particle.style.transition = `transform ${120 + distanceFromCenter * 20}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      }, delay);
    });
  }, [cursor, rows]);

  // Mouse/touch movement handler
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const event = 'touches' in e ? e.touches[0] : e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const newCursor = {
      x: (event.clientX - centerX) * 0.8,
      y: (event.clientY - centerY) * 0.8
    };
    
    setCursor(newCursor);
    setStaticCursor(newCursor);
    setIsAutoMode(false);
    setIsStaticAnimation(false);
    lastMouseMoveRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsStaticAnimation(true);
    }, 500);
    
    setTimeout(() => {
      if (Date.now() - lastMouseMoveRef.current >= 4000) {
        setIsAutoMode(true);
        setIsStaticAnimation(false);
        startTimeRef.current = Date.now();
      }
    }, 4000);
  };

  return (
    <section
      className={`relative w-full min-h-screen bg-slate-950 overflow-hidden ${className}`}
      onMouseMove={handlePointerMove}
      onTouchMove={handlePointerMove}
    >
      {/* ── Video background ─────────────────────────────────────────────── */}
      <video
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        style={{ filter: "brightness(1.14) contrast(1.20) saturate(1.18)" }}
      >
        <source src="/videos/hero-sports-bg.mp4" type="video/mp4" />
      </video>

      {/* ── Cinematic overlay stack ─────────────────────────────────────── */}

      {/* 0. Thin global tint — unifies the layer stack, prevents raw-video bleed */}
      <div className="absolute inset-0 bg-black/12 pointer-events-none" />

      {/* 1. Left readability gradient — text stays legible, right stays open */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to right, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.38) 28%, rgba(0,0,0,0.10) 52%, transparent 64%)" }}
      />

      {/* 2. Right edge shading — subtle frame on far edge only */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to left, rgba(0,0,0,0.28) 0%, transparent 24%)" }}
      />

      {/* 3. Top cinematic frame */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0.06) 28%, transparent 44%)" }}
      />

      {/* 4. Bottom depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.14) 28%, transparent 46%)" }}
      />

      {/* 5. Wide edge vignette — corners only */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 130% 105% at 48% 50%, transparent 36%, rgba(0,0,0,0.26) 72%, rgba(0,0,0,0.44) 100%)" }}
      />

      {/* 6. Subtle dark grade — anchors the base tone */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(130deg, rgba(2,6,23,0.12) 0%, transparent 48%)" }}
      />

      {/* 7. Brand orange ambient — warm energy from bottom-left energises the text area */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 62% 50% at 4% 90%, rgba(255,128,0,0.11) 0%, transparent 58%)" }}
      />

      {/* 8. Brand green ambient — cool accent lifts the right / cards area */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 52% 44% at 96% 82%, rgba(134,210,50,0.08) 0%, transparent 52%)" }}
      />

      {/* Particle Animation Background — softened so it complements rather than competes */}
      <div className="absolute inset-0 flex items-center justify-center opacity-50">
        <div
          ref={containerRef}
          className="relative"
          style={{
            width: `${rows * 1.8}rem`,
            height: `${rows * 1.8}rem`
          }}
        />
      </div>
      
      {/* Hero Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        {children ? (
          children
        ) : (
          <div className="text-center max-w-6xl mx-auto">
            {/* Main Title */}
            <div className="mb-16">
              <h1 className="text-8xl md:text-[10rem] lg:text-[14rem] xl:text-[16rem] font-black tracking-tighter leading-[0.8] mb-8">
                <span className="bg-gradient-to-b from-red-300 via-red-500 to-red-800 bg-clip-text text-transparent drop-shadow-2xl">
                  {title}
                </span>
              </h1>
              
              {/* Subtitle */}
              <div className="space-y-4">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-thin text-red-200/90 tracking-[0.2em] uppercase">
                  {subtitle}
                </h2>
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent mx-auto"></div>
              </div>
            </div>
            
            {/* Description */}
            {description && (
              <div className="mb-20">
                <p className="text-lg md:text-xl lg:text-2xl text-red-100/60 font-light max-w-3xl mx-auto leading-relaxed">
                  {description}
                </p>
              </div>
            )}
            
            {/* Call to Action */}
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {primaryButton && (
                  <button 
                    onClick={primaryButton.onClick}
                    className="group relative px-12 py-6 bg-transparent border border-red-500/30 hover:border-red-400 text-red-200 hover:text-white font-medium text-lg tracking-wider uppercase transition-all duration-500 overflow-hidden"
                  >
                    <span className="relative z-10">{primaryButton.text}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-500/20 to-red-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>
                )}
                
                {secondaryButton && (
                  <button 
                    onClick={secondaryButton.onClick}
                    className="px-8 py-4 border-2 border-white/20 hover:border-red-400 text-white hover:text-red-400 font-semibold rounded-full transition-all duration-300 backdrop-blur-sm"
                  >
                    {secondaryButton.text}
                  </button>
                )}
              </div>
              
              {/* Interactive hint */}
              {interactiveHint && (
                <div className="flex items-center justify-center gap-6 text-red-400/40 text-sm uppercase tracking-[0.3em]">
                  <div className="w-12 h-px bg-gradient-to-r from-transparent to-red-500/30"></div>
                  <span className="animate-pulse">{interactiveHint}</span>
                  <div className="w-12 h-px bg-gradient-to-l from-transparent to-red-500/30"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Ambient Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-24 left-16 w-[420px] h-[420px] bg-[#FF8000]/8 rounded-full blur-[80px] animate-glow-pulse"></div>
        <div className="absolute bottom-16 right-16 w-[520px] h-[520px] bg-[#86D232]/6 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '2.5s' }}></div>
        <div className="absolute bottom-28 right-28 w-72 h-72 bg-[#FF8000]/5 rounded-full blur-[64px]"></div>
      </div>
    </section>
  );
};
