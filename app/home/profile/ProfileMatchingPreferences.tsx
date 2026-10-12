"use client";

import { useEffect, useRef, useState } from "react";
import { publishCurrentProfile } from "../../lib/supabase/currentProfile";
import type { OnboardingContext } from "../../onboarding/onboardingApi";
import { matchingDraft, matchingLabels, MATCHING_OPEN_OPTIONS, MATCHING_ROLE_OPTIONS, MATCHING_WORK_OPTIONS } from "./profileMatchingModel";
import type { MatchingDraft } from "./profileMatchingModel";
import { saveMatchingProfile } from "./profileMatchingApi";
import profileStyles from "./Profile.module.css";
import styles from "./ProfileMatching.module.css";

export function ProfileMatchingPreferences({ context }: { context: OnboardingContext }) {
  const [draft, setDraft] = useState<MatchingDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  if (!context.profile) return null;
  const labels = matchingLabels(context.profile);

  async function save() {
    if (!draft || request.current) return;
    const controller = new AbortController(); request.current = controller; setSaving(true); setError(null);
    try {
      const profile = await saveMatchingProfile(context, draft, controller.signal);
      if (controller.signal.aborted) return;
      publishCurrentProfile({ ...context, profile });
      setDraft(null);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Your changes couldn’t be saved.");
    } finally {
      if (request.current === controller) { request.current = null; setSaving(false); }
    }
  }

  return <section className={`glass ${profileStyles.card}`} aria-labelledby="profile-networking-title">
    <header className={profileStyles.sectionHeader}><h2 id="profile-networking-title">Networking preferences</h2>
      {!draft && <button type="button" className={profileStyles.editLink} onClick={() => { setDraft(matchingDraft(context.profile!)); setError(null); }}>Edit</button>}
    </header>
    <p className={styles.help}>Tell others how you’d like to connect. Your city also helps Hi5 find nearby people.</p>
    {draft ? <form onSubmit={(event) => { event.preventDefault(); void save(); }} aria-busy={saving}>
      <fieldset className={styles.fields} disabled={saving}>
        <label>City<input value={draft.city} maxLength={100} autoComplete="address-level2" placeholder="e.g. London"
          onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></label>
        <label>Connect with me as<select value={draft.networking_role} onChange={(event) => setDraft({ ...draft, networking_role: event.target.value as MatchingDraft["networking_role"] })}>
          {MATCHING_ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select></label>
        <label>Work arrangement<select value={draft.work_arrangement} onChange={(event) => setDraft({ ...draft, work_arrangement: event.target.value as MatchingDraft["work_arrangement"] })}>
          {MATCHING_WORK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select></label>
        <label>Open to<select value={draft.open_to} onChange={(event) => setDraft({ ...draft, open_to: event.target.value as MatchingDraft["open_to"] })}>
          {MATCHING_OPEN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select></label>
      </fieldset>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}>
        <button type="button" className="btn btn-glass" disabled={saving} onClick={() => { setDraft(null); setError(null); }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </form> : <dl className={profileStyles.details}>
      {[['City', labels.city], ['Connect with me as', labels.role], ['Work arrangement', labels.work], ['Open to', labels.open]].map(([label, value]) =>
        <div key={label}><dt>{label}</dt><dd>{value || <span className={profileStyles.empty}>Not added</span>}</dd></div>)}
    </dl>}
  </section>;
}
