import type { CSSProperties } from "react";
import { DiscoveryIcon } from "./DiscoveryIcon";
import type { SwipeDirection } from "./useSwipeDeck";
import styles from "./Discovery.module.css";

export function SwipeActions({
  disabled,
  passFeedback,
  hiFeedback,
  onDismiss,
  onMore,
  moreOpen,
}: {
  disabled: boolean;
  passFeedback: number;
  hiFeedback: number;
  onDismiss: (direction: SwipeDirection) => void;
  onMore: (opener: HTMLButtonElement) => void;
  moreOpen: boolean;
}) {
  return (
    <div className={styles.swipeActions} role="group" aria-label="Profile actions">
      <div className={styles.actionWithLabel}>
        <button
          type="button"
          aria-labelledby="discover-pass-label"
          className={`${styles.actionCircle} ${styles.passButton}`}
          style={{ "--feedback": passFeedback } as CSSProperties}
          disabled={disabled}
          onClick={() => onDismiss("left")}
        >
          <DiscoveryIcon name="close" size={25} />
        </button>
        <span id="discover-pass-label" className={styles.actionLabel}>Pass</span>
      </div>

      <button
        type="button"
        className={styles.hiButton}
        style={{ "--feedback": hiFeedback } as CSSProperties}
        disabled={disabled}
        onClick={() => onDismiss("right")}
        aria-label="Say Hi"
      >
        <span className={styles.wave} aria-hidden="true">👋</span>
        <span>Say Hi</span>
      </button>

      <div className={styles.actionWithLabel}>
        <button type="button" aria-labelledby="discover-more-label" className={styles.actionCircle}
          disabled={disabled} aria-haspopup="dialog" aria-expanded={moreOpen}
          onClick={(event) => onMore(event.currentTarget)}>
          <DiscoveryIcon name="more" size={25} />
        </button>
        <span id="discover-more-label" className={styles.actionLabel}>More</span>
      </div>
    </div>
  );
}
