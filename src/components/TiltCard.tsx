import { useRef, useCallback } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export function TiltCard({ children, className = "" }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const applyTilt = useCallback((x: number, y: number) => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = (x - cx) / (rect.width / 2);
    const dy = (y - cy) / (rect.height / 2);

    const rotY = dx * 8;
    const rotX = -dy * 5;

    const glowX = ((x - rect.left) / rect.width) * 100;
    const glowY = ((y - rect.top) / rect.height) * 100;

    card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
    glow.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, hsl(var(--primary) / 0.18) 0%, hsl(var(--accent) / 0.08) 40%, transparent 70%)`;
  }, []);

  const reset = useCallback(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    glow.style.background = "transparent";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => applyTilt(e.clientX, e.clientY));
  }, [applyTilt]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => applyTilt(touch.clientX, touch.clientY));
  }, [applyTilt]);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden rounded-2xl bg-card border border-border transition-transform duration-100 ease-out will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d", transition: "transform 0.08s ease-out" }}
      onMouseMove={onMouseMove}
      onMouseLeave={reset}
      onTouchMove={onTouchMove}
      onTouchEnd={reset}
    >
      {/* Dynamic glow layer */}
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-150"
        style={{ borderRadius: "inherit" }}
      />

      {/* Shimmer edge highlight */}
      <div
        className="absolute inset-0 pointer-events-none z-0 rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, transparent 50%, hsl(var(--accent) / 0.04) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
