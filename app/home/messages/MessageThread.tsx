"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import { fetchMessageThread, markChatRead, sendChatMessage } from "./messagesApi";
import { mergeMessages, messageTime } from "./messagesModel";
import type { ChatMessage, Conversation } from "./messagesModel";
import { MessageAvatar } from "./MessageAvatar";
import { MessageIcon } from "./MessageIcon";
import styles from "./Messages.module.css";

export function MessageThread({ conversation, authUserId, publicUserId, onRefresh, onProfile }: {
  conversation: Conversation; authUserId: string; publicUserId: string; onRefresh: () => Promise<void>;
  onProfile: (opener: HTMLButtonElement) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const alive = useRef(false);
  const readRequest = useRef<AbortController | null>(null);
  const otherRequests = useRef(new Set<AbortController>());
  const queued = useRef(false);
  const initialized = useRef(false);
  const pendingSend = useRef<{ id: string; body: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const previousCount = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const matchId = conversation.id;

  const refresh = useCallback(async function refreshThread() {
    if (!alive.current) return;
    if (readRequest.current) { queued.current = true; return; }
    const controller = new AbortController(); readRequest.current = controller;
    try {
      const latest = await fetchMessageThread(authUserId, matchId, controller.signal);
      if (!alive.current || controller.signal.aborted) return;
      setMessages((previous) => mergeMessages(previous, latest));
      if (!initialized.current) { setHasOlder(latest.length === 50); initialized.current = true; }
      setError(null);
    } catch (cause) {
      if (alive.current && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Your conversation couldn’t be loaded.");
    } finally {
      if (alive.current && !controller.signal.aborted) setLoading(false);
      if (readRequest.current === controller) {
        readRequest.current = null;
        if (queued.current && alive.current) { queued.current = false; queueMicrotask(() => { void refreshThread(); }); }
      }
    }
  }, [authUserId, matchId]);

  useEffect(() => {
    alive.current = true;
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    const client = getSupabaseBrowserClient();
    const channel = client.channel(`message-thread:${matchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` }, onVisible)
      .subscribe((status) => { if (status === "SUBSCRIBED") onVisible(); });
    queueMicrotask(() => { void refresh(); });
    const poll = setInterval(onVisible, 30_000);
    window.addEventListener("focus", onVisible); window.addEventListener("online", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    const activeRequests = otherRequests.current;
    return () => {
      alive.current = false; queued.current = false; readRequest.current?.abort(); readRequest.current = null;
      activeRequests.forEach((controller) => controller.abort()); activeRequests.clear();
      clearInterval(poll); void client.removeChannel(channel);
      window.removeEventListener("focus", onVisible); window.removeEventListener("online", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [matchId, refresh]);

  useEffect(() => {
    if (nearBottom.current && messages.length !== previousCount.current) bottomRef.current?.scrollIntoView({ block: "nearest" });
    previousCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    const newest = messages.at(-1);
    if (!newest || !messages.some((message) => message.sender_id !== publicUserId && !message.read_at)) return;
    const controller = new AbortController();
    const markVisible = () => {
      // The desktop preview is hidden on mobile until a conversation is opened.
      if (document.visibilityState !== "visible" || !listRef.current?.getClientRects().length) return;
      void markChatRead(authUserId, matchId, newest, controller.signal)
        .then(() => { if (!controller.signal.aborted) void onRefresh(); })
        .catch(() => { /* A later visible refresh retries read receipts; sending stays available. */ });
    };
    markVisible();
    document.addEventListener("visibilitychange", markVisible); window.addEventListener("resize", markVisible);
    return () => { controller.abort(); document.removeEventListener("visibilitychange", markVisible); window.removeEventListener("resize", markVisible); };
  }, [messages, authUserId, publicUserId, matchId, onRefresh]);

  async function loadOlder() {
    if (loadingOlder || !messages[0]) return;
    setLoadingOlder(true);
    const controller = new AbortController(); otherRequests.current.add(controller);
    const oldHeight = listRef.current?.scrollHeight ?? 0;
    const oldTop = listRef.current?.scrollTop ?? 0;
    try {
      const older = await fetchMessageThread(authUserId, matchId, controller.signal, messages[0]);
      if (!alive.current) return;
      nearBottom.current = false;
      setMessages((previous) => mergeMessages(older, previous)); setHasOlder(older.length === 50); setError(null);
      requestAnimationFrame(() => { if (listRef.current) listRef.current.scrollTop = oldTop + listRef.current.scrollHeight - oldHeight; });
    } catch (cause) {
      if (alive.current && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Older messages couldn’t be loaded.");
    } finally { otherRequests.current.delete(controller); if (alive.current) setLoadingOlder(false); }
  }

  async function send() {
    const body = draft.trim();
    if (!body || body.length > 5000 || pendingSend.current && sending) return;
    if (!pendingSend.current || pendingSend.current.body !== body) pendingSend.current = { id: crypto.randomUUID(), body };
    const attempt = pendingSend.current;
    setSending(true); setSendError(null);
    const controller = new AbortController(); otherRequests.current.add(controller);
    try {
      const message = await sendChatMessage(authUserId, matchId, attempt.id, body, controller.signal);
      if (!alive.current) return;
      nearBottom.current = true;
      setMessages((previous) => mergeMessages(previous, [message])); setDraft(""); pendingSend.current = null;
      void onRefresh(); inputRef.current?.focus();
    } catch (cause) {
      if (alive.current && !controller.signal.aborted) setSendError(cause instanceof Error ? cause.message : "Your message couldn’t be sent. Try again.");
    } finally { otherRequests.current.delete(controller); if (alive.current) setSending(false); }
  }

  return <section className={styles.thread} aria-label={`Conversation with ${conversation.profile.name}`}>
    <header className={styles.threadHeader}>
      <Link href="/home/messages" className={`${styles.iconButton} ${styles.backButton}`} aria-label="Back to messages"><MessageIcon name="back" /></Link>
      <MessageAvatar profile={conversation.profile} />
      <div className={styles.person}><h2>{conversation.profile.name}</h2><p>{conversation.profile.job_title || "Your connection"}</p></div>
      <button className={styles.profileButton} type="button" onClick={(event) => onProfile(event.currentTarget)}>View profile</button>
    </header>
    <div ref={listRef} className={styles.messageList} role="log" aria-label="Messages" aria-live="polite" aria-busy={loading}
      onScroll={() => { const list = listRef.current; if (list) nearBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 100; }}>
      <p className={styles.connectionNote}>You both said Hi</p>
      {hasOlder && <button type="button" className={styles.loadOlder} disabled={loadingOlder} onClick={() => void loadOlder()}>{loadingOlder ? "Loading…" : "Load earlier messages"}</button>}
      {loading && <p className={styles.empty}>Loading your conversation…</p>}
      {!loading && !messages.length && !error && <div className={styles.chatEmpty}><MessageIcon name="chat" size={36} /><h3>Start with a hello</h3><p>You’re connected. Introduce yourself to {(conversation.profile.name || "your connection").split(" ")[0]}.</p></div>}
      {messages.map((message, index) => {
        const own = message.sender_id === publicUserId;
        const previous = messages[index - 1];
        const newDay = !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString();
        return <div key={message.id}>
          {newDay && <p className={styles.dayLabel}>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(message.created_at))}</p>}
          <div className={`${styles.messageRow} ${own ? styles.ownMessage : ""}`}><div>
            <p className={styles.bubble}>{message.body}</p>
            <p className={styles.messageMeta}><time dateTime={message.created_at}>{messageTime(message.created_at)}</time>{own && <span>{message.read_at ? "Read" : "Sent"}</span>}</p>
          </div></div>
        </div>;
      })}
      {error && <div className={styles.error} role="alert">{error}<button type="button" onClick={() => void refresh()}>Try again</button></div>}
      <div ref={bottomRef} />
    </div>
    <footer className={styles.composerArea}>
      {sendError && <p className={styles.error} role="alert">{sendError} Your text is kept below. Press Send to retry.</p>}
      <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <label htmlFor="chat-message" className={styles.srOnly}>Write a message</label>
        <textarea ref={inputRef} id="chat-message" value={draft} rows={1} maxLength={5000} disabled={sending} placeholder="Write a message…"
          onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia("(min-width: 768px)").matches) {
              event.preventDefault(); void send();
            }
          }} />
        <button type="submit" className={styles.sendButton} disabled={sending || !draft.trim()} aria-label={sending ? "Sending message" : "Send message"}><MessageIcon name="send" /></button>
      </form>
      <div className={styles.composerHint}><span>{sending ? "Sending…" : "Keep the conversation going."}</span><span>{draft.length}/5000</span></div>
    </footer>
  </section>;
}
