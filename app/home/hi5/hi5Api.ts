"use client";

import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import type { OnboardingContext } from "../../onboarding/onboardingApi";
import { PROFILE_IMAGE_BUCKET } from "../../onboarding/profileModel";
import type { ProfileRecord } from "../../onboarding/profileModel";
import { mapDiscoveryProfile } from "../discover/discoveryProfile";
import type { Filters } from "../filters/filterOptions";
import { filtersToPreferences } from "./hi5Model";
import type { Hi5Candidate, Hi5Preferences, Hi5Response } from "./hi5Model";

function errorMessage(code: string, message: string): string {
  if (message.includes("hi5_profile_incomplete")) return "Complete your profile details and photo to get your Hi5.";
  if (code === "PGRST202" || code === "42P01" || code === "42703") return "Hi5 isn’t available yet. Please try again later.";
  if (/authenticated|JWT/i.test(message)) return "Please log in again to see your Hi5.";
  if (/public\.users record/i.test(message)) return "Your account setup isn’t complete yet. Please finish your profile setup.";
  if (code === "23514") return "Please check your filter choices and try again.";
  return "Your Hi5 couldn’t be loaded or saved. Please check your connection and try again.";
}

async function checkAccount(authUserId: string, signal: AbortSignal) {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client.auth.getSession();
  signal.throwIfAborted();
  if (error || !data.session || data.session.user.id !== authUserId) {
    throw new Error("Your signed-in account changed. Please log in again.");
  }
  return client;
}

export async function fetchHi5(authUserId: string, ownerId: string, signal: AbortSignal): Promise<Hi5Response> {
  const client = await checkAccount(authUserId, signal);
  const { data, error } = await client.rpc("get_my_hi5", { expected_auth_user_id: authUserId }).abortSignal(signal);
  signal.throwIfAborted();
  if (error) throw new Error(errorMessage(error.code, error.message), { cause: error });
  const response = data as Hi5Response | null;
  const states = ["pending", "passed", "hi_sent", "matched", "expired"];
  if (!response?.batch?.id || response.batch.user_profile_id !== ownerId
    || !Number.isFinite(Date.parse(response.batch.expires_at))
    || !Number.isFinite(Date.parse(response.server_time))
    || response.preferences?.user_profile_id !== ownerId
    || !Array.isArray(response.candidates) || response.candidates.length > 5
    || response.candidates.some((candidate) => !candidate?.id
      || candidate.batch_id !== response.batch.id || candidate.candidate_profile_id === ownerId
      || candidate.profile?.id !== candidate.candidate_profile_id
      || !Number.isInteger(candidate.position) || candidate.position < 1 || candidate.position > 5
      || !Number.isInteger(candidate.score) || candidate.score < 0 || candidate.score > 100
      || !states.includes(candidate.state))
    || new Set(response.candidates.map((candidate) => candidate.position)).size !== response.candidates.length
    || new Set(response.candidates.map((candidate) => candidate.candidate_profile_id)).size !== response.candidates.length) {
    throw new Error("We couldn’t confirm your Hi5. Please try again.");
  }
  return { ...response, candidates: [...response.candidates].sort((a, b) => a.position - b.position) };
}

export function profileImage(profile: ProfileRecord): string | null {
  const path = profile.image_path?.trim().replace(/^\/+/, "").replace(/^profile-images\//, "");
  return path ? getSupabaseBrowserClient().storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl : null;
}

export function cardProfile(profile: ProfileRecord, candidate?: Hi5Candidate) {
  const card = mapDiscoveryProfile({ ...profile, created_at: profile.created_at ?? "" }, profileImage(profile));
  const names: Record<string, string> = { experience: "experience range", profession: "profession",
    work_arrangement: "work arrangement", open_to: "opportunity preferences", looking_for: "networking goal" };
  const reasons = candidate?.reasons?.map((reason) => reason.startsWith("Broadened search:")
    ? `Broadened your ${reason.slice("Broadened search:".length).split(",").map((key) => names[key.trim()] ?? "preferences").join(", ")} search.`
    : reason);
  return reasons?.length ? { ...card, whyThisProfile: reasons.join(" · ") } : card;
}

export async function loadHi5Preferences(context: Pick<OnboardingContext, "authUserId" | "publicUserId">, signal: AbortSignal): Promise<Hi5Preferences | null> {
  const client = await checkAccount(context.authUserId, signal);
  const { data, error } = await client.from("hi5_preferences").select("*")
    .eq("user_profile_id", context.publicUserId).abortSignal(signal).maybeSingle<Hi5Preferences>();
  signal.throwIfAborted();
  if (error) throw new Error(errorMessage(error.code, error.message), { cause: error });
  return data;
}

/** Save preferences only: never call generation or replace the current batch here. */
export async function saveHi5Preferences(context: OnboardingContext, filters: Filters, signal: AbortSignal) {
  const client = await checkAccount(context.authUserId, signal);
  const { data, error } = await client.from("hi5_preferences")
    .upsert(filtersToPreferences(filters, context.publicUserId), { onConflict: "user_profile_id" })
    .select("user_profile_id").abortSignal(signal).maybeSingle();
  signal.throwIfAborted();
  if (error) throw new Error(errorMessage(error.code, error.message), { cause: error });
  if (data?.user_profile_id !== context.publicUserId) throw new Error("We couldn’t confirm your filters were saved. Please try again.");
}
