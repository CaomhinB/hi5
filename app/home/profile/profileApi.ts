"use client";

import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import { notifyProfileChanged } from "../../lib/supabase/profileEvents";
import { loadOnboardingContext, OnboardingError } from "../../onboarding/onboardingApi";
import type { OnboardingContext } from "../../onboarding/onboardingApi";
import { profileSectionPayload } from "../../onboarding/profileModel";
import type { ProfileDraft, ProfileRecord, ProfileSection } from "../../onboarding/profileModel";

/** Existing owner RLS and column grants also support saving without the optional RPC. */
async function saveWithOwnerPermissions(
  payload: Record<string, unknown>, context: OnboardingContext, signal: AbortSignal,
): Promise<OnboardingContext> {
  const client = getSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  signal.throwIfAborted();
  if (sessionError || !sessionData.session) throw new OnboardingError("Please log in to edit your profile.", true);
  if (sessionData.session.user.id !== context.authUserId) {
    throw new OnboardingError("Your signed-in account changed. Please reload this page.");
  }

  // Resolve ownership again instead of trusting the profile ID from an old draft.
  const { data: owner, error: ownerError } = await client.from("users").select("id")
    .eq("auth_user_id", context.authUserId).abortSignal(signal).maybeSingle();
  signal.throwIfAborted();
  if (ownerError || !owner?.id || owner.id !== context.publicUserId) {
    throw new OnboardingError("Your profile couldn’t be identified. Please reload this page and try again.");
  }

  // Send only this section's editable columns. Supabase RLS enforces the owner.
  const { data: saved, error: saveError } = await client.from("user_profiles").update(payload)
    .eq("id", owner.id).select("id").abortSignal(signal).maybeSingle();
  signal.throwIfAborted();
  if (saveError || saved?.id !== context.publicUserId) {
    throw new OnboardingError(saveError?.code === "42501"
      ? "Your account doesn’t have permission to update this profile yet. Your changes haven’t been saved."
      : "We couldn’t save your changes. Please check your connection and try again.");
  }

  // Read the saved record and actual photo availability through the existing API.
  const refreshed = await loadOnboardingContext(signal);
  if (refreshed.authUserId !== context.authUserId || refreshed.publicUserId !== context.publicUserId
    || refreshed.profile?.id !== context.publicUserId) {
    throw new OnboardingError("Your signed-in account changed. Please reload this page.");
  }
  notifyProfileChanged(context.authUserId);
  return refreshed;
}

export async function saveProfileSection(
  section: ProfileSection, draft: ProfileDraft, imagePath: string,
  context: OnboardingContext, signal: AbortSignal,
): Promise<OnboardingContext> {
  const payload = profileSectionPayload(draft, imagePath, section);
  const { data, error } = await getSupabaseBrowserClient().rpc("update_my_profile_section", {
    expected_auth_user_id: context.authUserId, section_name: section,
    section_input: payload,
  }).abortSignal(signal);
  signal.throwIfAborted();
  if (error) {
    // A missing RPC hasn't written anything, so it is safe to use the existing owner update path.
    // Never fall back after validation, permission or network errors from an installed RPC.
    if (error.code === "PGRST202") return saveWithOwnerPermissions(payload, context, signal);
    if (/profile_auth_required|JWT/i.test(error.message)) throw new OnboardingError("Please log in to edit your profile.", true);
    if (/profile_account_changed/i.test(error.message)) throw new OnboardingError("Your signed-in account changed. Please reload this page.");
    if (/profile_user_missing|profile_record_missing/i.test(error.message)) throw new OnboardingError("Your profile record isn’t available. Please complete your profile setup first.");
    if (error.message.startsWith("profile_invalid:")) throw new OnboardingError(error.message.slice("profile_invalid:".length).trim());
    throw new OnboardingError("We couldn’t save your changes. Please check your connection and try again.");
  }
  if (data?.success !== true || data.auth_user_id !== context.authUserId
    || data.user_id !== context.publicUserId || data.profile?.id !== context.publicUserId) {
    throw new OnboardingError("We couldn’t confirm that your changes were saved. Please try again.");
  }
  const saved = { ...context, profile: data.profile as ProfileRecord, photoExists: data.photo_exists === true };
  notifyProfileChanged(context.authUserId);
  return saved;
}
