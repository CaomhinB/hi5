"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DiscoveryProfile } from "./discoveryProfile";
import { fetchDiscoveryProfilesBatch } from "./discoveryProfilesApi";
import type { DiscoveryBatchLoader } from "./discoveryProfilesApi";

export const DISCOVERY_BATCH_SIZE = 10;
export const DISCOVERY_REFILL_THRESHOLD = 4;

interface QueueState {
  profiles: DiscoveryProfile[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  swipedCount: number;
}

const initialState = (): QueueState => ({
  profiles: [], isLoading: false, hasMore: true, error: null, swipedCount: 0,
});

/** Pass a stable loader to add a different query; changing it restarts pagination. */
export function useDiscoveryProfiles(loadBatch: DiscoveryBatchLoader | null = fetchDiscoveryProfilesBatch) {
  const [state, setState] = useState(initialState);
  const snapshot = useRef<QueueState>(initialState());
  const offset = useRef(0);
  const seenIds = useRef(new Set<string>());
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(false);

  const update = useCallback((patch: Partial<QueueState>) => {
    snapshot.current = { ...snapshot.current, ...patch };
    setState(snapshot.current);
  }, []);

  const restart = useCallback(() => {
    request.current?.abort();
    request.current = null;
    offset.current = 0;
    seenIds.current.clear();
    update(initialState());
  }, [update]);

  const loadMore = useCallback(async () => {
    // A ref locks requests immediately, before React publishes the loading state.
    if (!loadBatch || !mounted.current || request.current || !snapshot.current.hasMore) return;
    const controller = new AbortController();
    request.current = controller;
    update({ isLoading: true, error: null });

    try {
      const batch = await loadBatch({ offset: offset.current, limit: DISCOVERY_BATCH_SIZE, signal: controller.signal });
      if (request.current !== controller || controller.signal.aborted || !mounted.current) return;
      const nextProfiles = batch.profiles.filter((profile) => {
        if (seenIds.current.has(profile.id)) return false;
        seenIds.current.add(profile.id);
        return true;
      });
      // Advance by raw rows, not by the deduplicated queue length.
      offset.current = batch.nextOffset;
      update({ profiles: [...snapshot.current.profiles, ...nextProfiles], hasMore: batch.hasMore });
    } catch (error) {
      if (request.current !== controller || controller.signal.aborted || !mounted.current) return;
      update({ error: error instanceof Error ? error.message : "Profiles couldn’t be loaded. Please try again." });
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (mounted.current && !controller.signal.aborted) update({ isLoading: false });
      }
    }
  }, [loadBatch, update]);

  const removeProfile = useCallback((profileId: string) => {
    // Animation completion and timer fallbacks must never consume two cards.
    if (snapshot.current.profiles[0]?.id !== profileId) return;
    update({ profiles: snapshot.current.profiles.slice(1), swipedCount: snapshot.current.swipedCount + 1 });
  }, [update]);

  useEffect(() => {
    if (!loadBatch) return;
    mounted.current = true;
    let active = true;
    // Skip the discarded setup in React Strict Mode before starting any request.
    queueMicrotask(() => { if (active) restart(); });
    return () => {
      active = false;
      mounted.current = false;
      request.current?.abort();
      request.current = null;
    };
  }, [loadBatch, restart]);

  useEffect(() => {
    let active = true;
    if (state.profiles.length <= DISCOVERY_REFILL_THRESHOLD && state.hasMore && !state.isLoading && !state.error) {
      queueMicrotask(() => { if (active) void loadMore(); });
    }
    return () => { active = false; };
  }, [state.profiles.length, state.hasMore, state.isLoading, state.error, loadMore]);

  return { ...state, removeProfile, loadMore, restart };
}
