"use client";

import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import { mapDiscoveryProfile } from "./discoveryProfile";
import type { DiscoveryProfile, UserProfileRow } from "./discoveryProfile";
import type { DiscoveryFilters } from "./discoveryFilters";
import type { ProfileRecord } from "../../onboarding/profileModel";

const PROFILE_COLUMNS = "id,name,organisation,location,job_title,bio,skills,experience,industries,interests,current_projects,image_path,created_at";
const IMAGE_BUCKET = "profile-images";

export interface DiscoveryBatchRequest {
  offset: number;
  limit: number;
  signal: AbortSignal;
}

export interface DiscoveryBatch {
  profiles: DiscoveryProfile[];
  nextOffset: number;
  hasMore: boolean;
}

export type DiscoveryBatchLoader = (request: DiscoveryBatchRequest) => Promise<DiscoveryBatch>;

export interface DiscoveryProfileDetails {
  profile: ProfileRecord;
  image: string | null;
}

/** Load one complete record only when More is opened; the batch query stays small. */
export async function fetchDiscoveryProfileDetails(profileId: string, signal: AbortSignal): Promise<DiscoveryProfileDetails> {
  signal.throwIfAborted();
  const client = getSupabaseBrowserClient();
  const { data, error } = await client.from("user_profiles").select("*")
    .eq("id", profileId).abortSignal(signal).maybeSingle<ProfileRecord>();
  signal.throwIfAborted();
  if (error) throw new Error("This profile couldn’t be loaded. Please try again.", { cause: error });
  if (!data || data.id !== profileId) throw new Error("This profile is no longer available.");
  const path = data.image_path?.trim().replace(/^\/+/, "").replace(/^profile-images\//, "");
  return { profile: data, image: path ? client.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl : null };
}

/** Keep query predicates and row mapping here, independent of the queue and UI. */
export async function fetchDiscoveryProfilesBatch(
  { offset, limit, signal }: DiscoveryBatchRequest,
  filters?: DiscoveryFilters,
): Promise<DiscoveryBatch> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Discovery profiles aren’t configured yet. Please try again later.");
  }
  const client = getSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  signal.throwIfAborted();
  if (sessionError) throw new Error("Your account couldn’t be checked. Please try again.", { cause: sessionError });

  let ownProfileId: string | null = null;
  if (sessionData.session) {
    // Auth IDs and public user/profile IDs are different. Read only our own mapping.
    const { data: user, error: userError } = await client.from("users").select("id")
      .eq("auth_user_id", sessionData.session.user.id).abortSignal(signal).maybeSingle();
    signal.throwIfAborted();
    if (userError || !user?.id) {
      throw new Error("Your profile couldn’t be identified. Please try again.", { cause: userError });
    }
    ownProfileId = user.id;
  }

  let query = client.from("user_profiles").select(PROFILE_COLUMNS);
  // All predicates run inside Supabase, before the stable order and 10-row range.
  if (ownProfileId) query = query.neq("id", ownProfileId);
  if (filters?.industries.length) query = query.overlaps("industries", filters.industries);
  if (filters?.professionWords.length) query = query.overlaps("discovery_profession_words", filters.professionWords);
  if (filters?.skillWords.length) query = query.overlaps("discovery_skill_words", filters.skillWords);
  if (filters?.experienceMin != null) query = query.gte("experience", filters.experienceMin);
  if (filters?.experienceMax != null) query = query.lte("experience", filters.experienceMax);

  const { data, error } = await query
    .order("created_at", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1)
    .abortSignal(signal)
    .overrideTypes<UserProfileRow[], { merge: false }>();

  if (error) {
    // Some PostgREST configurations return 416 beyond the final full page.
    if (error.code === "PGRST103" && offset > 0) {
      return { profiles: [], nextOffset: offset, hasMore: false };
    }
    throw new Error(error.code === "PGRST204" || error.code === "42703"
      ? "Profile search isn’t available yet. Please try again later."
      : error.code === "42501"
      ? "Discovery profiles aren’t available with the current access."
      : "Profiles couldn’t be loaded. Please try again.", { cause: error });
  }

  const rows = data ?? [];
  const profiles = rows.map((row) => {
    // Accept bucket-relative paths, or paths prefixed with the bucket name.
    const path = row.image_path?.trim().replace(/^\/+/, "").replace(/^profile-images\//, "");
    const image = path ? client.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl : null;
    return mapDiscoveryProfile(row, image);
  });
  return { profiles, nextOffset: offset + rows.length, hasMore: rows.length === limit };
}
