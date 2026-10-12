"use client";

import { getSupabaseBrowserClient } from "../../lib/supabase/browser";

const IMAGE_BUCKET = "profile-images";
const PROFILE_COLUMNS = "id,name,organisation,location,job_title,skills,industries,image_path";

export interface MatchCard {
  matchId: string;
  matchedAt: string;
  otherUserId: string;
  name: string;
  jobTitle: string;
  location: string;
  industry: string;
  tags: string[];
  image: string | null;
}

interface MatchRow {
  id: string;
  user_1_id: string;
  user_2_id: string;
  matched_at: string;
}

interface ProfileRow {
  id: string;
  name: string | null;
  organisation: string | null;
  location: string | null;
  job_title: string | null;
  skills: (string | null)[] | null;
  industries: (string | null)[] | null;
  image_path: string | null;
}

function loadError(code: string): Error {
  return new Error(code === "42501"
    ? "Matches aren’t available with the current access."
    : "Your matches couldn’t be loaded. Please try again.");
}

function firstLabels(values: (string | null)[] | null, limit: number): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const value of values ?? []) {
    const label = value?.trim();
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    labels.push(label);
    if (labels.length === limit) break;
  }
  return labels;
}

/**
 * Active matches for the signed-in user, newest first. Row Level Security limits
 * public.matches to the caller's own rows. IDs belong to public.users.
 */
export async function fetchMatches(currentUserId: string, signal: AbortSignal): Promise<MatchCard[]> {
  const client = getSupabaseBrowserClient();
  const { data: matchData, error: matchError } = await client
    .from("matches")
    .select("id,user_1_id,user_2_id,matched_at")
    .eq("status", "active")
    .order("matched_at", { ascending: false })
    .abortSignal(signal)
    .overrideTypes<MatchRow[], { merge: false }>();
  if (matchError) throw loadError(matchError.code);

  const matches = matchData ?? [];
  if (!matches.length) return [];

  const otherId = (match: MatchRow) => match.user_1_id === currentUserId ? match.user_2_id : match.user_1_id;
  const { data: profileData, error: profileError } = await client
    .from("user_profiles")
    .select(PROFILE_COLUMNS)
    .in("id", matches.map(otherId))
    .abortSignal(signal)
    .overrideTypes<ProfileRow[], { merge: false }>();
  if (profileError) throw loadError(profileError.code);

  const profiles = new Map((profileData ?? []).map((profile) => [profile.id, profile]));
  return matches.flatMap((match) => {
    const profile = profiles.get(otherId(match));
    if (!profile) return [];
    // Accept bucket-relative paths, or paths prefixed with the bucket name.
    const path = profile.image_path?.trim().replace(/^\/+/, "").replace(/^profile-images\//, "");
    return [{
      matchId: match.id,
      matchedAt: match.matched_at,
      otherUserId: profile.id,
      name: profile.name?.trim() || "Hi5 member",
      jobTitle: profile.job_title?.trim() ?? "",
      location: profile.location?.trim() ?? "",
      industry: firstLabels(profile.industries, 1)[0] ?? "",
      tags: firstLabels(profile.skills, 3),
      image: path ? client.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl : null,
    }];
  });
}

function unmatchError(code: string, message: string): string {
  if (/not found or already unmatched/i.test(message)) return "This match has already ended.";
  if (code === "42501" || code === "PGRST301" || /authenticated|JWT|session/i.test(message)) {
    return "Please sign in to manage your matches.";
  }
  return "We couldn’t unmatch right now. Please try again.";
}

/** Calls the database function that only sets status to "unmatched". */
export async function unmatch(matchId: string, signal: AbortSignal): Promise<void> {
  const client = getSupabaseBrowserClient();
  const { error } = await client.rpc("unmatch", { target_match_id: matchId }).abortSignal(signal);
  signal.throwIfAborted();
  if (error) throw new Error(unmatchError(error.code, error.message), { cause: error });
}
