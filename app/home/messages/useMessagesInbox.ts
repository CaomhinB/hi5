"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import { fetchMessagesInbox } from "./messagesApi";
import type { MessagesInbox } from "./messagesModel";

export function useMessagesInbox(authUserId: string, publicUserId: string) {
  const [state, setState] = useState<{ data: MessagesInbox | null; error: string | null; clockOffset: number }>(
    { data: null, error: null, clockOffset: 0 });
  const request = useRef<AbortController | null>(null);
  const alive = useRef(false);
  const queued = useRef(false);

  const refresh = useCallback(async function refreshInbox(force = false) {
    if (!alive.current) return;
    if (force) { request.current?.abort(); request.current = null; queued.current = false; }
    if (request.current) { queued.current = true; return; }
    const controller = new AbortController();
    request.current = controller;
    try {
      const data = await fetchMessagesInbox(authUserId, controller.signal);
      if (alive.current && !controller.signal.aborted) {
        setState({ data, error: null, clockOffset: Date.parse(data.server_time) - Date.now() });
      }
    } catch (cause) {
      if (alive.current && !controller.signal.aborted) setState((previous) => ({ ...previous,
        error: cause instanceof Error ? cause.message : "Your messages couldn’t be loaded." }));
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (queued.current && alive.current) { queued.current = false; queueMicrotask(() => { void refreshInbox(); }); }
      }
    }
  }, [authUserId]);

  useEffect(() => {
    alive.current = true;
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    const client = getSupabaseBrowserClient();
    const channel = client.channel(`messages-inbox:${publicUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_hi_requests", filter: `recipient_id=eq.${publicUserId}` }, onVisible)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `user_1_id=eq.${publicUserId}` }, onVisible)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `user_2_id=eq.${publicUserId}` }, onVisible)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, onVisible)
      .subscribe((status) => { if (status === "SUBSCRIBED") onVisible(); });
    void refresh();
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    const poll = setInterval(onVisible, 30_000);
    return () => {
      alive.current = false; queued.current = false;
      request.current?.abort(); request.current = null;
      clearInterval(poll); void client.removeChannel(channel);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [publicUserId, refresh]);

  return { ...state, refresh };
}
