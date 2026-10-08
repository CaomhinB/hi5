"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import { Logo } from "./Logo";
import { loginErrorMessage } from "./loginErrors";
import styles from "./LoginModal.module.css";

export function LoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const mounted = useRef(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mounted.current = true;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    emailRef.current?.focus({ preventScroll: true });

    function handleKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (!pending.current) onClose();
      } else if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), a[href]:not([inert])',
        )).filter((control) => control.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          dialog.focus({ preventScroll: true });
        } else if (!dialog.contains(document.activeElement)
          || (event.shiftKey && document.activeElement === first)
          || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus({ preventScroll: true });
        }
      }
    }
    document.addEventListener("keydown", handleKeys, true);
    return () => {
      mounted.current = false;
      document.removeEventListener("keydown", handleKeys, true);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [onClose]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const backdrop = backdropRef.current;
    if (!viewport || !backdrop) return;
    function fitAboveKeyboard() {
      if (!viewport || !backdrop || Math.abs(viewport.scale - 1) > 0.01) return;
      backdrop.style.setProperty("--login-viewport-height", `${viewport.height}px`);
      backdrop.style.setProperty("--login-viewport-top", `${viewport.offsetTop}px`);
      const dialog = dialogRef.current;
      const active = document.activeElement;
      if (!dialog || !(active instanceof HTMLElement) || !dialog.contains(active)) return;
      const bounds = dialog.getBoundingClientRect();
      const rect = active.getBoundingClientRect();
      if (rect.bottom > bounds.bottom - 12) dialog.scrollTop += rect.bottom - bounds.bottom + 12;
      else if (rect.top < bounds.top + 12) dialog.scrollTop -= bounds.top + 12 - rect.top;
    }
    fitAboveKeyboard();
    viewport.addEventListener("resize", fitAboveKeyboard);
    viewport.addEventListener("scroll", fitAboveKeyboard);
    return () => {
      viewport.removeEventListener("resize", fitAboveKeyboard);
      viewport.removeEventListener("scroll", fitAboveKeyboard);
    };
  }, []);

  async function logIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const { data, error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({
        email: email.trim(), password,
      });
      if (!mounted.current) return;
      if (signInError) throw signInError;
      if (!data.session) throw new Error("Login did not return a session");
      setPassword("");
      router.replace("/onboarding");
      router.refresh();
    } catch (cause) {
      pending.current = false;
      if (mounted.current) {
        setBusy(false);
        setError(loginErrorMessage(cause));
      }
    }
  }

  return (
    <div ref={backdropRef} className={`modal-backdrop ${styles.backdrop}`} onClick={(event) => {
      if (event.target === event.currentTarget && !pending.current) onClose();
    }}>
      <div ref={dialogRef} className={`modal glass glass-strong ${styles.dialog}`} role="dialog"
        aria-modal="true" aria-labelledby="login-title" aria-describedby="login-description" tabIndex={-1}>
        <button type="button" className={`modal-close ${styles.close}`} aria-label="Close login" disabled={busy} onClick={onClose}>✕</button>
        <Logo height={40} />
        <h2 id="login-title" className="modal-title">Welcome back</h2>
        <p id="login-description" className="modal-sub">Log in to your Hi5 account.</p>
        <p className="modal-sub">New to Hi5? <Link href="/signup" className="text-gradient" inert={busy}>Create your account</Link></p>

        <form className={`modal-form ${styles.form}`} aria-busy={busy} aria-describedby={error ? "login-error" : undefined}
          onSubmit={(event) => void logIn(event)}>
          <label htmlFor="login-email">Email
            <input ref={emailRef} id="login-email" name="email" type="email" placeholder="you@company.com"
              autoComplete="username" autoCapitalize="none" spellCheck={false} inputMode="email" required maxLength={254}
              disabled={busy} value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} />
          </label>
          <label htmlFor="login-password">Password
            <input id="login-password" name="password" type="password" placeholder="••••••••"
              autoComplete="current-password" required disabled={busy} value={password}
              onChange={(event) => { setPassword(event.target.value); setError(""); }} />
          </label>
          {error && <p id="login-error" className={styles.error} role="alert">{error}</p>}
          <button type="submit" className={`btn btn-primary btn-lg ${styles.submit}`} disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
          <span className={styles.srOnly} role="status" aria-live="polite">{busy ? "Logging in. Please wait." : ""}</span>
        </form>
      </div>
    </div>
  );
}
