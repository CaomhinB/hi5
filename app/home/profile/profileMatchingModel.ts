import { LOOKING_FOR_OPTIONS } from "../filters/filterOptions";
import type { ProfileRecord } from "../../onboarding/profileModel";

export const MATCHING_WORK_OPTIONS = [
  { value: "any", label: "Any" }, { value: "on_site", label: "On-site" },
  { value: "hybrid", label: "Hybrid" }, { value: "remote", label: "Remote" },
] as const;
export const MATCHING_OPEN_OPTIONS = [
  { value: "any", label: "Any" }, { value: "new_opportunities", label: "New opportunities" },
  { value: "side_projects", label: "Side projects" }, { value: "mentorship", label: "Mentorship" },
] as const;
export { LOOKING_FOR_OPTIONS as MATCHING_ROLE_OPTIONS };

export interface MatchingDraft {
  city: string;
  networking_role: (typeof LOOKING_FOR_OPTIONS)[number]["value"];
  work_arrangement: (typeof MATCHING_WORK_OPTIONS)[number]["value"];
  open_to: (typeof MATCHING_OPEN_OPTIONS)[number]["value"];
}

function valueOrDefault<T extends string>(value: unknown, options: readonly { value: T }[], fallback: T): T {
  return options.find((option) => option.value === value)?.value ?? fallback;
}

export function matchingDraft(profile: Pick<ProfileRecord, "city" | "networking_role" | "work_arrangement" | "open_to">): MatchingDraft {
  return {
    city: profile.city ?? "",
    networking_role: valueOrDefault(profile.networking_role, LOOKING_FOR_OPTIONS, "collaborator"),
    work_arrangement: valueOrDefault(profile.work_arrangement, MATCHING_WORK_OPTIONS, "any"),
    open_to: valueOrDefault(profile.open_to, MATCHING_OPEN_OPTIONS, "any"),
  };
}

export function matchingLabels(profile: ProfileRecord) {
  return {
    city: profile.city?.trim() || null,
    role: LOOKING_FOR_OPTIONS.find((option) => option.value === profile.networking_role)?.label ?? null,
    work: MATCHING_WORK_OPTIONS.find((option) => option.value === profile.work_arrangement)?.label ?? null,
    open: MATCHING_OPEN_OPTIONS.find((option) => option.value === profile.open_to)?.label ?? null,
  };
}
