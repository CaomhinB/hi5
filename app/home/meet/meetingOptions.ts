export const MEETING_METHODS = [
  { id: "coffee", label: "Coffee or casual meetup", icon: "coffee" },
  { id: "video_call", label: "Video call", icon: "video" },
  { id: "phone_call", label: "Phone call", icon: "phone" },
  { id: "coworking", label: "Coworking or work session", icon: "people" },
  { id: "networking_event", label: "Networking event", icon: "calendar" },
] as const;

export const LOCATION_PREFERENCES = [
  { id: "in_person", label: "In person only" },
  { id: "remote", label: "Remote only" },
  { id: "both", label: "Both" },
] as const;

export const TRAVEL_RADII = [5, 10, 25, 50] as const;

export const AVAILABILITY_OPTIONS = [
  { id: "weekday_mornings", label: "Weekday mornings" },
  { id: "weekday_afternoons", label: "Weekday afternoons" },
  { id: "weekday_evenings", label: "Weekday evenings" },
  { id: "weekends", label: "Weekends" },
  { id: "flexible", label: "Flexible" },
] as const;

export const DURATION_OPTIONS = [
  { id: "15_30_minutes", label: "15–30 minutes" },
  { id: "30_60_minutes", label: "30–60 minutes" },
  { id: "1_2_hours", label: "1–2 hours" },
  { id: "flexible", label: "Flexible" },
] as const;

export const MAX_PREFERENCE_CHARACTERS = 300;

export type MeetingMethod = (typeof MEETING_METHODS)[number]["id"];
export type LocationPreference = (typeof LOCATION_PREFERENCES)[number]["id"];
export type Availability = (typeof AVAILABILITY_OPTIONS)[number]["id"];
export type PreferredDuration = (typeof DURATION_OPTIONS)[number]["id"];
export type TravelRadius = (typeof TRAVEL_RADII)[number] | null;

export interface MeetingPreferences {
  meetingMethods: MeetingMethod[];
  locationPreference: LocationPreference;
  travelRadius: TravelRadius;
  availability: Availability[];
  preferredDuration: PreferredDuration;
  additionalPreferences: string;
}

export const DEFAULT_MEETING_PREFERENCES: MeetingPreferences = {
  meetingMethods: [],
  locationPreference: "both",
  travelRadius: 25,
  availability: ["weekends"],
  preferredDuration: "30_60_minutes",
  additionalPreferences: "",
};

export function createDefaultMeetingPreferences(): MeetingPreferences {
  return {
    ...DEFAULT_MEETING_PREFERENCES,
    meetingMethods: [...DEFAULT_MEETING_PREFERENCES.meetingMethods],
    availability: [...DEFAULT_MEETING_PREFERENCES.availability],
  };
}

export function validateMeetingPreferences(value: MeetingPreferences): string | null {
  if (!value.meetingMethods.length) return "Select at least one way you’d like to meet.";
  if (value.meetingMethods.some((id) => !MEETING_METHODS.some((option) => option.id === id))) {
    return "Choose a meeting method from the available options.";
  }
  if (!LOCATION_PREFERENCES.some((option) => option.id === value.locationPreference)) {
    return "Choose a location preference.";
  }
  if (value.locationPreference === "remote" && value.travelRadius !== null) {
    return "Remote meetings should not have a travel distance.";
  }
  if (value.travelRadius !== null && !TRAVEL_RADII.includes(value.travelRadius)) {
    return "Choose a travel distance from the available options.";
  }
  if (value.availability.some((id) => !AVAILABILITY_OPTIONS.some((option) => option.id === id))) {
    return "Choose availability from the available options.";
  }
  if (!DURATION_OPTIONS.some((option) => option.id === value.preferredDuration)) {
    return "Choose your preferred meeting duration.";
  }
  if (value.additionalPreferences.length > MAX_PREFERENCE_CHARACTERS) {
    return `Keep additional preferences within ${MAX_PREFERENCE_CHARACTERS} characters.`;
  }
  return null;
}
