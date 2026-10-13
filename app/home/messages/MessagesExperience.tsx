"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { refreshCurrentProfile, useCurrentProfile } from "../../lib/supabase/currentProfile";
import type { OnboardingContext } from "../../onboarding/onboardingApi";
import type { ProfileRecord } from "../../onboarding/profileModel";
import { DiscoveryProfileOverlay } from "../discover/DiscoveryProfileOverlay";
import { cardProfile } from "../hi5/hi5Api";
import { MessageAvatar } from "./MessageAvatar";
import { MessageIcon } from "./MessageIcon";
import { MessageThread } from "./MessageThread";
import { respondToHi } from "./messagesApi";
import { activityTime, requestTimeLeft } from "./messagesModel";
import { useMessagesInbox } from "./useMessagesInbox";
import styles from "./Messages.module.css";

function Inbox({ context, conversationId }: { context: OnboardingContext; conversationId?: string }) {
  const router = useRouter();
  const inbox = useMessagesInbox(context.authUserId, context.publicUserId);
  const [query, setQuery] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<{ profile: ProfileRecord; opener: HTMLButtonElement } | null>(null);
  const action = useRef<AbortController | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const serverNow = now ? now + inbox.clockOffset : Date.parse(inbox.data?.server_time ?? "") || 0;
  const requests = inbox.data?.requests.filter((request) => Date.parse(request.expires_at) > serverNow) ?? [];
  const selected = requests.find((request) => request.id === selectedRequestId);
  const conversations = inbox.data?.conversations ?? [];
  const active = conversationId ? conversations.find((conversation) => conversation.id === conversationId) : conversations[0];
  const filtered = conversations.filter((conversation) => (conversation.profile.name || "Professional").toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    // The visual viewport shrinks when a mobile keyboard opens, unlike some CSS viewports.
    const resize = () => {
      const viewport = window.visualViewport;
      if (viewportRef.current) {
        viewportRef.current.style.setProperty("--messages-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
        viewportRef.current.style.setProperty("--messages-bottom-space", viewport && viewport.height < window.innerHeight - 100
          ? "0px" : "calc(var(--home-nav-height) + var(--home-nav-offset) + env(safe-area-inset-bottom, 0px) + 8px)");
      }
    };
    resize(); window.visualViewport?.addEventListener("resize", resize);
    return () => { clearInterval(timer); action.current?.abort(); window.visualViewport?.removeEventListener("resize", resize); };
  }, []);

  async function respond(response: "hi" | "pass") {
    if (!selected || action.current) return;
    const controller = new AbortController(); action.current = controller; setBusy(true); setActionError(null);
    try {
      const result = await respondToHi(context.authUserId, selected.id, response, controller.signal);
      if (controller.signal.aborted) return;
      setSelectedRequestId(null); setNotice(response === "pass" ? "Hi request passed." : "You’re connected. Say hello!");
      await inbox.refresh(true);
      if (!controller.signal.aborted && result.match_id) router.push(`/home/messages/${result.match_id}`);
    } catch (cause) {
      if (!controller.signal.aborted) { setActionError(cause instanceof Error ? cause.message : "Your response couldn’t be saved."); void inbox.refresh(); }
    } finally { if (!controller.signal.aborted) setBusy(false); if (action.current === controller) action.current = null; }
  }

  return <div ref={viewportRef} className={`${styles.experience} ${conversationId ? styles.conversationOpen : ""}`}>
    <header className={styles.pageHeading}><h1>Messages</h1><p>A Hi could be the start of something great.</p></header>
    <div className={styles.workspace}>
      <aside className={styles.inbox} aria-label="Hi requests and conversations">
        <section className={styles.requestsSection} aria-labelledby="hi-requests-title">
          <div className={styles.sectionHeading}><h2 id="hi-requests-title">Hi requests</h2><span className={styles.count}>{requests.length}</span></div>
          {!!requests.length && <p className={styles.requestHelp}>Say Hi back before the timer runs out.</p>}
          <div className={styles.requests}>
            {requests.map((request) => <button key={request.id} type="button" className={`${styles.request} ${selected?.id === request.id ? styles.selectedRequest : ""}`}
              disabled={busy} aria-pressed={selected?.id === request.id} onClick={() => { setSelectedRequestId(request.id); setActionError(null); }}>
              <MessageAvatar profile={request.profile} large />
              <span className={`${styles.timer} ${Date.parse(request.expires_at) - serverNow < 86_400_000 ? styles.urgent : ""}`}><MessageIcon name="clock" size={13} />{requestTimeLeft(request.expires_at, serverNow)}</span>
              <span className={styles.requestName}>{(request.profile.name || "Professional").split(" ")[0]}</span>
            </button>)}
          </div>
          {inbox.data && !requests.length && <p className={styles.empty}>New Hi requests will appear here. Each has five days to respond.</p>}
          {selected && <div className={styles.requestCard}>
            <MessageAvatar profile={selected.profile} />
            <div className={styles.person}><h3>{selected.profile.name}</h3><p>{[selected.profile.job_title, selected.profile.city || selected.profile.location].filter(Boolean).join(" · ")}</p><p>Sent you a Hi</p></div>
            <button type="button" className={styles.textButton} disabled={busy} onClick={(event) => setPreview({ profile: selected.profile, opener: event.currentTarget })}>View profile</button>
            <div className={styles.requestActions}><button type="button" className={styles.passButton} disabled={busy} onClick={() => void respond("pass")}>Pass</button>
              <button type="button" className={styles.acceptButton} disabled={busy} onClick={() => void respond("hi")}>{busy ? "Saving…" : "Say Hi back"}</button></div>
          </div>}
          {actionError && <p className={styles.error} role="alert">{actionError}</p>}
          <p className={styles.srOnly} role="status">{notice}</p>
        </section>
        <section className={styles.chatsSection} aria-labelledby="chats-title">
          <div className={styles.sectionHeading}><h2 id="chats-title">Chats</h2><span className={styles.count} aria-label="Unread messages">{conversations.reduce((total, conversation) => total + conversation.unread_count, 0)}</span></div>
          <label className={styles.search}><MessageIcon name="search" /><span className={styles.srOnly}>Search conversations by name</span><input type="search" placeholder="Search conversations…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          {!inbox.data && !inbox.error && <p className={styles.empty} role="status">Loading your messages…</p>}
          {inbox.error && <div className={styles.error} role="alert">{inbox.error}<button type="button" onClick={() => void inbox.refresh()}>Try again</button></div>}
          <ul className={styles.conversations}>{filtered.map((conversation) => <li key={conversation.id}>
            <Link href={`/home/messages/${conversation.id}`} className={`${styles.conversation} ${active?.id === conversation.id ? styles.selectedConversation : ""}`} aria-current={conversationId === conversation.id ? "page" : undefined}>
              <MessageAvatar profile={conversation.profile} />
              <div className={styles.conversationText}><strong>{conversation.profile.name}</strong><p>{conversation.last_message ? `${conversation.last_message.sender_id === context.publicUserId ? "You: " : ""}${conversation.last_message.body}` : "You both said Hi. Start a conversation."}</p></div>
              <div className={styles.conversationMeta}><time dateTime={conversation.activity_at}>{activityTime(conversation.activity_at)}</time>{conversation.unread_count > 0 && <span className={styles.unread} aria-label={`${conversation.unread_count} unread messages`}>{conversation.unread_count}</span>}</div>
            </Link>
          </li>)}</ul>
          {inbox.data && !filtered.length && <div className={styles.empty}><p>{query ? "No conversations match that name." : "Your conversations start when you both say Hi."}</p>{!query && <Link href="/home/discover">Find people to connect with</Link>}</div>}
        </section>
      </aside>
      <div className={styles.threadPane}>{active ? <MessageThread key={active.id} conversation={active} authUserId={context.authUserId} publicUserId={context.publicUserId} onRefresh={inbox.refresh}
        onProfile={(opener) => setPreview({ profile: active.profile, opener })} />
        : <section className={styles.noConversation}><MessageIcon name="chat" size={44} /><h2>{conversationId && inbox.data ? "Conversation unavailable" : "A conversation starts with a Hi"}</h2><p>{conversationId && inbox.data ? "This chat may have ended or may not belong to your account." : "Accept a Hi request or choose a chat to get started."}</p><Link href="/home/messages" className={styles.backButton}>Back to messages</Link></section>}</div>
    </div>
    {preview && <DiscoveryProfileOverlay preview={cardProfile(preview.profile)} returnFocusTo={preview.opener} onClose={() => setPreview(null)} />}
  </div>;
}

export function MessagesExperience({ conversationId }: { conversationId?: string }) {
  const account = useCurrentProfile();
  if (account.context && account.status !== "guest") return <Inbox key={account.context.authUserId} context={account.context} conversationId={conversationId} />;
  const loading = account.status === "loading";
  return <section className={styles.accessState} aria-busy={loading}><MessageIcon name="chat" size={42} />
    <h1>{loading ? "Loading your messages…" : account.status === "guest" ? "Your next conversation starts here" : "Messages are unavailable"}</h1>
    <p role={account.error ? "alert" : "status"}>{account.error || (loading ? "Checking your account." : "Log in to respond to Hi requests and chat with your connections.")}</p>
    {!loading && (account.status === "guest" ? <Link href="/" className="btn btn-primary">Go to log in</Link> : <button type="button" className="btn btn-primary" onClick={() => void refreshCurrentProfile()}>Try again</button>)}
  </section>;
}
