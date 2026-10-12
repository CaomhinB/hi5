import type { Filters } from "../filters/filterOptions";
import { EXPERIENCE_LEVELS } from "../filters/filterOptions";
import type { ProfileRecord } from "../../onboarding/profileModel";
import type { ProfileMeetingPreferencesRecord } from "../meet/meetingPreferencesModel";

export type CandidateState = "pending" | "passed" | "hi_sent" | "matched" | "expired";
export interface Hi5Preferences {
  user_profile_id: string;
  looking_for: Filters["lookingFor"];
  work_arrangement: "any" | "on_site" | "hybrid" | "remote";
  industries: string[];
  profession: string | null;
  experience_level: "any" | "0_2" | "3_5" | "5_10" | "10_plus";
  skills: string[];
  open_to: "any" | "new_opportunities" | "side_projects" | "mentorship";
}
export interface Hi5Batch {
  id: string;
  user_profile_id: string;
  created_at: string;
  expires_at: string;
  filters_snapshot: Hi5Preferences;
  algorithm_version: string;
}
export interface Hi5Candidate {
  id: string;
  batch_id: string;
  candidate_profile_id: string;
  position: number;
  score: number;
  state: CandidateState;
  decision: "hi" | "pass" | null;
  match_id: string | null;
  reasons: string[];
  score_breakdown: { relaxed_filters?: string[]; relaxation_tier?: number };
  profile: ProfileRecord;
  meeting_preferences: ProfileMeetingPreferencesRecord | null;
}
export interface Hi5Response {
  batch: Hi5Batch;
  candidates: Hi5Candidate[];
  preferences: Hi5Preferences;
  server_time: string;
}

const workValues = ["any", "on_site", "hybrid", "remote"] as const;
const workLabels = ["Any", "On-site", "Hybrid", "Remote"] as const;
const openValues = ["any", "new_opportunities", "side_projects", "mentorship"] as const;
const openLabels = ["Any", "New opportunities", "Side projects", "Mentorship"] as const;
const experienceValues = ["any", "0_2", "3_5", "5_10", "10_plus"] as const;

export function preferencesToFilters(preferences: Hi5Preferences | null): Filters {
  return {
    lookingFor: preferences?.looking_for ?? "collaborator", location: null,
    workArrangement: workLabels[Math.max(0, workValues.indexOf(preferences?.work_arrangement ?? "any"))],
    industries: [...(preferences?.industries ?? [])], profession: preferences?.profession ?? null,
    experienceLevel: EXPERIENCE_LEVELS[Math.max(0, experienceValues.indexOf(preferences?.experience_level ?? "any"))],
    skills: [...(preferences?.skills ?? [])],
    openTo: openLabels[Math.max(0, openValues.indexOf(preferences?.open_to ?? "any"))],
  };
}

export function filtersToPreferences(filters: Filters, ownerId: string): Hi5Preferences {
  return {
    user_profile_id: ownerId, looking_for: filters.lookingFor,
    work_arrangement: workValues[workLabels.indexOf(filters.workArrangement)],
    industries: [...filters.industries], profession: filters.profession?.trim() || null,
    experience_level: experienceValues[EXPERIENCE_LEVELS.indexOf(filters.experienceLevel)],
    skills: [...filters.skills], open_to: openValues[openLabels.indexOf(filters.openTo)],
  };
}

export function daysLeft(expiresAt: string, now: number): number {
  return Math.min(5, Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 86_400_000)));
}

export function candidateStatus(state: CandidateState, remainingDays: number): string {
  switch (state) {
    case "passed": return "Passed";
    case "hi_sent": return "Hi sent";
    case "matched": return "Matched";
    case "expired": return "Expired";
    default: return remainingDays > 0 ? `${remainingDays}d left` : "Expired";
  }
}
