"use client";

import { useCallback, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { DiscoveryIcon } from "./DiscoveryIcon";
import { ProfileCard } from "./ProfileCard";
import { SaveProfileButton } from "./SaveProfileButton";
import { SwipeActions } from "./SwipeActions";
import { useSwipeDeck } from "./useSwipeDeck";
import type { SwipeDirection } from "./useSwipeDeck";
import { recordProfileInteraction } from "../../lib/supabase/interactions";
import type { ProfileInteractionResult } from "../../lib/supabase/interactions";
import { InteractionFeedback } from "./InteractionFeedback";
import type { InteractionNotice } from "./InteractionFeedback";
import { useDiscoveryProfiles } from "./useDiscoveryProfiles";
import { useDiscoveryFilters } from "./useDiscoveryFilters";
import type { DiscoveryBatchLoader } from "./discoveryProfilesApi";
import styles from "./Discovery.module.css";

const discoveryViews = ["Recommended", "Nearby", "New here"] as const;

export function DiscoveryExperience() {
  const filters = useDiscoveryFilters();
  // A new search also remounts swipe/save state, clearing any departing old card.
  return <DiscoveryResults key={filters.queryKey} loadBatch={filters.loadBatch} hasActiveFilters={filters.hasActiveFilters} />;
}

function DiscoveryResults({ loadBatch, hasActiveFilters }: {
  loadBatch: DiscoveryBatchLoader | null;
  hasActiveFilters: boolean;
}) {
  const [view, setView] = useState<(typeof discoveryViews)[number]>("Recommended");
  const discovery = useDiscoveryProfiles(loadBatch);
  const { removeProfile } = discovery;
  const [interactionNotice, setInteractionNotice] = useState<InteractionNotice | null>(null);
  const clearInteractionNotice = useCallback(() => setInteractionNotice(null), []);
  const commitInteraction = useCallback((profileId: string, direction: SwipeDirection, signal: AbortSignal) => (
    recordProfileInteraction({ targetUserId: profileId, action: direction === "right" ? "hi" : "pass", source: "discover", signal })
  ), []);
  const completeInteraction = useCallback((profileId: string, result: ProfileInteractionResult) => {
    removeProfile(profileId);
    setInteractionNotice((previous) => result.action === "hi"
      ? { sequence: (previous?.sequence ?? 0) + 1, result }
      : null);
  }, [removeProfile]);
  const activeProfile = discovery.profiles[0];
  const deck = useSwipeDeck(activeProfile?.id ?? null, commitInteraction, completeInteraction);
  const visibleProfiles = discovery.profiles.slice(0, 3);

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
          ? `Profile ${discovery.swipedCount + 1}: ${activeProfile.name}.`
          : discovery.error ? "Profiles could not be loaded."
            : discovery.hasMore ? "Loading profiles." : "You have explored all available profiles."}
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
              {visibleProfiles.map((profile, position) => {
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
          <p className={styles.interactionStatus} role="status" aria-live="polite">
            {deck.isSaving ? deck.exitDirection === "right" ? "Sending Hi…" : "Saving your pass…" : ""}
          </p>
          {deck.error && <p className={styles.interactionError} role="alert">{deck.error}</p>}
          {discovery.error && (
            <div className={styles.fetchError} role="alert">
              <span>{discovery.error}</span>
              <button type="button" onClick={() => void discovery.loadMore()} disabled={discovery.isLoading}>
                {discovery.isLoading ? "Retrying…" : "Try again"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.emptyState} aria-busy={discovery.isLoading || (!discovery.error && discovery.hasMore)}>
          <span className={styles.emptyIcon}><DiscoveryIcon name="sparkles" size={32} /></span>
          {discovery.error ? (
            <>
              <h2>Unable to load profiles</h2>
              <p role="alert">{discovery.error}</p>
              <button type="button" className="btn btn-primary" onClick={() => void discovery.loadMore()} disabled={discovery.isLoading}>Try again</button>
            </>
          ) : discovery.hasMore ? (
            <>
              <h2>Finding your next connections</h2>
              <p>Loading profiles…</p>
            </>
          ) : (
            <>
              <h2>{hasActiveFilters && discovery.swipedCount === 0 ? "No profiles match these filters" : "You’re all caught up!"}</h2>
              <p>{hasActiveFilters && discovery.swipedCount === 0
                ? "Try changing your filters to meet more people."
                : "You’ve explored all available profiles for now."}</p>
              {hasActiveFilters && (
                <Link href={{ pathname: "/home/filters", query: { from: "/home/discover" } }} className="btn btn-primary">Edit filters</Link>
              )}
              {(!hasActiveFilters || discovery.swipedCount > 0) && (
                <button type="button" className={hasActiveFilters ? styles.secondaryButton : "btn btn-primary"} onClick={discovery.restart}>Start again</button>
              )}
            </>
          )}
        </div>
      )}
      <InteractionFeedback notice={interactionNotice} onExpire={clearInteractionNotice} />
    </>
  );
}
