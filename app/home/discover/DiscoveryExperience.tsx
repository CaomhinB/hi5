"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { DiscoveryIcon } from "./DiscoveryIcon";
import { ProfileCard } from "./ProfileCard";
import { SaveProfileButton } from "./SaveProfileButton";
import { SwipeActions } from "./SwipeActions";
import { useSwipeDeck } from "./useSwipeDeck";
import type { DiscoveryProfile } from "./mockProfiles";
import styles from "./Discovery.module.css";

const discoveryViews = ["Recommended", "Nearby", "New here"] as const;

export function DiscoveryExperience({ profiles }: { profiles: DiscoveryProfile[] }) {
  const [view, setView] = useState<(typeof discoveryViews)[number]>("Recommended");
  const deck = useSwipeDeck(profiles.length);
  const activeProfile = profiles[deck.index];

  return (
    <>
      <div className={styles.viewSelectors} role="group" aria-label="Discovery view">
        {discoveryViews.map((option) => (
          <button
            key={option}
            type="button"
            className={`${styles.viewButton}${view === option ? ` ${styles.selectedView}` : ""}`}
            aria-pressed={view === option}
            onClick={() => setView(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <p id="discover-swipe-help" className={styles.srOnly}>
        Drag a profile left to pass or right to say Hi. You can also use the Pass and Say Hi buttons.
      </p>
      <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {activeProfile
          ? `Profile ${deck.index + 1} of ${profiles.length}: ${activeProfile.name}.`
          : "You have explored all available profiles."}
      </p>

      {activeProfile ? (
        <>
          <div className={styles.deckViewport}>
            <div
              className={styles.stack}
              role="group"
              aria-label="Discover profiles"
              aria-busy={deck.busy}
              data-dismissing={deck.exitDirection ? "true" : undefined}
            >
              {/* Hidden profiles keep the grid height stable throughout the deck. */}
              {profiles.map((profile, profileIndex) => {
                const position = profileIndex - deck.index;
                const active = position === 0;
                const exitClass = active && deck.exitDirection
                  ? deck.exitDirection === "left" ? styles.exitLeft : styles.exitRight
                  : "";
                return (
                  <div
                    key={profile.id}
                    className={`${styles.cardLayer} ${exitClass}`}
                    data-position={position}
                    data-profile-id={profile.id}
                    data-dragging={active && deck.dragging ? "true" : undefined}
                    aria-hidden={!active}
                    aria-describedby={active ? "discover-swipe-help" : undefined}
                    inert={!active}
                    style={active ? {
                      "--drag-x": `${deck.dragX}px`,
                      "--drag-rotation": `${Math.max(-16, Math.min(16, deck.dragX / 24))}deg`,
                    } as CSSProperties : undefined}
                    {...(active ? deck.pointerHandlers : {})}
                    onAnimationEnd={active ? (event) => {
                      if (event.target === event.currentTarget) deck.finishDismissal();
                    } : undefined}
                  >
                    <ProfileCard profile={profile} active={active} />
                  </div>
                );
              })}
            </div>
          </div>

          <SwipeActions
            disabled={deck.busy}
            passFeedback={deck.passFeedback}
            hiFeedback={deck.hiFeedback}
            onDismiss={deck.dismiss}
          />

          <div className={styles.secondaryActions} role="group" aria-label="Additional profile actions">
            <SaveProfileButton key={activeProfile.id} disabled={deck.busy} />
            <Link href={{ pathname: "/home/filters", query: { from: "/home/discover" } }} className={styles.secondaryButton}>
              <DiscoveryIcon name="sliders" size={17} />Filters
            </Link>
            <Link href={{ pathname: "/home/meet", query: { from: "/home/discover" } }} className={styles.secondaryButton}>
              <DiscoveryIcon name="calendar" size={17} />Meet
            </Link>
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}><DiscoveryIcon name="sparkles" size={32} /></span>
          <h2>You&apos;re all caught up!</h2>
          <p>You&apos;ve explored all available profiles for now.</p>
          <button type="button" className="btn btn-primary" onClick={deck.reset}>Start again</button>
        </div>
      )}
    </>
  );
}
