"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { MatchCard } from "./matchesApi";
import styles from "./Matches.module.css";

const TAG_TONES = ["blue", "cyan", "purple"] as const;

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (!Number.isFinite(days) || days < 1) return "Matched today";
  if (days === 1) return "Matched yesterday";
  if (days < 7) return `Matched ${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Matched ${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  return `Matched ${new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

interface MatchCardItemProps {
  match: MatchCard;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onUnmatch: () => void;
}

export function MatchCardItem({ match, open, pending, onOpenChange, onUnmatch }: MatchCardItemProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const initials = match.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  const details = [match.location, match.industry].filter(Boolean).join(" · ");

  function close() {
    setConfirming(false);
    onOpenChange(false);
  }

  return (
    <article className={styles.card} aria-label={`Match with ${match.name}`}>
      <div className={styles.cardTop}>
        {match.image && match.image !== failedImage ? (
          <Image
            src={match.image}
            alt=""
            width={64}
            height={64}
            className={styles.avatar}
            onError={() => setFailedImage(match.image)}
          />
        ) : (
          <span className={styles.avatarFallback} aria-hidden="true">{initials}</span>
        )}
        <div className={styles.who}>
          <h2>{match.name}</h2>
          {match.jobTitle ? <p className={styles.role}>{match.jobTitle}</p> : null}
          {details ? <p className={styles.meta}>{details}</p> : null}
        </div>
      </div>

      {match.tags.length ? (
        <ul className={styles.tags} aria-label="Skills">
          {match.tags.map((tag, index) => (
            <li key={tag} className={styles.tag} data-tone={TAG_TONES[index % TAG_TONES.length]}>{tag}</li>
          ))}
        </ul>
      ) : null}

      <p className={styles.when}>{timeAgo(match.matchedAt)}</p>

      {confirming ? (
        <div className={styles.confirm} role="alertdialog" aria-label={`Unmatch from ${match.name}`}>
          <p>Unmatch from {match.name}? You won’t be able to message each other.</p>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.secondary} onClick={close} disabled={pending}>Cancel</button>
            <button type="button" className={styles.danger} onClick={onUnmatch} disabled={pending}>
              {pending ? "Unmatching…" : "Unmatch"}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <Link href="/home/messages" className={styles.primary}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z" />
            </svg>
            Message
          </Link>
          <div className={styles.menuWrap}>
            <button
              type="button"
              className={styles.moreButton}
              aria-label={`More options for ${match.name}`}
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => onOpenChange(!open)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false">
                <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
              </svg>
            </button>
            {open ? (
              <div className={styles.menu} role="menu">
                <button type="button" role="menuitem" className={styles.menuItem} onClick={() => setConfirming(true)}>
                  Unmatch
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
}
