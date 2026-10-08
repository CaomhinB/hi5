"use client";

import { useCallback, useEffect, useState } from "react";
import { Logo } from "./Logo";
import { LoginModal } from "./LoginModal";

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
  const closeLogin = useCallback(() => setLoginOpen(false), []);

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
            <button type="button" className="btn btn-glass btn-sm" onClick={() => { setMenuOpen(false); setLoginOpen(true); }}>
              Log in
            </button>
            <a href="/signup" className="btn btn-primary btn-sm nav-cta">
              Sign up
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
            <a href="/signup" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
              Sign up
            </a>
          </div>
        )}
      </header>

      {loginOpen && <LoginModal onClose={closeLogin} />}
    </>
  );
}
