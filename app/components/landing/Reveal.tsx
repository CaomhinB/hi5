"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  direction?: "up" | "left" | "right" | "scale";
};

// Fades an element in and lifts it up the first time it scrolls into view.
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
  direction = "up",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          observer.disconnect();
          // Once the entrance has played, drop the delay so hover effects feel instant.
          done = window.setTimeout(() => {
            el.style.transitionDelay = "";
            el.classList.add("reveal-done");
          }, delay + 900);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(done);
    };
  }, [delay]);

  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${direction} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
