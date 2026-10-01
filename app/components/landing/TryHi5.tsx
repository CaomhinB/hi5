"use client";

import { useState } from "react";

const profiles = [
  {
    name: "Sarah Chen",
    role: "Product Marketing Manager",
    place: "London, UK",
    stage: "Early-stage SaaS",
    match: 87,
    bio: "I help turn complex products into clear stories. Currently focused on B2B SaaS and growth marketing.",
    tags: [
      ["Marketing", "blue"],
      ["SaaS", "teal"],
      ["Growth", "purple"],
      ["Startups", "pink"],
    ],
    why: "You both work in SaaS and are open to collaboration.",
    looking: "Collaborators, interesting projects",
    offer: "Marketing, go-to-market strategy",
    hue: "linear-gradient(135deg,#22d3ee,#2a5bea)",
    hiBack: true,
  },
  {
    name: "James Wilson",
    role: "Business Development",
    place: "Brighton, UK",
    stage: "FinTech",
    match: 81,
    bio: "I connect young companies with their first big customers. Always keen to meet founders.",
    tags: [
      ["Sales", "blue"],
      ["FinTech", "teal"],
      ["Partnerships", "purple"],
    ],
    why: "You are both looking for business partners.",
    looking: "Co-founders, early customers",
    offer: "Sales, partnerships",
    hue: "linear-gradient(135deg,#2a5bea,#7b5cf0)",
    hiBack: false,
  },
  {
    name: "Anna Petrova",
    role: "UX Designer",
    place: "Remote",
    stage: "AI / HealthTech",
    match: 76,
    bio: "I design calm, clear products people enjoy using. Open to side projects and new ideas.",
    tags: [
      ["Design", "purple"],
      ["Side project", "blue"],
      ["Startups", "pink"],
    ],
    why: "You both want to build something new.",
    looking: "Side projects, mentorship",
    offer: "Product design, user research",
    hue: "linear-gradient(135deg,#b79cff,#ec4899)",
    hiBack: true,
  },
  {
    name: "Alex Carter",
    role: "Co-founder & CEO",
    place: "Manchester, UK",
    stage: "Seed stage",
    match: 72,
    bio: "Building a logistics platform. Looking for a technical co-founder who loves hard problems.",
    tags: [
      ["Startups", "pink"],
      ["Logistics", "teal"],
      ["Fundraising", "blue"],
    ],
    why: "You are both open to meeting in person.",
    looking: "Technical co-founder",
    offer: "Fundraising, operations",
    hue: "linear-gradient(135deg,#14b8a6,#2a5bea)",
    hiBack: false,
  },
  {
    name: "Maria Lopez",
    role: "Growth Marketing Lead",
    place: "Lisbon, PT",
    stage: "Scale-up",
    match: 69,
    bio: "I help teams grow without burning budget. Happy to share what has worked for me.",
    tags: [
      ["Growth", "purple"],
      ["Mentoring", "teal"],
      ["Events", "blue"],
    ],
    why: "She is open to mentoring people in your field.",
    looking: "Mentees, speakers",
    offer: "Growth strategy, feedback",
    hue: "linear-gradient(135deg,#7b5cf0,#22d3ee)",
    hiBack: true,
  },
] as const;

type Result = null | "pass" | "hi" | "match";

export function TryHi5() {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<Result>(null);
  const [more, setMore] = useState(false);
  const [sent, setSent] = useState(0);
  const [matches, setMatches] = useState(0);
  const done = index >= profiles.length;
  const p = profiles[Math.min(index, profiles.length - 1)];

  function act(kind: "pass" | "hi") {
    if (result || done) return;
    const next: Result = kind === "pass" ? "pass" : p.hiBack ? "match" : "hi";
    setResult(next);
    setMore(false);
    if (kind === "hi") {
      setSent((n) => n + 1);
      if (p.hiBack) setMatches((n) => n + 1);
    }
    window.setTimeout(
      () => {
        setResult(null);
        setIndex((i) => i + 1);
      },
      kind === "pass" ? 450 : 1500,
    );
  }

  function reset() {
    setIndex(0);
    setSent(0);
    setMatches(0);
    setResult(null);
    setMore(false);
  }

  return (
    <div className="demo glass glass-strong">
      <div className="demo-head">
        <div>
          <p className="demo-title">Your Hi5</p>
          <p className="demo-sub">Try it. Tap a button.</p>
        </div>
        <div className="demo-dots" aria-label={`${Math.min(index + 1, 5)} of 5`}>
          {profiles.map((_, i) => (
            <span key={i} className={i < index ? "done" : i === index ? "now" : ""} />
          ))}
        </div>
      </div>

      <div className="demo-stage">
        {done ? (
          <div className="demo-end">
            <span className="demo-end-icon">🎉</span>
            <h3>That is your Hi5 for today</h3>
            <p>
              You sent {sent} {sent === 1 ? "Hi" : "Hi's"} and made {matches}{" "}
              {matches === 1 ? "match" : "matches"}.
            </p>
            <button className="btn btn-primary" onClick={reset}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="demo-back demo-back-1" />
            <div className="demo-back demo-back-2" />
            <article
              key={index}
              className={`demo-card glass ${result === "pass" ? "is-pass" : ""} ${result === "hi" || result === "match" ? "is-hi" : ""}`}
            >
              <div className="demo-top">
                <div className="demo-avatar" style={{ background: p.hue }}>
                  {p.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
                <div className="demo-ring" style={{ ["--pct" as string]: p.match }}>
                  <strong>{p.match}%</strong>
                  <span>Match</span>
                </div>
              </div>
              <h3 className="demo-name">
                {p.name} <span className="verified" aria-label="Verified">✓</span>
              </h3>
              <p className="demo-role">{p.role}</p>
              <p className="demo-meta">
                {p.place} · {p.stage}
              </p>
              <p className="demo-bio">{p.bio}</p>
              <div className="demo-tags">
                {p.tags.map(([t, c]) => (
                  <span key={t} className={`pill pill-${c}`}>
                    {t}
                  </span>
                ))}
              </div>

              <div className={`demo-more ${more ? "open" : ""}`}>
                <div>
                  <p>
                    <b>Why this profile?</b> {p.why}
                  </p>
                  <p>
                    <b>Looking for:</b> {p.looking}
                  </p>
                  <p>
                    <b>Can offer:</b> {p.offer}
                  </p>
                </div>
              </div>

              {result === "match" && (
                <div className="demo-result">
                  <span>🙌</span>
                  <strong>It&apos;s a match!</strong>
                  <small>{p.name.split(" ")[0]} said Hi too. Messaging is open.</small>
                </div>
              )}
              {result === "hi" && (
                <div className="demo-result">
                  <span>👋</span>
                  <strong>Hi sent</strong>
                  <small>If {p.name.split(" ")[0]} says Hi back, you match.</small>
                </div>
              )}
            </article>
          </>
        )}
      </div>

      {!done && (
        <div className="demo-actions">
          <button className="circle-btn" onClick={() => act("pass")} aria-label="Pass">
            <span className="circle-icon">✕</span>
            <small>Pass</small>
          </button>
          <button className="circle-btn circle-hi" onClick={() => act("hi")} aria-label="Say Hi">
            <span className="circle-icon">👋</span>
            <small>Say Hi</small>
          </button>
          <button
            className={`circle-btn ${more ? "is-active" : ""}`}
            onClick={() => !result && setMore((v) => !v)}
            aria-label="More"
            aria-expanded={more}
          >
            <span className="circle-icon">•••</span>
            <small>More</small>
          </button>
        </div>
      )}
    </div>
  );
}
