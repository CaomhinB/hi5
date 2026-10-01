"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const steps = [
  { title: "Build your card", text: "Tell Hi5 who you are, what you do, your skills, interests, and what you're currently working on.", image: "/assets/landing/mockup-home-1.png", w: 456, h: 685 },
  { title: "Tell us who you want to meet", text: "Set your goals, filters, location preferences, and the kinds of professional relationships you're looking for.", image: "/assets/landing/Hi5 Discover and Filters UI.png", w: 1312, h: 1199 },
  { title: "Meet your Hi5", text: "Discover a focused selection of relevant people instead of endlessly scrolling through profiles.", image: "/assets/landing/mockup-home-2.png", w: 452, h: 677 },
  { title: "Say Hi", text: "Interested in someone? Say Hi.", image: "/assets/landing/mockup-home-1.png", w: 456, h: 685 },
  { title: "Match", text: "If they say Hi too, you've got a match.", image: "/assets/landing/Glassmorphism Matches App Mockup.png", w: 1536, h: 1024 },
  { title: "Start talking", text: "Messaging opens and you can take it from there.", image: "/assets/landing/Hi5 Glassmorphism Messaging Showcase.png", w: 1448, h: 1086 },
];

const screens = Array.from(new Set(steps.map((s) => s.image))).map((src) => steps.find((s) => s.image === src)!);

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="how">
      <div className="how-sticky">
        <div className="how-device glass glass-strong">
          {screens.map((s) => (
            <Image
              key={s.image}
              src={s.image}
              alt=""
              width={s.w}
              height={s.h}
              className={`how-shot ${s.image === steps[active].image ? "show" : ""}`}
              sizes="(max-width: 900px) 90vw, 520px"
            />
          ))}
          <span className="how-badge">Step {active + 1} of 6</span>
        </div>
      </div>

      <ol className="how-steps">
        {steps.map((s, i) => (
          <li
            key={s.title}
            data-i={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={`how-step glass ${i === active ? "active" : ""}`}
          >
            <span className="how-num">{i + 1}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
