"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { refreshCurrentProfile, useCurrentProfile } from "../../lib/supabase/currentProfile";
import { MeetIcon } from "./MeetIcon";
import {
  AVAILABILITY_OPTIONS, createDefaultMeetingPreferences, DURATION_OPTIONS,
  LOCATION_PREFERENCES, MAX_PREFERENCE_CHARACTERS, MEETING_METHODS, TRAVEL_RADII,
  validateMeetingPreferences,
} from "./meetingOptions";
import type { MeetingPreferences, TravelRadius } from "./meetingOptions";
import { useMeetingPreferences } from "./useMeetingPreferences";
import styles from "./Meet.module.css";

function RadioChoices<T extends string>({ name, options, value, onChange, columns }: {
  name: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  columns: number;
}) {
  return (
    <div className={styles.radioChoices} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <label key={option.id} className={styles.radioChoice}>
          <input className={styles.nativeControl} type="radio" name={name} value={option.id}
            checked={value === option.id} onChange={() => onChange(option.id)} />
          <span className={styles.radioMark} aria-hidden="true" /><span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function MeetingPreferencesForm() {
  const account = useCurrentProfile();
  if (!account.context) {
    const guest = account.status === "guest";
    return <div className={styles.form}>
      <div className={styles.sections}><section className={`${styles.card} ${styles.loadState}`} aria-busy={account.status === "loading"}>
        <h2 className={styles.sectionTitle}>{guest ? "Log in to save your preferences" : account.error ? "Your account is unavailable" : "Getting your preferences ready…"}</h2>
        <p className={styles.description}>{guest ? "Meeting preferences are stored on your own Hi5 profile." : account.error || "Loading your profile."}</p>
        {guest ? <Link href="/" className="btn btn-primary">Go to log in</Link>
          : account.error && <button type="button" className="btn btn-glass" onClick={() => void refreshCurrentProfile()}>Try again</button>}
      </section></div>
    </div>;
  }
  return <ProfileMeetingPreferencesForm key={`${account.context.authUserId}:${account.context.publicUserId}`}
    authUserId={account.context.authUserId} profileId={account.context.publicUserId} />;
}

function ProfileMeetingPreferencesForm({ authUserId, profileId }: { authUserId: string; profileId: string }) {
  const stored = useMeetingPreferences(authUserId, profileId);
  const [draft, setDraft] = useState<MeetingPreferences | null>(null);
  const [lastTravelRadius, setLastTravelRadius] = useState<TravelRadius | undefined>(undefined);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [methodError, setMethodError] = useState(false);
  const methodsRef = useRef<HTMLFieldSetElement>(null);
  const preferences = draft ?? stored.preferences;
  const hasTravel = preferences.locationPreference !== "remote";
  const disabled = stored.isLoading || stored.isSaving || !!stored.loadError;

  function update(patch: Partial<MeetingPreferences>) {
    setDraft({ ...preferences, ...patch });
    setSuccess(false);
    setError("");
    setMethodError(false);
  }

  async function save() {
    if (disabled) return;
    const validationError = validateMeetingPreferences(preferences);
    setSuccess(false);
    if (validationError) {
      setError(validationError);
      const missingMethod = preferences.meetingMethods.length === 0;
      setMethodError(missingMethod);
      if (missingMethod) {
        methodsRef.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
        methodsRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      }
      return;
    }
    try {
      const result = await stored.save(preferences);
      if (!result) return;
      setDraft(result);
      setError("");
      setMethodError(false);
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your preferences couldn’t be saved. Please try again.");
      setMethodError(false);
    }
  }

  return (
    <form className={styles.form} aria-label="Meeting preferences" aria-busy={stored.isLoading || stored.isSaving}
      noValidate onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <div className={styles.sections} data-meet-scroll>
        {stored.isLoading ? <p className={styles.loadMessage} role="status">Loading your meeting preferences…</p>
          : stored.loadError ? <div className={styles.loadMessage} role="alert"><p>{stored.loadError}</p><button type="button" className="btn btn-glass" onClick={stored.retry}>Try again</button></div>
            : !stored.hasRecord && <p className={styles.loadMessage}>You haven’t set meeting preferences yet. Choose your options and save them to your profile.</p>}
        <fieldset ref={methodsRef} className={styles.card} aria-labelledby="meet-methods-title"
          disabled={disabled}
          aria-describedby={methodError ? "meet-methods-description meet-method-error" : "meet-methods-description"}>
          <legend className={styles.srOnly}>How would you like to meet?</legend>
          <h2 id="meet-methods-title" className={styles.sectionTitle}><MeetIcon name="coffee" />How would you like to meet?</h2>
          <p id="meet-methods-description" className={styles.description}>Select all that apply.</p>
          <div className={styles.methodChoices}>
            {MEETING_METHODS.map((option) => (
              <label key={option.id} className={styles.methodChoice}>
                <input className={styles.nativeControl} type="checkbox" name="meetingMethods" value={option.id}
                  checked={preferences.meetingMethods.includes(option.id)} aria-invalid={methodError || undefined}
                  aria-describedby={methodError ? "meet-method-error" : undefined}
                  onChange={(event) => update({ meetingMethods: event.target.checked
                    ? [...preferences.meetingMethods, option.id]
                    : preferences.meetingMethods.filter((id) => id !== option.id) })} />
                <span className={styles.methodIcon}><MeetIcon name={option.icon} size={21} /></span>
                <span className={styles.methodLabel}>{option.label}</span>
                <span className={styles.checkMark} aria-hidden="true"><MeetIcon name="check" size={14} /></span>
              </label>
            ))}
          </div>
          {methodError && <p id="meet-method-error" className={styles.fieldError} role="alert">{error}</p>}
        </fieldset>

        <fieldset disabled={disabled} className={styles.card} aria-labelledby="meet-location-title" aria-describedby="meet-location-description">
          <legend className={styles.srOnly}>Location preference</legend>
          <h2 id="meet-location-title" className={styles.sectionTitle}><MeetIcon name="location" />Location preference</h2>
          <p id="meet-location-description" className={styles.description}>Where are you comfortable meeting?</p>
          <RadioChoices name="locationPreference" options={LOCATION_PREFERENCES} value={preferences.locationPreference} columns={3}
            onChange={(locationPreference) => {
              if (locationPreference === "remote") {
                if (hasTravel) setLastTravelRadius(preferences.travelRadius);
                update({ locationPreference, travelRadius: null });
              } else {
                update({ locationPreference, travelRadius: hasTravel ? preferences.travelRadius
                  : lastTravelRadius !== undefined ? lastTravelRadius : 25 });
              }
            }} />
          <div className={styles.travelDisclosure} data-expanded={hasTravel ? "true" : "false"}
            aria-hidden={!hasTravel} inert={!hasTravel}>
            <div className={styles.travelInner}>
              <label htmlFor="meet-travel-radius" className={styles.inputLabel}>Willing to travel</label>
              <div className={styles.selectField}>
                <select id="meet-travel-radius" name="travelRadius" className={styles.travelSelect} disabled={!hasTravel}
                  value={hasTravel ? preferences.travelRadius ?? "anywhere" : lastTravelRadius ?? "anywhere"}
                  onChange={(event) => {
                    const travelRadius = event.target.value === "anywhere" ? null
                      : TRAVEL_RADII.find((radius) => radius === Number(event.target.value)) ?? 25;
                    setLastTravelRadius(travelRadius);
                    update({ travelRadius });
                  }}>
                  {TRAVEL_RADII.map((radius) => <option key={radius} value={radius}>Within {radius} km</option>)}
                  <option value="anywhere">Anywhere</option>
                </select>
                <MeetIcon name="chevron" size={17} />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset disabled={disabled} className={styles.card} aria-labelledby="meet-availability-title" aria-describedby="meet-availability-description">
          <legend className={styles.srOnly}>General availability</legend>
          <h2 id="meet-availability-title" className={styles.sectionTitle}><MeetIcon name="calendar" />General availability</h2>
          <p id="meet-availability-description" className={styles.description}>When are you usually free?</p>
          <div className={styles.availabilityChoices}>
            {AVAILABILITY_OPTIONS.map((option) => (
              <label key={option.id} className={styles.availabilityChoice}>
                <input className={styles.nativeControl} type="checkbox" name="availability" value={option.id}
                  checked={preferences.availability.includes(option.id)} onChange={(event) => update({ availability: event.target.checked
                    ? [...preferences.availability, option.id]
                    : preferences.availability.filter((id) => id !== option.id) })} />
                <span className={styles.pillCheck} aria-hidden="true"><MeetIcon name="check" size={13} /></span>
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset disabled={disabled} className={styles.card} aria-labelledby="meet-duration-title">
          <legend className={styles.srOnly}>Preferred meeting duration</legend>
          <h2 id="meet-duration-title" className={styles.sectionTitle}><MeetIcon name="clock" />Preferred meeting duration</h2>
          <RadioChoices name="preferredDuration" options={DURATION_OPTIONS} value={preferences.preferredDuration} columns={2}
            onChange={(preferredDuration) => update({ preferredDuration })} />
        </fieldset>

        <section className={styles.card} aria-labelledby="meet-notes-title">
          <h2 id="meet-notes-title" className={styles.sectionTitle}><MeetIcon name="notes" />
            <label htmlFor="meet-additional-preferences">Additional preferences <span className={styles.optional}>(optional)</span></label>
          </h2>
          <textarea id="meet-additional-preferences" name="additionalPreferences" className={styles.notes}
            disabled={disabled}
            rows={4} maxLength={MAX_PREFERENCE_CHARACTERS} aria-describedby="meet-notes-counter"
            placeholder="e.g. Happy to meet for coffee in Brighton city centre, or have a video call after work."
            value={preferences.additionalPreferences} onChange={(event) => update({ additionalPreferences: event.target.value.slice(0, MAX_PREFERENCE_CHARACTERS) })} />
          <p id="meet-notes-counter" className={styles.characterCounter}>{preferences.additionalPreferences.length}/{MAX_PREFERENCE_CHARACTERS} characters</p>
        </section>
      </div>

      <div className={styles.actions}>
        <button type="submit" disabled={disabled} className={`btn btn-primary ${styles.saveButton}`}>{stored.isSaving ? "Saving…" : "Save preferences"}</button>
        <button type="button" disabled={disabled} className={styles.resetButton} onClick={() => {
          setDraft(createDefaultMeetingPreferences());
          setLastTravelRadius(25);
          setSuccess(false);
          setError("");
          setMethodError(false);
        }}><MeetIcon name="reset" size={16} />Reset to defaults</button>
        <div className={styles.feedback}>
          {success && <p className={styles.successMessage} role="status"><MeetIcon name="check" size={17} />Meeting preferences saved successfully.</p>}
          {error && !methodError && <p className={styles.saveError} role="alert">{error}</p>}
        </div>
      </div>
    </form>
  );
}
