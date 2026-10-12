"use client";

import Link from "next/link";
import { refreshCurrentProfile, useCurrentProfile } from "../../lib/supabase/currentProfile";
import styles from "./Hi5.module.css";

export function Hi5AccessState({ state, incomplete = false }: {
  state: ReturnType<typeof useCurrentProfile>; incomplete?: boolean;
}) {
  const guest = state.status === "guest";
  const loading = state.status === "loading" && !state.context;
  const setup = incomplete || (!!state.context && !state.context.profile);
  return <div className={styles.message} aria-busy={loading}>
    <h2>{guest ? "Your Hi5 starts with you" : loading ? "Getting your Hi5 ready…"
      : setup ? "Complete your profile" : "Your Hi5 is unavailable"}</h2>
    <p role={state.error ? "alert" : "status"}>{guest ? "Log in to meet five people picked for you."
      : loading ? "Loading your profile." : setup ? "Add your core details and photo so we can find relevant people."
        : state.error || "Please try again in a moment."}</p>
    {!loading && <div className={styles.messageActions}>
      {guest ? <Link href="/" className="btn btn-primary">Go to log in</Link>
        : setup ? <Link href="/onboarding" className="btn btn-primary">Complete my profile</Link>
          : <button type="button" className="btn btn-primary" onClick={() => void refreshCurrentProfile()}>Try again</button>}
      <Link href="/home/discover" className="btn btn-glass">Explore Discover</Link>
    </div>}
  </div>;
}
