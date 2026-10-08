"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "../../components/landing/Logo";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import styles from "../Signup.module.css";

export default function ConfirmedPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your account…");
  useEffect(() => {
    let active = true;
    async function confirm() {
      try {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const query = new URLSearchParams(window.location.search);
        if (hash.has("error") || query.has("error")) {
          throw new Error("Invalid confirmation link");
        }
        // The browser SDK consumes Supabase's implicit-flow URL tokens.
        const { data, error } = await getSupabaseBrowserClient().auth.getSession();
        if (error) throw error;
        if (!active) return;
        if (data.session) router.replace("/onboarding");
        else setMessage("This confirmation link is no longer available. If you already confirmed your email, return to Hi5. Otherwise, open the latest link in your inbox.");
      } catch {
        if (active) setMessage("We could not confirm your account. The link may have expired. Please check your inbox for the latest confirmation email.");
      }
    }
    void confirm();
    return () => { active = false; };
  }, [router]);
  return <main className={styles.page}>
    <Link href="/" aria-label="Hi5 home"><Logo height={46} /></Link>
    <section className={`glass glass-strong ${styles.card} ${styles.success}`}>
      <h1>Email confirmation</h1>
      <p role="status">{message}</p>
      <Link href="/" className="btn btn-primary">Back to Hi5</Link>
    </section>
  </main>;
}
