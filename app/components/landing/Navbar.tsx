"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const links = [
  { href: "#why", label: "Why Hi5" },
  { href: "#try", label: "Try it" },
  { href: "#goals", label: "Goals" },
  { href: "#how", label: "How it works" },
  { href: "#for-you", label: "Who it's for" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLoginOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="nav-bar glass">
          <a href="#top" aria-label="Hi5 home" className="nav-logo">
            <Logo height={36} />
          </a>

          <nav className="nav-links" aria-label="Main">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="nav-link">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            <button className="btn btn-glass btn-sm" onClick={() => setLoginOpen(true)}>
              Log in
            </button>
            <a href="#cta" className="btn btn-primary btn-sm nav-cta">
              Get started
            </a>
            <button
              className="nav-burger"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
            </button>
          </div>

          <div className="nav-progress" style={{ transform: `scaleX(${progress})` }} />
        </div>

        {menuOpen && (
          <div className="nav-mobile glass glass-strong">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
            <a href="#cta" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
              Get started
            </a>
          </div>
        )}
      </header>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  );
}

function LoginModal({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal glass glass-strong"
        role="dialog"
        aria-modal="true"
        aria-label="Log in"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        <Logo height={40} />
        <h2 className="modal-title">Welcome back</h2>
        <p className="modal-sub">This is a demo. No real login yet.</p>

        {sent ? (
          <div className="modal-done">
            <span className="modal-done-tick">✓</span>
            <p>Demo login worked. Real login comes later.</p>
            <button className="btn btn-glass" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form
            className="modal-form"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <label>
              Email
              <input type="email" placeholder="you@company.com" autoComplete="off" />
            </label>
            <label>
              Password
              <input type="password" placeholder="••••••••" autoComplete="off" />
            </label>
            <button type="submit" className="btn btn-primary btn-lg">
              Log in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
