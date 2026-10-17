"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "../../components/landing/Logo";
import { LoginModal } from "../../components/landing/LoginModal";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import styles from "../Signup.module.css";

async function confirmSession() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);
  if (hash.has("error") || query.has("error")) throw new Error("Invalid confirmation link");
  const client = getSupabaseBrowserClient();
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  // PKCE links are consumed during SDK initialization. Also accept confirmation
  // emails sent before cookie-based auth was introduced.
  const result = accessToken && refreshToken
    ? await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    : await client.auth.getSession();
  if (result.error) throw result.error;
  if (accessToken) window.history.replaceState(null, "", window.location.pathname);
  return !!result.data.session;
}

export default function ConfirmedPage() {
  const confirmation = useRef<Promise<boolean> | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [canLogIn, setCanLogIn] = useState(false);
  const [message, setMessage] = useState("Confirming your account…");
  const closeLogin = useCallback(() => setLoginOpen(false), []);
  useEffect(() => {
    let active = true;
    async function confirm() {
      try {
        // Share one exchange across React's development effect replay.
        confirmation.current ??= confirmSession();
        const signedIn = await confirmation.current;
        if (!active) return;
        if (signedIn) {
          // Start onboarding with a fresh document and the confirmed cookie session.
          window.location.replace("/onboarding");
        } else {
          setMessage("Log in to continue setting up your profile. If you haven’t confirmed your email yet, open the latest confirmation link in your inbox first.");
          setCanLogIn(true);
        }
      } catch {
        if (active) {
          setMessage("This link could not sign you in. If your email is already confirmed, log in to finish setting up your profile. Otherwise, open the latest confirmation email.");
          setCanLogIn(true);
        }
      }
    }
    void confirm();
    return () => { active = false; };
  }, []);
  return (
    <>
      <main className={styles.page}>
        <Link href="/" aria-label="Hi5 home"><Logo height={46} /></Link>
        <section className={`glass glass-strong ${styles.card} ${styles.success}`}>
          <h1>Email confirmation</h1>
          <p role="status">{message}</p>
          {canLogIn && (
            <div>
              <button type="button" className="btn btn-primary" aria-haspopup="dialog" onClick={() => setLoginOpen(true)}>
                Log in to continue
              </button>
            </div>
          )}
          <Link href="/" className={`btn ${canLogIn ? "btn-glass" : "btn-primary"}`}>Back to Hi5</Link>
        </section>
      </main>
      {loginOpen && <LoginModal onClose={closeLogin} />}
    </>
  );
}
