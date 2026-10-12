"use client";

import Link from "next/link";
import { useState } from "react";
import { MatchCardItem } from "./MatchCardItem";
import { useMatches } from "./useMatches";
import styles from "./Matches.module.css";

export function MatchesExperience() {
  const { status, matches, error, pendingId, actionError, clearActionError, retry, unmatch } = useMatches();
  // Only one card can show its menu or confirm step at a time.
  const [openId, setOpenId] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className={styles.list} role="status" aria-live="polite" aria-label="Loading your matches">
        {[0, 1, 2].map((item) => <div key={item} className={styles.skeleton} aria-hidden="true" />)}
      </div>
    );
  }

  if (status === "guest") {
    return (
      <div className={styles.state}>
        <h2>Sign in to see your matches</h2>
        <p>Your matches appear here once you are signed in.</p>
        <Link href="/" className={styles.stateButton}>Go to sign in</Link>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.state} role="alert">
        <h2>Something went wrong</h2>
        <p>{error ?? "Your matches couldn’t be loaded. Please try again."}</p>
        <button type="button" className={styles.stateButton} onClick={retry}>Try again</button>
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className={styles.state}>
        <h2>No matches yet</h2>
        <p>When you and someone else both say Hi, they will show up here.</p>
        <Link href="/home/discover" className={styles.stateButton}>Find people in Discover</Link>
      </div>
    );
  }

  return (
    <>
      <p className={styles.count}>
        <strong>{matches.length}</strong> {matches.length === 1 ? "match" : "matches"}
      </p>
      {actionError ? (
        <p className={styles.actionError} role="alert">
          {actionError}
          <button type="button" onClick={clearActionError}>Dismiss</button>
        </p>
      ) : null}
      <ul className={styles.list}>
        {matches.map((match) => (
          <li key={match.matchId}>
            <MatchCardItem
              match={match}
              open={openId === match.matchId}
              pending={pendingId === match.matchId}
              onOpenChange={(next) => setOpenId(next ? match.matchId : null)}
              onUnmatch={() => void unmatch(match.matchId)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
