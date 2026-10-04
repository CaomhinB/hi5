"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { DiscoveryIcon } from "./DiscoveryIcon";
import styles from "./Discovery.module.css";

const FEEDBACK_DURATION_MS = 1800;

// Demo state belongs to this button. A new profile remounts it with a fresh key.
export function SaveProfileButton({ disabled }: { disabled: boolean }) {
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState<{ saved: boolean; sequence: number } | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  function toggle() {
    const nextSaved = !saved;
    setSaved(nextSaved);
    setFeedback((previous) => ({ saved: nextSaved, sequence: (previous?.sequence ?? 0) + 1 }));
  }

  const iconAnimation = feedback ? saved ? styles.bookmarkPop : styles.bookmarkClear : "";

  return (
    <>
      <button type="button" className={`${styles.secondaryButton} ${styles.saveButton}`}
        aria-label="Save profile" aria-pressed={saved} disabled={disabled} onClick={toggle}>
        <DiscoveryIcon name="bookmark" size={17} className={`${styles.saveBookmark} ${iconAnimation}`} />Save
      </button>

      <div className={styles.saveFeedbackLayer} role="status" aria-live="polite" aria-atomic="true"
        style={{ "--save-feedback-duration": `${FEEDBACK_DURATION_MS}ms` } as CSSProperties}>
        {feedback && (
          <div key={feedback.sequence} className={styles.saveFeedback} data-saved={feedback.saved}>
            <span className={styles.saveFeedbackIcon} aria-hidden="true">
              <DiscoveryIcon name="bookmark" size={30} />
            </span>
            <span>{feedback.saved ? "Saved!" : "Unsaved"}</span>
          </div>
        )}
      </div>
    </>
  );
}
