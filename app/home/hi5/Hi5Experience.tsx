"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Logo } from "../../components/landing/Logo";
import Link from "next/link";
import { useCurrentProfile } from "../../lib/supabase/currentProfile";
import { recordProfileInteraction } from "../../lib/supabase/interactions";
import type { ProfileInteractionResult } from "../../lib/supabase/interactions";
import { isProfileComplete } from "../../onboarding/profileModel";
import type { OnboardingContext } from "../../onboarding/onboardingApi";
import { DiscoveryIcon } from "../discover/DiscoveryIcon";
import { ProfileCard } from "../discover/ProfileCard";
import { SwipeActions } from "../discover/SwipeActions";
import { SaveProfileButton } from "../discover/SaveProfileButton";
import { DiscoveryProfileOverlay } from "../discover/DiscoveryProfileOverlay";
import { InteractionFeedback } from "../discover/InteractionFeedback";
import type { InteractionNotice } from "../discover/InteractionFeedback";
import { useSwipeDeck } from "../discover/useSwipeDeck";
import type { SwipeDirection } from "../discover/useSwipeDeck";
import type { DiscoveryProfile } from "../discover/discoveryProfile";
import { Hi5AccessState } from "./Hi5AccessState";
import { Hi5Avatar } from "./Hi5Avatar";
import { Hi5Icon } from "./Hi5Icon";
import { MyCardPreview } from "./MyCardPreview";
import { cardProfile } from "./hi5Api";
import { candidateStatus, daysLeft, preferencesToFilters } from "./hi5Model";
import type { Hi5Candidate } from "./hi5Model";
import { useHi5Profiles } from "./useHi5Profiles";
import discoveryStyles from "../discover/Discovery.module.css";
import styles from "./Hi5.module.css";

type Profiles = ReturnType<typeof useHi5Profiles>;

export function Hi5Experience() {
  const state = useCurrentProfile();
  const context = state.context;
  return <section className={styles.page} aria-labelledby="hi5-title">
    <header className={styles.header}>
      <h1 id="hi5-title"><Logo height={60.8} /></h1>
      <p>Meet 5 people worth saying Hi to</p>
    </header>
    {!context?.profile ? <Hi5AccessState state={state} />
      : !isProfileComplete(context.profile, context.photoExists) ? <Hi5AccessState state={state} incomplete />
        : <SignedInHi5 key={context.authUserId} context={context} />}
  </section>;
}

function SignedInHi5({ context }: { context: OnboardingContext }) {
  const profiles = useHi5Profiles(context.authUserId, context.publicUserId);
  if (!profiles.data) return <div className={styles.message} aria-busy={profiles.loading}>
    <DiscoveryIcon name="sparkles" size={30} />
    <h2>{profiles.error ? "Your Hi5 couldn’t be loaded" : "Finding your five"}</h2>
    <p role={profiles.error ? "alert" : "status"}>{profiles.error || "Picking people based on your profile and preferences."}</p>
    {profiles.error && <button type="button" className="btn btn-primary" disabled={profiles.loading} onClick={() => void profiles.refresh()}>Try again</button>}
  </div>;
  return <Hi5Round key={profiles.data.batch.id} profiles={profiles} context={context} />;
}

function Hi5Round({ profiles, context }: { profiles: Profiles; context: OnboardingContext }) {
  const data = profiles.data!;
  const { refresh, confirmDecision } = profiles;
  const [selectedId, setSelectedId] = useState<string | null>(() => data.candidates.find((candidate) =>
    candidate.state === "pending" && !candidate.decision)?.id ?? data.candidates[0]?.id ?? null);
  const [localNow, setLocalNow] = useState(() => Date.now());
  const [expanded, setExpanded] = useState<{ profile: DiscoveryProfile; opener: HTMLButtonElement } | null>(null);
  const [previewOpener, setPreviewOpener] = useState<HTMLButtonElement | null>(null);
  const [notice, setNotice] = useState<InteractionNotice | null>(null);
  const [animationStack, setAnimationStack] = useState<Hi5Candidate[] | null>(null);
  const closeExpanded = useCallback(() => setExpanded(null), []);
  const closePreview = useCallback(() => setPreviewOpener(null), []);
  const clearNotice = useCallback(() => setNotice(null), []);
  const now = localNow + profiles.clockOffset;
  const remainingDays = daysLeft(data.batch.expires_at, now);
  const active = data.candidates.find((candidate) => candidate.id === selectedId)
    ?? data.candidates.find((candidate) => candidate.state === "pending" && !candidate.decision)
    ?? data.candidates[0];
  const canChoose = !!active && active.state === "pending" && !active.decision && remainingDays > 0;
  const activeIndex = data.candidates.findIndex((candidate) => candidate.id === active?.id);
  const following = [...data.candidates.slice(activeIndex + 1), ...data.candidates.slice(0, activeIndex)];
  const nextStack = active ? [active, ...following.filter((candidate) => candidate.state === "pending" && !candidate.decision)].slice(0, 3) : [];
  const preferencesChanged = JSON.stringify(preferencesToFilters(data.preferences))
    !== JSON.stringify(preferencesToFilters(data.batch.filters_snapshot));

  useEffect(() => {
    const tick = () => setLocalNow(Date.now());
    const interval = setInterval(tick, 60_000);
    const expiry = setTimeout(tick, Math.max(0, Date.parse(data.batch.expires_at) - Date.now() - profiles.clockOffset + 10));
    return () => { clearInterval(interval); clearTimeout(expiry); };
  }, [data.batch.expires_at, profiles.clockOffset]);

  const commit = useCallback(async (profileId: string, direction: SwipeDirection, signal: AbortSignal) => {
    const index = data.candidates.findIndex((candidate) => candidate.candidate_profile_id === profileId);
    const candidate = data.candidates[index];
    if (candidate) setAnimationStack([candidate, ...[...data.candidates.slice(index + 1), ...data.candidates.slice(0, index)]
      .filter((person) => person.state === "pending" && !person.decision)].slice(0, 3));
    try {
      return await recordProfileInteraction({ targetUserId: profileId, action: direction === "right" ? "hi" : "pass",
        source: "hi5", signal, expectedBatchId: data.batch.id, expectedAuthUserId: context.authUserId });
    } catch (cause) {
      if (!signal.aborted) { setAnimationStack(null); void refresh(); }
      throw cause;
    }
  }, [data.batch.id, data.candidates, context.authUserId, refresh]);
  const complete = useCallback((profileId: string, result: ProfileInteractionResult) => {
    confirmDecision(data.batch.id, profileId, result);
    setAnimationStack(null);
    const index = data.candidates.findIndex((candidate) => candidate.candidate_profile_id === profileId);
    const ordered = [...data.candidates.slice(index + 1), ...data.candidates.slice(0, index)];
    setSelectedId(ordered.find((candidate) => candidate.state === "pending" && !candidate.decision)?.id
      ?? data.candidates.find((candidate) => candidate.candidate_profile_id === profileId)?.id ?? null);
    if (result.action === "hi") setNotice((previous) => ({ sequence: (previous?.sequence ?? 0) + 1, result }));
  }, [data.batch.id, data.candidates, confirmDecision]);
  const deck = useSwipeDeck(canChoose ? active.candidate_profile_id : null, commit, complete);
  // Decided cards stay accessible in the avatar bar. Only three are mounted.
  const visible = animationStack ?? nextStack;
  const reviewed = data.candidates.filter((candidate) => candidate.decision || candidate.state === "matched").length;

  return <>
    <div className={styles.shortlist}>
      <div className={styles.shortlistHeading}><h2>Your Hi5</h2><span>{reviewed}/{data.candidates.length || 5} reviewed</span></div>
      <div className={styles.avatars} role="group" aria-label="Choose a Hi5 candidate">
        {Array.from({ length: 5 }, (_, index) => {
          const candidate = data.candidates.find((person) => person.position === index + 1);
          return candidate ? <Hi5Avatar key={candidate.id} candidate={candidate} selected={candidate.id === active?.id}
            disabled={deck.busy} remainingDays={remainingDays} onSelect={() => { setSelectedId(candidate.id); deck.clearError(); }} />
            : <div key={`empty-${index}`} className={styles.emptySlot} aria-label={`Slot ${index + 1}: no available candidate`}>
              <span className={styles.emptyAvatar}><Hi5Icon name="plus" size={22} /></span><span>Next round</span>
            </div>;
        })}
      </div>
    </div>
    <p className={styles.roundHint} role="status">{remainingDays > 0
      ? `Your next Hi5 arrives in ${remainingDays} ${remainingDays === 1 ? "day" : "days"}.` : "Your new Hi5 is being prepared…"}</p>
    {preferencesChanged && <p className={styles.roundHint}>Your updated preferences are saved for the next round.</p>}

    {active ? <>
      <p id="hi5-swipe-help" className={discoveryStyles.srOnly}>Swipe left to pass or right to say Hi. Your first choice is final for this round.</p>
      <div className={discoveryStyles.deckViewport}>
        <div className={discoveryStyles.stack} role="group" aria-label="Your Hi5 profile cards" aria-busy={deck.busy}
          data-dismissing={deck.exitDirection ? "true" : undefined}>
          {visible.map((candidate, position) => {
            const front = position === 0;
            const exitClass = front && deck.exitDirection ? deck.exitDirection === "left" ? discoveryStyles.exitLeft : discoveryStyles.exitRight : "";
            return <div key={candidate.id} className={`${discoveryStyles.cardLayer} ${exitClass} ${styles.cardLayer}`}
              data-position={position} data-dragging={front && deck.dragging ? "true" : undefined}
              aria-hidden={!front} inert={!front} aria-describedby={front && canChoose ? "hi5-swipe-help" : undefined}
              style={front ? { "--drag-x": `${deck.dragX}px`, "--drag-rotation": `${Math.max(-16, Math.min(16, deck.dragX / 24))}deg`,
                cursor: !canChoose ? "default" : undefined } as CSSProperties : undefined}
              {...(front ? deck.pointerHandlers : {})}
              onPointerMove={front ? (event) => canChoose ? deck.pointerHandlers.onPointerMove(event) : deck.pointerHandlers.onPointerCancel(event) : undefined}
              onPointerUp={front ? (event) => canChoose ? deck.pointerHandlers.onPointerUp(event) : deck.pointerHandlers.onPointerCancel(event) : undefined}
              onAnimationEnd={front ? (event) => { if (event.target === event.currentTarget) deck.finishDismissal(); } : undefined}>
              <ProfileCard profile={cardProfile(candidate.profile, candidate)} active={front} />
              <div className={styles.matchRing} style={{ "--match-progress": `${candidate.score * 3.6}deg` } as CSSProperties}
                role="img" aria-label={`${candidate.score}% compatibility`} title="Compatibility with your profile and preferences">
                <span><strong>{candidate.score}%</strong><small>Match</small></span>
              </div>
            </div>;
          })}
        </div>
      </div>
      <SwipeActions disabled={deck.busy} decisionMade={!canChoose} passFeedback={deck.passFeedback} hiFeedback={deck.hiFeedback}
        onDismiss={deck.dismiss} moreOpen={!!expanded}
        onMore={(opener) => setExpanded({ profile: cardProfile(active.profile, active), opener })} />
      <p className={styles.decisionHint} role="status">{!canChoose && `${remainingDays === 0 && ["pending", "hi_sent"].includes(active.state)
        ? "Expired" : candidateStatus(active.state, remainingDays)} · ${active.state === "matched"
          ? "You’ve connected!" : "Choose another avatar to explore your Hi5."}`}</p>
    </> : <div className={styles.message}>
      <DiscoveryIcon name="sparkles" size={32} /><h2>You’re all caught up</h2>
      <p>There aren’t any eligible people for this round, even after broadening your preferences. Your next round starts in {remainingDays} days.</p>
    </div>}

    <div className={discoveryStyles.secondaryActions} role="group" aria-label="Additional Hi5 actions">
      <SaveProfileButton key={active?.id ?? "empty"} disabled={!active || deck.busy} />
      {deck.busy ? <button type="button" className={discoveryStyles.secondaryButton} disabled><DiscoveryIcon name="sliders" size={17} />Filters</button>
        : <Link href="/home/hi5/filters" className={discoveryStyles.secondaryButton}><DiscoveryIcon name="sliders" size={17} />Filters</Link>}
      <button type="button" className={discoveryStyles.secondaryButton} disabled={deck.busy} aria-haspopup="dialog"
        aria-expanded={!!previewOpener} onClick={(event) => setPreviewOpener(event.currentTarget)}><Hi5Icon name="card" size={17} />My Card</button>
    </div>
    <p className={discoveryStyles.interactionStatus} role="status">{deck.isSaving ? "Saving your choice…" : ""}</p>
    {deck.error && <p className={discoveryStyles.interactionError} role="alert">{deck.error}</p>}
    {profiles.error && <div className={discoveryStyles.fetchError} role="alert"><span>{profiles.error}</span>
      <button type="button" disabled={profiles.loading} onClick={() => void refresh()}>Try again</button></div>}
    <InteractionFeedback notice={notice} onExpire={clearNotice} />
    {expanded && <DiscoveryProfileOverlay key={expanded.profile.id} preview={expanded.profile} returnFocusTo={expanded.opener} onClose={closeExpanded} />}
    {previewOpener && context.profile && <MyCardPreview profile={cardProfile(context.profile)} opener={previewOpener} onClose={closePreview} />}
  </>;
}
