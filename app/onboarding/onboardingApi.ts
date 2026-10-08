"use client";

import { getSupabaseBrowserClient } from "../lib/supabase/browser";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, PROFILE_IMAGE_BUCKET, profilePayload } from "./profileModel";
import type { ProfileDraft, ProfileRecord } from "./profileModel";

export interface OnboardingContext {
  authUserId: string;
  publicUserId: string;
  profile: ProfileRecord | null;
  metadata: Record<string, unknown>;
  photoExists: boolean;
}

export class OnboardingError extends Error {
  constructor(message: string, public readonly signedOut = false) { super(message); }
}

function apiError(code: string, message: string): OnboardingError {
  if (/onboarding_auth_required|JWT/i.test(message)) return new OnboardingError("Please log in to finish setting up your profile.", true);
  if (/onboarding_account_changed/i.test(message)) return new OnboardingError("Your signed-in account changed. Please reload this page.");
  if (/onboarding_user_missing/i.test(message)) return new OnboardingError("Your account record isn’t ready yet. Please try again in a moment.");
  if (code === "PGRST202" || code === "42501") return new OnboardingError("Profile setup isn’t available yet. Please try again later.");
  if (message.startsWith("onboarding_invalid:")) return new OnboardingError(message.slice("onboarding_invalid:".length).trim());
  return new OnboardingError("We couldn’t save or load your profile. Please check your connection and try again.");
}

export async function loadOnboardingContext(signal: AbortSignal): Promise<OnboardingContext> {
  const client = getSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  signal.throwIfAborted();
  if (sessionError || !sessionData.session) throw new OnboardingError("Please log in to finish setting up your profile.", true);
  const user = sessionData.session.user;
  const { data, error } = await client.rpc("get_my_onboarding_profile", { expected_auth_user_id: user.id }).abortSignal(signal);
  signal.throwIfAborted();
  if (error) throw apiError(error.code, error.message);
  if (!data || typeof data !== "object" || typeof data.user_id !== "string" || data.auth_user_id !== user.id) {
    throw new OnboardingError("We couldn’t read your profile. Please try again.");
  }
  return { authUserId: user.id, publicUserId: data.user_id, profile: (data.profile ?? null) as ProfileRecord | null,
    metadata: user.user_metadata, photoExists: data.photo_exists === true };
}

export function profilePhotoUrl(path: string): string {
  return getSupabaseBrowserClient().storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function validatePhoto(file: File): string | null {
  if (!IMAGE_TYPES.some((type) => type === file.type)) return "Choose a JPEG, PNG or WebP photo.";
  if (!file.size || file.size > MAX_IMAGE_BYTES) return "Choose a photo of 5 MB or smaller.";
  return null;
}

export async function uploadProfilePhoto(file: File, authUserId: string): Promise<string> {
  const validation = validatePhoto(file);
  if (validation) throw new OnboardingError(validation);
  const client = getSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError || !sessionData.session) throw new OnboardingError("Please log in to finish setting up your profile.", true);
  if (sessionData.session.user.id !== authUserId) throw new OnboardingError("Your signed-in account changed. Please reload this page.");
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${authUserId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(PROFILE_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
  if (error) throw new OnboardingError("Your photo couldn’t be uploaded. Please try again.");
  return path;
}

export async function saveOnboardingProfile(draft: ProfileDraft, imagePath: string, authUserId: string, signal: AbortSignal): Promise<void> {
  const { data, error } = await getSupabaseBrowserClient().rpc("save_my_onboarding_profile", {
    expected_auth_user_id: authUserId, profile_input: profilePayload(draft, imagePath),
  }).abortSignal(signal);
  signal.throwIfAborted();
  if (error) throw apiError(error.code, error.message);
  if (data?.success !== true) throw new OnboardingError("We couldn’t confirm that your profile was saved. Please try again.");
}
