"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { DiscoveryIcon } from "./DiscoveryIcon";
import type { DiscoveryProfile } from "./discoveryProfile";
import { fetchDiscoveryProfileDetails } from "./discoveryProfilesApi";
import type { DiscoveryProfileDetails } from "./discoveryProfilesApi";
import { uniqueLabels } from "../../onboarding/profileModel";
import { loadProfileMeetingPreferences } from "../meet/meetingPreferencesApi";
import { profileMeetingPreferencesDetails } from "../meet/meetingPreferencesModel";
import type { ProfileMeetingPreferencesRecord } from "../meet/meetingPreferencesModel";
import styles from "./DiscoveryProfileOverlay.module.css";

function Detail({ label, value, wide = false }: { label: string; value: ReactNode; wide?: boolean }) {
  return <div className={wide ? styles.wide : undefined}><dt>{label}</dt><dd>{value ?? <span className={styles.empty}>Not added</span>}</dd></div>;
}

function Tags({ values }: { values: (string | null)[] | null }) {
  const labels = uniqueLabels(values);
  return labels.length ? <ul className={styles.tags}>{labels.map((label) => <li key={label}>{label}</li>)}</ul> : <span className={styles.empty}>Not added</span>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className={`glass ${styles.section}`} aria-label={title}><h3>{title}</h3><dl className={styles.details}>{children}</dl></section>;
}

function WorkLink({ value }: { value: string | null }) {
  let href: string | null = null;
  if (value?.trim()) {
    try {
      const url = new URL(value);
      if (["http:", "https:"].includes(url.protocol)) href = url.href;
    } catch { /* Legacy non-URL values are displayed as text. */ }
  }
  if (!value?.trim()) return <span className={styles.empty}>Not added</span>;
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className={styles.workLink}>{value}<span className={styles.srOnly}> (opens in a new tab)</span></a> : <span>{value}</span>;
}

function ProfileDate({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return <span>{label} <time dateTime={value}>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Europe/London" }).format(date)}</time></span>;
}

export function DiscoveryProfileOverlay({ preview, returnFocusTo, onClose }: {
  preview: DiscoveryProfile; returnFocusTo: HTMLButtonElement; onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const motion = useRef<Animation | null>(null);
  const backdropPointer = useRef(false);
  const [details, setDetails] = useState<DiscoveryProfileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [meetingReload, setMeetingReload] = useState(0);
  const [meeting, setMeeting] = useState<{
    status: "loading" | "ready" | "error"; record: ProfileMeetingPreferencesRecord | null; error: string | null;
  }>({ status: "loading", record: null, error: null });
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);
  const [failedImage, setFailedImage] = useState<DiscoveryProfile["image"]>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    if (!dialog || !panel) return;
    const body = document.body;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const previousBodyStyles = {
      overflow: body.style.overflow, paddingRight: body.style.paddingRight,
      position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width,
    };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbarWidth}px`;
    // Fix the page in place: overflow alone doesn't reliably lock scrolling on iOS.
    Object.assign(body.style, { overflow: "hidden", position: "fixed", top: `${-scrollY}px`, left: `${-scrollX}px`, width: "100%" });
    const viewport = window.visualViewport;
    let viewportFrame = 0;
    function fitViewport() {
      if (!viewport || !dialog || Math.abs(viewport.scale - 1) > 0.01) return;
      dialog.style.setProperty("--profile-viewport-height", `${viewport.height}px`);
      dialog.style.setProperty("--profile-viewport-top", `${viewport.offsetTop}px`);
    }
    function scheduleViewportFit() {
      if (viewportFrame) return;
      viewportFrame = requestAnimationFrame(() => { viewportFrame = 0; fitViewport(); });
    }
    // Focus an untransformed, correctly sized panel before it starts moving.
    // Otherwise Safari can scroll the dialog to its offscreen close button.
    fitViewport();
    delete dialog.dataset.ready;
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    dialog.scrollTop = 0;
    const openingFrame = requestAnimationFrame(() => {
      if (motion.current || !dialog.isConnected) return;
      dialog.dataset.ready = "true";
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setEntered(true); return; }
      const animation = panel.animate([
        { transform: `translate3d(0, ${panel.getBoundingClientRect().height + 32}px, 0)` },
        { transform: "translate3d(0, 0, 0)" },
      ], { duration: 650, easing: "cubic-bezier(0.25, 0.1, 0.25, 1)" });
      motion.current = animation;
      void animation.finished.then(() => {
        if (motion.current === animation && dialog.isConnected) setEntered(true);
      }).catch(() => { /* Closing or unmounting cancels the entrance. */ });
    });
    viewport?.addEventListener("resize", scheduleViewportFit);
    viewport?.addEventListener("scroll", scheduleViewportFit);
    return () => {
      cancelAnimationFrame(openingFrame);
      cancelAnimationFrame(viewportFrame);
      viewport?.removeEventListener("resize", scheduleViewportFit);
      viewport?.removeEventListener("scroll", scheduleViewportFit);
      motion.current?.cancel(); motion.current = null;
      dialog.close();
      Object.assign(body.style, previousBodyStyles);
      // Explicitly restore the saved scroll position despite global smooth scrolling.
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
      if (returnFocusTo.isConnected) returnFocusTo.focus({ preventScroll: true });
    };
  }, [returnFocusTo]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    // Strict Mode's discarded mount never starts a request.
    queueMicrotask(() => {
      if (!active) return;
      void fetchDiscoveryProfileDetails(preview.id, controller.signal).then((loaded) => {
        if (active) { setDetails(loaded); setLoading(false); }
      }).catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "This profile couldn’t be loaded. Please try again.");
        setLoading(false);
      });
    });
    return () => { active = false; controller.abort(); };
  }, [preview.id, reload]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setMeeting({ status: "loading", record: null, error: null });
      void loadProfileMeetingPreferences(preview.id, controller.signal).then((record) => {
        if (active) setMeeting({ status: "ready", record, error: null });
      }).catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        setMeeting({ status: "error", record: null, error: cause instanceof Error ? cause.message : "Meeting preferences couldn’t be loaded. Please try again." });
      });
    });
    return () => { active = false; controller.abort(); };
  }, [preview.id, reload, meetingReload]);

  useEffect(() => {
    if (!closing) return;
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    if (dialog && panel) {
      // Continue from the current position even if Close interrupts the entrance.
      const transform = getComputedStyle(panel).transform;
      motion.current?.cancel();
      dialog.dataset.ready = "true";
      motion.current = panel.animate([
        { transform },
        { transform: `translate3d(0, ${panel.getBoundingClientRect().height + 32}px, 0)` },
      ], { duration: 280, easing: "ease-in", fill: "forwards" });
    }
    const timer = setTimeout(onClose, 300);
    return () => clearTimeout(timer);
  }, [closing, onClose]);

  function close() {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) onClose();
    else setClosing(true);
  }

  // Fetch while the sheet moves, but keep its contents stable until it settles.
  const shownDetails = entered ? details : null;
  const profile = shownDetails?.profile;
  const meetingDetails = meeting.record ? profileMeetingPreferencesDetails(meeting.record) : null;
  const name = profile?.name?.trim() || preview.name;
  const title = profile ? [profile.job_title, profile.organisation].filter(Boolean).join(" · ") : preview.professionalTitle;
  const image = shownDetails ? shownDetails.image : preview.image;
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return <dialog ref={dialogRef} id="discovery-full-profile" className={styles.overlay}
    aria-labelledby="discovery-detail-name discovery-detail-title" data-closing={closing ? "true" : undefined}
    data-entered={entered ? "true" : undefined}
    onCancel={(event) => { event.preventDefault(); close(); }}
    onPointerDown={(event) => { backdropPointer.current = event.target === event.currentTarget; }}
    onPointerUp={(event) => { if (backdropPointer.current && event.target === event.currentTarget) close(); backdropPointer.current = false; }}
    onPointerCancel={() => { backdropPointer.current = false; }}>
    <div ref={panelRef} className={styles.panel}>
      <header className={styles.header}>
        <span className={styles.grabHandle} aria-hidden="true" />
        <div className={styles.titleRow}>
          <h2 id="discovery-detail-title">Full profile</h2>
          <button ref={closeRef} type="button" className={styles.closeButton} aria-label="Close full profile" disabled={closing} onClick={close}><DiscoveryIcon name="close" size={20} /></button>
        </div>
      </header>
      <div className={styles.content} aria-busy={loading || !entered}>
        <div className={styles.hero}>
          <div className={styles.portrait}>
            {image && image !== failedImage ? <Image src={image} alt={`Portrait of ${name}`} fill sizes="(max-width: 480px) calc(100vw - 40px), 440px" onError={() => setFailedImage(image)} />
              : <span className={styles.initials} aria-label={`Profile photo placeholder for ${name}`}>{initials}</span>}
          </div>
          <div className={styles.heroText}>
            <h3 id="discovery-detail-name">{name}</h3>
            {title && <p>{title}</p>}
            <div className={styles.summary}>
              <span><DiscoveryIcon name="location" size={15} />{profile ? profile.location || "Location not added" : preview.location}</span>
              {profile?.experience != null && <span><DiscoveryIcon name="experience" size={16} />{profile.experience} {profile.experience === 1 ? "year" : "years"} experience</span>}
            </div>
          </div>
        </div>
        {(loading || !entered) && <p className={styles.status} role="status">Loading full profile…</p>}
        {error && entered && <div className={styles.error} role="alert"><p>{error}</p><button type="button" className="btn btn-glass" onClick={() => { setError(null); setLoading(true); setReload((value) => value + 1); }}>Try again</button></div>}
        {profile && <>
          <Section title="About">
            <Detail label="Bio" value={profile.bio || null} wide />
            <Detail label="Age" value={profile.age == null ? null : `${profile.age} years old`} />
            <Detail label="Location" value={profile.location || null} />
          </Section>
          <Section title="Work & experience">
            <Detail label="Role / Profession" value={profile.job_title || null} />
            <Detail label="Organisation" value={profile.organisation || null} />
            <Detail label="Experience" value={profile.experience == null ? null : `${profile.experience} ${profile.experience === 1 ? "year" : "years"}`} wide />
            <Detail label="Industries" value={<Tags values={profile.industries} />} wide />
          </Section>
          <Section title="Skills & interests">
            <Detail label="Skills" value={<Tags values={profile.skills} />} wide />
            <Detail label="Interests" value={<Tags values={profile.interests} />} wide />
          </Section>
          <Section title="Current projects"><Detail label="What they’re working on" value={profile.current_projects || null} wide /></Section>
          <Section title="Meeting preferences">
            {meeting.status === "loading" ? <Detail label="Status" value={<span role="status">Loading meeting preferences…</span>} wide />
              : meeting.status === "error" ? <Detail label="Status" value={<div className={styles.error} role="alert"><p>{meeting.error}</p>
                <button type="button" className="btn btn-glass" onClick={() => setMeetingReload((value) => value + 1)}>Try again</button></div>} wide />
                : meetingDetails ? <>
                  <Detail label="Ways to meet" value={<Tags values={meetingDetails.methods} />} wide />
                  <Detail label="Location preference" value={meetingDetails.location} />
                  <Detail label="Willing to travel" value={meetingDetails.travel} />
                  <Detail label="General availability" value={<Tags values={meetingDetails.availability} />} wide />
                  <Detail label="Preferred duration" value={meetingDetails.duration} wide />
                  <Detail label="Additional preferences" value={meetingDetails.notes} wide />
                </> : <Detail label="Status" value={<span className={styles.empty}>Meeting preferences not added yet.</span>} wide />}
          </Section>
          <Section title="Explore their work">
            <Detail label="Portfolio / Website" value={<WorkLink value={profile.portfolio_url} />} wide />
            <Detail label="LinkedIn" value={<WorkLink value={profile.linkedin_url} />} wide />
            <Detail label="GitHub" value={<WorkLink value={profile.github_url} />} wide />
          </Section>
          {(profile.created_at || profile.updated_at) && <p className={styles.dates}>
            <ProfileDate label="Joined Hi5" value={profile.created_at} />
            <ProfileDate label="Profile updated" value={profile.updated_at} />
          </p>}
        </>}
      </div>
      <footer className={styles.footer}><button type="button" className="btn btn-glass" disabled={closing} onClick={close}>Back to Discover</button></footer>
    </div>
  </dialog>;
}
