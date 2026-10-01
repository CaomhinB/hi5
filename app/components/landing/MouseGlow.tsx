"use client";

import { useEffect, useRef } from "react";

// A soft light that follows the mouse around the page.
export function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.transform = `translate(${e.clientX - 260}px, ${e.clientY - 260}px)`;
        el.style.opacity = "1";
      });
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="mouse-glow" aria-hidden="true" />;
}
