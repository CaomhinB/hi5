import {
  AVAILABILITY_OPTIONS, createDefaultMeetingPreferences, DURATION_OPTIONS,
  LOCATION_PREFERENCES, MAX_PREFERENCE_CHARACTERS, MEETING_METHODS, TRAVEL_RADII,
  validateMeetingPreferences,
} from "./meetingOptions";
import type { MeetingPreferences } from "./meetingOptions";

export const MEETING_PREFERENCES_STORAGE_KEY = "hi5.meeting-preferences.v1";
const CHANGED_EVENT = "hi5:meeting-preferences-changed";

function isOption<T>(value: unknown, options: readonly T[]): value is T {
  return options.includes(value as T);
}

function selectedOptions<T extends string>(value: unknown, options: readonly T[], fallback: T[]): T[] {
  if (!Array.isArray(value)) return [...fallback];
  return [...new Set(value.filter((item): item is T => isOption(item, options)))];
}

export function parseMeetingPreferences(raw: string | null): MeetingPreferences {
  const defaults = createDefaultMeetingPreferences();
  if (!raw) return defaults;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaults;
    const value = parsed as Record<string, unknown>;
    const locationPreference = isOption(value.locationPreference, LOCATION_PREFERENCES.map((option) => option.id))
      ? value.locationPreference : defaults.locationPreference;
    const travelRadius = value.travelRadius === null || isOption(value.travelRadius, TRAVEL_RADII)
      ? value.travelRadius : defaults.travelRadius;
    return {
      meetingMethods: selectedOptions(value.meetingMethods, MEETING_METHODS.map((option) => option.id), defaults.meetingMethods),
      locationPreference,
      travelRadius: locationPreference === "remote" ? null : travelRadius,
      availability: selectedOptions(value.availability, AVAILABILITY_OPTIONS.map((option) => option.id), defaults.availability),
      preferredDuration: isOption(value.preferredDuration, DURATION_OPTIONS.map((option) => option.id))
        ? value.preferredDuration : defaults.preferredDuration,
      additionalPreferences: typeof value.additionalPreferences === "string"
        ? value.additionalPreferences.slice(0, MAX_PREFERENCE_CHARACTERS) : "",
    };
  } catch {
    return defaults;
  }
}

export function getMeetingPreferencesSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(MEETING_PREFERENCES_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function subscribeToMeetingPreferences(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === MEETING_PREFERENCES_STORAGE_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGED_EVENT, callback);
  };
}

export function readMeetingPreferences(): MeetingPreferences {
  return parseMeetingPreferences(getMeetingPreferencesSnapshot());
}

export function saveMeetingPreferences(preferences: MeetingPreferences) {
  const error = validateMeetingPreferences(preferences);
  if (error) throw new Error(error);
  const normalized = parseMeetingPreferences(JSON.stringify(preferences));
  window.localStorage.setItem(MEETING_PREFERENCES_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}
