import { AVAILABILITY_OPTIONS, DURATION_OPTIONS, LOCATION_PREFERENCES, MEETING_METHODS } from "./meetingOptions";
import type { LocationPreference, MeetingMethod } from "./meetingOptions";

// Form identifiers stay stable; the database uses these canonical values.
export const MEETING_TYPE_VALUES = {
  coffee: "coffee_casual", video_call: "video_call", phone_call: "phone_call",
  coworking: "coworking_work_session", networking_event: "networking_event",
} as const satisfies Record<MeetingMethod, string>;

export const LOCATION_VALUES = {
  in_person: "in_person_only", remote: "remote_only", both: "both",
} as const satisfies Record<LocationPreference, string>;

export const PROFILE_MEETING_COLUMNS = "user_profile_id,meeting_types,location_preference,travel_radius,availability,preferred_duration,additional_preferences";

export interface ProfileMeetingPreferencesRecord {
  user_profile_id: string;
  meeting_types: (string | null)[] | null;
  location_preference: string | null;
  travel_radius: number | null;
  availability: (string | null)[] | null;
  preferred_duration: string | null;
  additional_preferences: string | null;
}

const readableValue = (value: string) => value.trim().replace(/_/g, " ");

/** Format actual saved values without assigning another profile form defaults. */
export function profileMeetingPreferencesDetails(record: ProfileMeetingPreferencesRecord) {
  const methods = (record.meeting_types ?? []).filter((value): value is string => !!value?.trim()).map((value) =>
    MEETING_METHODS.find((option) => option.id === value || MEETING_TYPE_VALUES[option.id] === value)?.label ?? readableValue(value));
  const availability = (record.availability ?? []).filter((value): value is string => !!value?.trim()).map((value) =>
    AVAILABILITY_OPTIONS.find((option) => option.id === value)?.label ?? readableValue(value));
  const location = record.location_preference?.trim();
  const duration = record.preferred_duration?.trim();
  const remoteOnly = location === "remote_only" || location === "remote";
  const travel = remoteOnly ? "Not needed for remote meetings" : record.travel_radius != null
    ? `Within ${record.travel_radius} km` : location ? "Anywhere" : null;
  return {
    methods: [...new Set(methods)], availability: [...new Set(availability)],
    location: location ? LOCATION_PREFERENCES.find((option) => option.id === location || LOCATION_VALUES[option.id] === location)?.label ?? readableValue(location) : null,
    travel,
    duration: duration ? DURATION_OPTIONS.find((option) => option.id === duration)?.label ?? readableValue(duration) : null,
    notes: record.additional_preferences?.trim() || null,
  };
}
