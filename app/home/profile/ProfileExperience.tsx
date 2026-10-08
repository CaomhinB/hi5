"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { refreshCurrentProfile, useCurrentProfile } from "../../lib/supabase/currentProfile";
import { profilePhotoUrl } from "../../onboarding/onboardingApi";
import { isProfileComplete, uniqueLabels } from "../../onboarding/profileModel";
import type { ProfileSection } from "../../onboarding/profileModel";
import styles from "./Profile.module.css";

export function ProfileAccessState({ state }: { state: ReturnType<typeof useCurrentProfile> }) {
  const guest = state.status === "guest";
  const loading = state.status === "loading";
  const missing = !!state.context && !state.context.profile;
  return <section className={`${styles.page} ${styles.status}`} aria-labelledby="profile-title" aria-busy={loading}>
    <div className={`glass glass-strong ${styles.card}`}>
      <h1 id="profile-title">{guest ? "Log in to see your profile" : loading ? "Loading your profile…" : missing ? "Let’s build your Hi5" : "Your profile is unavailable"}</h1>
      <p role={state.error ? "alert" : "status"}>{guest ? "Your photo and details will appear here once you’re signed in." : loading ? "Getting your details ready." : missing ? "Complete your profile setup to add your details and photo." : state.error}</p>
      {!loading && <div className={styles.statusActions}>
        {guest ? <Link href="/" className="btn btn-primary">Go to log in</Link> : missing ? <Link href="/onboarding" className="btn btn-primary">Complete my profile</Link>
          : <button type="button" className="btn btn-primary" onClick={() => void refreshCurrentProfile()}>Try again</button>}
        <Link href="/home/discover" className="btn btn-glass">Back to Discover</Link>
      </div>}
    </div>
  </section>;
}

function Detail({ label, value, wide = false }: { label: string; value: ReactNode; wide?: boolean }) {
  return <div className={wide ? styles.wide : undefined}><dt>{label}</dt><dd>{value ?? <span className={styles.empty}>Not added</span>}</dd></div>;
}

function Tags({ values }: { values: (string | null)[] | null }) {
  const labels = uniqueLabels(values);
  return labels.length ? <ul className={styles.tags}>{labels.map((label) => <li key={label}>{label}</li>)}</ul> : <span className={styles.empty}>Not added</span>;
}

function ProfileSectionCard({ section, title, children }: { section: ProfileSection; title: string; children: ReactNode }) {
  return <section className={`glass ${styles.card}`} aria-labelledby={`profile-${section}-title`}>
    <header className={styles.sectionHeader}>
      <h2 id={`profile-${section}-title`}>{title}</h2>
      <Link href={`/home/profile/edit?section=${section}`} className={styles.editLink} aria-label={`Edit ${title.toLowerCase()}`}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z" /></svg>
        Edit
      </Link>
    </header>
    <dl className={styles.details}>{children}</dl>
  </section>;
}

function WorkLink({ value }: { value: string | null }) {
  if (!value?.trim()) return <span className={styles.empty}>Not added</span>;
  let href: string | null = null;
  try {
    const url = new URL(value);
    if (["http:", "https:"].includes(url.protocol)) href = url.href;
  } catch { /* Display legacy values as text when they aren't safe web links. */ }
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className={styles.workLink}>{value}<span className={styles.srOnly}> (opens in a new tab)</span></a> : <span>{value}</span>;
}

function StoredDate({ value }: { value?: string | null }) {
  if (!value) return <span className={styles.empty}>Not added</span>;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span>{value}</span>;
  return <time dateTime={value}>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(date)}</time>;
}

export function ProfileExperience() {
  const state = useCurrentProfile();
  const [failedImage, setFailedImage] = useState("");
  const context = state.context;
  const profile = context?.profile;
  if (!profile || !context) return <ProfileAccessState state={state} />;
  const image = context.photoExists && profile.image_path ? profilePhotoUrl(profile.image_path) : "";
  const imageKey = `${context.authUserId}:${image}:${profile.updated_at ?? ""}`;
  const initials = (profile.name || "Hi").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const complete = isProfileComplete(profile, context.photoExists);

  return <section className={styles.page} aria-labelledby="profile-title">
    <header className={styles.pageHeader}><h1 id="profile-title">My profile</h1><p>Your story. Your next connection.</p></header>
    {state.error && <div className={styles.notice} role="alert"><p>{state.error}</p><button type="button" onClick={() => void refreshCurrentProfile()}>Try again</button></div>}
    <div className={`glass glass-strong ${styles.hero}`}>
      <div className={styles.portrait}>
        {image && failedImage !== imageKey ? <Image key={imageKey} src={image} alt={`${profile.name || "Your"} profile photo`} fill sizes="(max-width: 480px) 100px, 132px" onError={() => setFailedImage(imageKey)} /> : <span aria-hidden="true">{initials}</span>}
      </div>
      <div className={styles.heroText}>
        <span className={styles.kicker}>Your Hi5 card</span>
        <h2>{profile.name || "Your name"}</h2>
        <p>{[profile.job_title, profile.organisation].filter(Boolean).join(" · ") || "Add your work details"}</p>
        {profile.location && <small>{profile.location}</small>}
        <Link href="/home/profile/edit?section=photo" className={styles.photoLink}>Change photo</Link>
      </div>
    </div>
    {!complete && <div className={styles.notice}><p>Add the missing details to complete your profile.</p><Link href="/onboarding">Complete setup →</Link></div>}
    <ProfileSectionCard section="about" title="About you">
      <Detail label="Name" value={profile.name || null} />
      <Detail label="Age" value={profile.age == null ? null : `${profile.age} years old`} />
      <Detail label="Location" value={profile.location || null} wide />
      <Detail label="Bio" value={profile.bio || null} wide />
    </ProfileSectionCard>
    <ProfileSectionCard section="work" title="Your work">
      <Detail label="Role / Profession" value={profile.job_title || null} />
      <Detail label="Organisation" value={profile.organisation || null} />
      <Detail label="Experience" value={profile.experience == null ? null : `${profile.experience} ${profile.experience === 1 ? "year" : "years"}`} wide />
      <Detail label="Industries" value={<Tags values={profile.industries} />} wide />
    </ProfileSectionCard>
    <ProfileSectionCard section="skills" title="Skills & interests">
      <Detail label="Skills" value={<Tags values={profile.skills} />} wide />
      <Detail label="Interests" value={<Tags values={profile.interests} />} wide />
      <Detail label="Current projects" value={profile.current_projects || null} wide />
    </ProfileSectionCard>
    <ProfileSectionCard section="photo" title="Photo & links">
      <Detail label="Profile photo" value={image ? "Added" : "Not added"} wide />
      <Detail label="Portfolio / Website" value={<WorkLink value={profile.portfolio_url} />} wide />
      <Detail label="LinkedIn" value={<WorkLink value={profile.linkedin_url} />} wide />
      <Detail label="GitHub" value={<WorkLink value={profile.github_url} />} wide />
    </ProfileSectionCard>
    <details className={`glass ${styles.card} ${styles.record}`}>
      <summary>Profile record details</summary>
      <p className={styles.recordHint}>These details are managed automatically.</p>
      <dl className={styles.details}>
        <Detail label="Profile ID" value={<code>{profile.id}</code>} wide />
        <Detail label="Image path" value={profile.image_path ? <code>{profile.image_path}</code> : null} wide />
        <Detail label="Created" value={<StoredDate value={profile.created_at} />} />
        <Detail label="Last updated" value={<StoredDate value={profile.updated_at} />} />
      </dl>
    </details>
  </section>;
}
