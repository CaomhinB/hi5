"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentProfile } from "../../lib/supabase/currentProfile";
import { fetchMatches, unmatch } from "./matchesApi";
import type { MatchCard } from "./matchesApi";

export type MatchesStatus = "loading" | "guest" | "error" | "ready";

interface LoadedMatches {
  userId: string;
  attempt: number;
  matches: MatchCard[];
  error: string | null;
}

/** Loads the signed-in user's active matches and handles Unmatch. */
export function useMatches() {
  const profile = useCurrentProfile();
  const userId = profile.status === "ready" ? profile.context?.publicUserId ?? null : null;
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<LoadedMatches | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const unmatchRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    fetchMatches(userId, controller.signal).then(
      (matches) => {
        if (!controller.signal.aborted) setLoaded({ userId, attempt, matches, error: null });
      },
      (cause: unknown) => {
        if (controller.signal.aborted) return;
        const error = cause instanceof Error ? cause.message : "Your matches couldn’t be loaded. Please try again.";
        setLoaded({ userId, attempt, matches: [], error });
      },
    );
    return () => controller.abort();
  }, [userId, attempt]);

  useEffect(() => () => unmatchRequest.current?.abort(), []);

  const current = loaded && loaded.userId === userId && loaded.attempt === attempt ? loaded : null;
  let status: MatchesStatus;
  if (profile.status === "guest") status = "guest";
  else if (profile.status === "error" && !userId) status = "error";
  else if (!userId || !current) status = "loading";
  else status = current.error ? "error" : "ready";

  const error = status === "error" ? current?.error ?? profile.error : null;

  const retry = useCallback(() => {
    setLoaded(null);
    setAttempt((value) => value + 1);
  }, []);

  const unmatchMatch = useCallback(async (matchId: string) => {
    unmatchRequest.current?.abort();
    const controller = new AbortController();
    unmatchRequest.current = controller;
    setPendingId(matchId);
    setActionError(null);
    try {
      await unmatch(matchId, controller.signal);
      if (controller.signal.aborted) return;
      setLoaded((value) => value && { ...value, matches: value.matches.filter((match) => match.matchId !== matchId) });
    } catch (cause) {
      if (controller.signal.aborted) return;
      setActionError(cause instanceof Error ? cause.message : "We couldn’t unmatch right now. Please try again.");
    } finally {
      if (unmatchRequest.current === controller) {
        unmatchRequest.current = null;
        setPendingId(null);
      }
    }
  }, []);

  return {
    status,
    matches: current?.matches ?? [],
    error,
    pendingId,
    actionError,
    clearActionError: () => setActionError(null),
    retry,
    unmatch: unmatchMatch,
  };
}
