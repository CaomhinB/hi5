"use client";

import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import { notifyProfileChanged } from "../../lib/supabase/profileEvents";
import type { OnboardingContext } from "../../onboarding/onboardingApi";
import type { ProfileRecord } from "../../onboarding/profileModel";
import type { MatchingDraft } from "./profileMatchingModel";

/** Stage 2 grants these columns, with owner UPDATE policies. Omitted city stays untouched. */
export async function saveMatchingProfile(
  context: OnboardingContext, draft: Omit<MatchingDraft, "city"> & { city?: string }, signal: AbortSignal,
  { notify = true }: { notify?: boolean } = {},
): Promise<ProfileRecord> {
  const city = draft.city?.trim();
  if (city !== undefined && (city.length > 100 || /[\u0000-\u001f\u007f]/.test(city))) throw new Error("Enter a city name within 100 characters.");
  const client = getSupabaseBrowserClient();
  const { data: session, error: sessionError } = await client.auth.getSession();
  signal.throwIfAborted();
  if (sessionError || session.session?.user.id !== context.authUserId) throw new Error("Please log in again to edit your profile.");
  const { data: owner, error: ownerError } = await client.from("users").select("id")
    .eq("auth_user_id", context.authUserId).abortSignal(signal).maybeSingle();
  signal.throwIfAborted();
  if (ownerError || owner?.id !== context.publicUserId) throw new Error("Your profile couldn’t be identified. Please reload this page.");
  const { data, error } = await client.from("user_profiles").update({
    ...(city === undefined ? {} : { city: city || null }), networking_role: draft.networking_role,
    work_arrangement: draft.work_arrangement, open_to: draft.open_to,
  }).eq("id", owner.id).select("*").abortSignal(signal).maybeSingle<ProfileRecord>();
  signal.throwIfAborted();
  if (error || data?.id !== context.publicUserId) throw new Error(error?.code === "23514"
    ? "Please check your city and networking choices."
    : "Your networking details couldn’t be saved. Please try again.", { cause: error });
  if (notify) notifyProfileChanged(context.authUserId);
  return data;
}
