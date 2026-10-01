"use client";

import { useRef, type ReactNode } from "react";

type TiltProps = {
  children: ReactNode;
  max?: number;
  className?: string;
};

// Gives its content a gentle 3D tilt that follows the mouse.
export function Tilt({ children, max = 8, className = "" }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--ry", `${x * max}deg`);
    el.style.setProperty("--rx", `${-y * max}deg`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  }

  return (
    <div ref={ref} className={`tilt ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="tilt-inner">{children}</div>
    </div>
  );
}
