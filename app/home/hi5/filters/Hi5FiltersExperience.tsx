"use client";

import { useEffect, useRef, useState } from "react";
import { useCurrentProfile } from "../../../lib/supabase/currentProfile";
import type { OnboardingContext } from "../../../onboarding/onboardingApi";
import type { Filters } from "../../filters/filterOptions";
import { FiltersPanel } from "../../filters/FiltersPanel";
import { Hi5AccessState } from "../Hi5AccessState";
import { loadHi5Preferences, saveHi5Preferences } from "../hi5Api";
import { preferencesToFilters } from "../hi5Model";
import styles from "../Hi5.module.css";

export function Hi5FiltersExperience() {
  const state = useCurrentProfile();
  return state.context?.profile ? <LoadedFilters key={state.context.authUserId} context={state.context} />
    : <Hi5AccessState state={state} />;
}

function LoadedFilters({ context }: { context: OnboardingContext }) {
  const [initial, setInitial] = useState<Filters | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const saveRequest = useRef<AbortController | null>(null);
  const authUserId = context.authUserId, publicUserId = context.publicUserId;
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setError(null);
      void loadHi5Preferences({ authUserId, publicUserId }, controller.signal).then((preferences) => {
        if (!controller.signal.aborted) setInitial(preferencesToFilters(preferences));
      }).catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Your filters couldn’t be loaded.");
      });
    });
    return () => controller.abort();
  }, [authUserId, publicUserId, retry]);
  useEffect(() => () => saveRequest.current?.abort(), []);

  async function save(filters: Filters) {
    if (saveRequest.current) throw new Error("Your filters are already being saved.");
    const controller = new AbortController(); saveRequest.current = controller; setSaving(true);
    try { await saveHi5Preferences(context, filters, controller.signal); }
    finally { if (saveRequest.current === controller) { saveRequest.current = null; setSaving(false); } }
  }

  if (!initial) return <div className={styles.message} aria-busy={!error}>
    <h2>{error ? "Preferences unavailable" : "Loading Hi5 preferences…"}</h2>
    {error && <><p role="alert">{error}</p><button type="button" className="btn btn-primary" onClick={() => setRetry((value) => value + 1)}>Try again</button></>}
  </div>;
  return <FiltersPanel mode="hi5" returnTo="/home/hi5" initialFilters={initial} onApply={save} saving={saving} city={context.profile?.city} />;
}
