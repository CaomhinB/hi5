"use client";

import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import { notifyProfileChanged } from "../../lib/supabase/profileEvents";
import { OnboardingError } from "../../onboarding/onboardingApi";
import type { OnboardingContext } from "../../onboarding/onboardingApi";
import { profileSectionPayload } from "../../onboarding/profileModel";
import type { ProfileDraft, ProfileRecord, ProfileSection } from "../../onboarding/profileModel";

export async function saveProfileSection(
  section: ProfileSection, draft: ProfileDraft, imagePath: string,
  context: OnboardingContext, signal: AbortSignal,
): Promise<OnboardingContext> {
  const { data, error } = await getSupabaseBrowserClient().rpc("update_my_profile_section", {
    expected_auth_user_id: context.authUserId, section_name: section,
    section_input: profileSectionPayload(draft, imagePath, section),
  }).abortSignal(signal);
  signal.throwIfAborted();
  if (error) {
    if (error.code === "PGRST202") throw new OnboardingError("Profile editing isn’t available yet. Please try again later.");
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
