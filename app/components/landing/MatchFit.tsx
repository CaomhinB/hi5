"use client";

import { useEffect, useRef, useState } from "react";

const factors = [
  { label: "Skills", value: 92 },
  { label: "Industry", value: 88 },
  { label: "Goals", value: 90 },
  { label: "Location", value: 78 },
  { label: "Availability", value: 80 },
];

// A match ring that counts up to a number, with bars that fill in.
export function MatchFit({ target = 87 }: { target?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setLive(true);
        const start = performance.now();
        const duration = 1600;
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          setShown(Math.round(target * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  const circumference = 2 * Math.PI * 70;

  return (
    <div ref={ref} className="fit glass glass-strong">
      <div className="fit-ring">
        <svg viewBox="0 0 160 160" aria-hidden="true">
          <defs>
            <linearGradient id="fit-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="55%" stopColor="#2a5bea" />
              <stop offset="100%" stopColor="#7b5cf0" />
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r="70" className="fit-track" />
          <circle
            cx="80"
            cy="80"
            r="70"
            className="fit-arc"
            stroke="url(#fit-grad)"
            strokeDasharray={circumference}
            strokeDashoffset={live ? circumference * (1 - target / 100) : circumference}
          />
        </svg>
        <div className="fit-num">
          <strong>{shown}%</strong>
          <span>Match</span>
        </div>
      </div>

      <div className="fit-bars">
        {factors.map((f, i) => (
          <div key={f.label} className="fit-row">
            <div className="fit-row-head">
              <span>{f.label}</span>
              <span>{f.value}%</span>
            </div>
            <div className="fit-bar">
              <span style={{ width: live ? `${f.value}%` : "0%", transitionDelay: `${i * 120}ms` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="fit-why">
        <span className="fit-why-icon">✦</span>
        <div>
          <strong>Why you matched</strong>
          <p>You both work in SaaS, are interested in growth marketing and open to collaboration.</p>
        </div>
      </div>
    </div>
  );
}
