"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";
import type { ProfileInteractionResult } from "../../lib/supabase/interactions";
import { DiscoveryIcon } from "./DiscoveryIcon";
import styles from "./Discovery.module.css";

export interface InteractionNotice {
  sequence: number;
  result: ProfileInteractionResult;
}

export function InteractionFeedback({ notice, onExpire }: {
  notice: InteractionNotice | null;
  onExpire: () => void;
}) {
  const duration = notice?.result.matched ? 3000 : 1800;
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(onExpire, duration);
    return () => clearTimeout(timer);
  }, [notice, duration, onExpire]);

  return (
    <div className={styles.saveFeedbackLayer} role="status" aria-live="polite" aria-atomic="true"
      style={{ "--save-feedback-duration": `${duration}ms` } as CSSProperties}>
      {notice && (
        <div key={notice.sequence} className={`${styles.saveFeedback} ${styles.interactionToast}`} data-action={notice.result.action}>
          <span className={styles.saveFeedbackIcon} aria-hidden="true">
            {notice.result.matched ? <DiscoveryIcon name="sparkles" size={28} />
              : notice.result.action === "hi" ? <span className={styles.wave}>👋</span>
                : <DiscoveryIcon name="close" size={26} />}
          </span>
          <span>{notice.result.message}</span>
        </div>
      )}
    </div>
  );
}
