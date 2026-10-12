"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import type { ProfileInteractionResult } from "../../lib/supabase/interactions";
import { fetchHi5 } from "./hi5Api";
import type { Hi5Response } from "./hi5Model";

export function useHi5Profiles(authUserId: string, ownerId: string) {
  const [state, setState] = useState<{ data: Hi5Response | null; loading: boolean; error: string | null; clockOffset: number }>({
    data: null, loading: true, error: null, clockOffset: 0,
  });
  const mounted = useRef(false);
  const request = useRef<AbortController | null>(null);
  const queued = useRef(false);

  const refresh = useCallback(async () => {
    if (!mounted.current) return;
    if (request.current) { queued.current = true; return; }
    const controller = new AbortController();
    request.current = controller;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const data = await fetchHi5(authUserId, ownerId, controller.signal);
      if (mounted.current && request.current === controller && !controller.signal.aborted) {
        setState({ data, loading: false, error: null, clockOffset: Date.parse(data.server_time) - Date.now() });
      }
    } catch (cause) {
      if (mounted.current && !controller.signal.aborted) setState((previous) => ({ ...previous, loading: false,
        error: cause instanceof Error ? cause.message : "Your Hi5 couldn’t be loaded. Please try again." }));
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (queued.current && mounted.current) { queued.current = false; queueMicrotask(() => { void refresh(); }); }
      }
    }
  }, [authUserId, ownerId]);

  useEffect(() => {
    mounted.current = true;
    queueMicrotask(() => { void refresh(); });
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    // Reconnect/focus plus a quiet fallback covers missed Realtime messages.
    const poll = setInterval(onVisible, 60_000);
    return () => {
      mounted.current = false;
      request.current?.abort(); request.current = null; queued.current = false;
      clearInterval(poll);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const batchId = state.data?.batch.id;
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    const update = () => { void refresh(); };
    let channel = client.channel(`hi5:${authUserId}:${batchId ?? "waiting"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hi5_batches", filter: `user_profile_id=eq.${ownerId}` }, update)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "hi5_batches", filter: `user_profile_id=eq.${ownerId}` }, update);
    if (batchId) channel = channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hi5_candidates", filter: `batch_id=eq.${batchId}` }, update)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "hi5_candidates", filter: `batch_id=eq.${batchId}` }, update);
    channel.subscribe((status) => { if (status === "SUBSCRIBED") update(); });
    return () => { void client.removeChannel(channel); };
  }, [authUserId, ownerId, batchId, refresh]);

  const expiresAt = state.data?.batch.expires_at;
  useEffect(() => {
    if (!expiresAt) return;
    const delay = Math.max(100, Date.parse(expiresAt) - Date.now() - state.clockOffset + 100);
    const timer = setTimeout(() => { void refresh(); }, Math.min(delay, 2_147_483_647));
    return () => clearTimeout(timer);
  }, [expiresAt, state.clockOffset, refresh]);

  const confirmDecision = useCallback((expectedBatchId: string, profileId: string, result: ProfileInteractionResult) => {
    // A read begun before this RPC committed must not restore its old pending state.
    request.current?.abort(); request.current = null; queued.current = false;
    setState((previous) => previous.data?.batch.id !== expectedBatchId ? previous : {
      ...previous, data: { ...previous.data, candidates: previous.data.candidates.map((candidate) =>
        candidate.candidate_profile_id === profileId ? { ...candidate,
          decision: result.action, state: result.matched ? "matched" : result.action === "hi" ? "hi_sent" : "passed",
          match_id: result.matchId,
        } : candidate) },
    });
    void refresh();
  }, [refresh]);

  return { ...state, refresh, confirmDecision };
}
