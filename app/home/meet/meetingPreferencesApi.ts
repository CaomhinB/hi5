"use client";

import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import { createDefaultMeetingPreferences, validateMeetingPreferences } from "./meetingOptions";
import type { MeetingPreferences } from "./meetingOptions";
import { parseMeetingPreferences } from "./meetingStorage";
import { LOCATION_VALUES, MEETING_TYPE_VALUES, PROFILE_MEETING_COLUMNS } from "./meetingPreferencesModel";
import type { ProfileMeetingPreferencesRecord } from "./meetingPreferencesModel";

const COLUMNS = `${PROFILE_MEETING_COLUMNS},created_at,updated_at`;

export interface MeetingPreferencesOwner { authUserId: string; profileId: string; }

interface MeetingPreferencesRecord extends ProfileMeetingPreferencesRecord {
  created_at: string;
  updated_at: string;
}

export interface StoredMeetingPreferences { preferences: MeetingPreferences; hasRecord: boolean; }

function fromRecord(record: MeetingPreferencesRecord): MeetingPreferences {
  // This pure parser accepts explicit data; it never reads old browser preferences.
  return parseMeetingPreferences(JSON.stringify({
    meetingMethods: record.meeting_types?.map((stored) => Object.entries(MEETING_TYPE_VALUES).find(([, value]) => value === stored)?.[0] ?? stored),
    locationPreference: Object.entries(LOCATION_VALUES).find(([, value]) => value === record.location_preference)?.[0] ?? record.location_preference,
    travelRadius: record.travel_radius, availability: record.availability,
    preferredDuration: record.preferred_duration, additionalPreferences: record.additional_preferences,
  }));
}

const VALIDATION_MESSAGES: Record<string, string> = {
  "Choose at least one valid meeting type.": "Choose at least one of the listed meeting methods.",
  "Choose a valid meeting location preference.": "Choose In person only, Remote only or Both.",
  "Choose a valid travel distance.": "Choose a listed travel distance or Anywhere.",
  "Remote meetings cannot have a travel distance.": "Remote-only meetings cannot include a travel distance. Please select your location preference again.",
  "Choose valid meeting availability.": "Choose availability from the listed options.",
  "Choose a valid meeting duration.": "Choose one of the listed meeting durations.",
  "Keep additional preferences within 300 characters.": "Keep additional preferences within 300 characters.",
  "A meeting preferences record cannot be moved to another profile.": "Your signed-in account changed. Please reopen Meet.",
};

function databaseError(error: { code: string; message: string }): Error {
  const { code, message } = error;
  if (["PGRST204", "PGRST205", "42703", "42P01", "42P10"].includes(code)) {
    return new Error("Meeting preferences aren’t configured yet. Please try again later.");
  }
  if (code === "42501") return new Error("Meeting preferences aren’t available for your account yet. Please try again later.");
  if (code === "23503") return new Error("Please complete your profile setup before saving meeting preferences.");
  if (code === "23514") {
    const constraint = message.match(/check constraint "([^"]+)"/)?.[1];
    const validationMessage = VALIDATION_MESSAGES[message];
    // Keep support diagnostics specific without logging row contents or profile IDs.
    console.error("[Meet] Database validation rejected the save", {
      code, constraint: constraint ?? null, rule: validationMessage ? message : null,
    });
    return new Error(validationMessage ?? "These meeting choices aren’t supported by the current setup. Your changes haven’t been saved.", { cause: error });
  }
  return new Error("Your meeting preferences couldn’t be loaded or saved. Please check your connection and try again.");
}

async function ownerClient(owner: MeetingPreferencesOwner, signal: AbortSignal) {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client.auth.getSession();
  signal.throwIfAborted();
  if (error || !data.session) throw new Error("Please log in to save your meeting preferences.");
  if (data.session.user.id !== owner.authUserId) throw new Error("Your signed-in account changed. Please reopen Meet.");
  const { data: user, error: userError } = await client.from("users").select("id")
    .eq("auth_user_id", owner.authUserId).abortSignal(signal).maybeSingle<{ id: string }>();
  signal.throwIfAborted();
  if (userError || user?.id !== owner.profileId) throw new Error("Your profile couldn’t be identified. Please reopen Meet and try again.");
  return client;
}

/** Read one visible profile's saved preferences without requiring ownership. */
export async function loadProfileMeetingPreferences(profileId: string, signal: AbortSignal): Promise<ProfileMeetingPreferencesRecord | null> {
  signal.throwIfAborted();
  const { data, error } = await getSupabaseBrowserClient().from("meeting_preferences").select(PROFILE_MEETING_COLUMNS)
    .eq("user_profile_id", profileId).abortSignal(signal).maybeSingle<ProfileMeetingPreferencesRecord>();
  signal.throwIfAborted();
  if (error) throw new Error("Meeting preferences couldn’t be loaded. Please try again.", { cause: error });
  if (data && data.user_profile_id !== profileId) throw new Error("Meeting preferences couldn’t be identified. Please try again.");
  return data;
}

export async function loadMeetingPreferences(owner: MeetingPreferencesOwner, signal: AbortSignal): Promise<StoredMeetingPreferences> {
  const client = await ownerClient(owner, signal);
  const { data, error } = await client.from("meeting_preferences").select(COLUMNS)
    .eq("user_profile_id", owner.profileId).abortSignal(signal).maybeSingle<MeetingPreferencesRecord>();
  signal.throwIfAborted();
  if (error) throw databaseError(error);
  if (!data) return { preferences: createDefaultMeetingPreferences(), hasRecord: false };
  if (data.user_profile_id !== owner.profileId) throw new Error("Your meeting preferences couldn’t be identified. Please reopen Meet.");
  return { preferences: fromRecord(data), hasRecord: true };
}

export async function storeMeetingPreferences(
  owner: MeetingPreferencesOwner, preferences: MeetingPreferences, signal: AbortSignal,
): Promise<StoredMeetingPreferences> {
  const invalid = validateMeetingPreferences(preferences);
  if (invalid) throw new Error(invalid);
  const client = await ownerClient(owner, signal);
  const { data, error } = await client.from("meeting_preferences").upsert({
    user_profile_id: owner.profileId,
    meeting_types: [...new Set(preferences.meetingMethods)].map((method) => MEETING_TYPE_VALUES[method]),
    location_preference: LOCATION_VALUES[preferences.locationPreference],
    travel_radius: preferences.locationPreference === "remote" ? null : preferences.travelRadius,
    availability: [...new Set(preferences.availability)],
    preferred_duration: preferences.preferredDuration,
    additional_preferences: preferences.additionalPreferences.trim() || null,
  }, { onConflict: "user_profile_id" }).select(COLUMNS).abortSignal(signal).maybeSingle<MeetingPreferencesRecord>();
  signal.throwIfAborted();
  if (error) throw databaseError(error);
  if (!data || data.user_profile_id !== owner.profileId) throw new Error("We couldn’t confirm that your meeting preferences were saved. Please try again.");
  return { preferences: fromRecord(data), hasRecord: true };
}
