"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const beats = [
  { icon: "👋", title: "You say Hi", text: "You show interest in someone." },
  { icon: "🙋", title: "They say Hi", text: "They are interested in you too." },
  { icon: "🎉", title: "It's a match", text: "You both wanted to talk." },
  { icon: "💬", title: "Messaging opens", text: "Only now can you chat." },
];

// Plays the four beats of a match, one after another, when scrolled into view.
export function MutualFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const [step, setStep] = useState(-1);

  const play = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    setStep(-1);
    timers.current = beats.map((_, i) => window.setTimeout(() => setStep(i), 500 + i * 1100));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          play();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    const pending = timers.current;
    return () => {
      observer.disconnect();
      pending.forEach(window.clearTimeout);
    };
  }, [play]);

  return (
    <div ref={ref} className="flow">
      <ol className="flow-steps">
        {beats.map((b, i) => (
          <li key={b.title} className={`flow-step glass ${i <= step ? "on" : ""} ${i === step ? "now" : ""}`}>
            <span className="flow-icon">{b.icon}</span>
            <div>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <button className="btn btn-glass btn-sm flow-replay" onClick={play}>
        ↻ Replay
      </button>

      <div className={`flow-chat ${step >= 3 ? "open" : ""}`}>
        <Image
          src="/assets/landing/Hi5 Glassmorphism Messaging Showcase.png"
          alt="Hi5 messages screen and a conversation between two matched professionals"
          width={1448}
          height={1086}
          sizes="(max-width: 900px) 92vw, 560px"
        />
      </div>
    </div>
  );
}
