"use client";

import { useState } from "react";
import { publishCurrentProfile, useCurrentProfile } from "../../../lib/supabase/currentProfile";
import { OnboardingFlow } from "../../../onboarding/OnboardingFlow";
import type { OnboardingContext } from "../../../onboarding/onboardingApi";
import type { ProfileSection } from "../../../onboarding/profileModel";
import { ProfileAccessState } from "../ProfileExperience";

function LoadedProfileEditor({ context, section }: { context: OnboardingContext; section: ProfileSection }) {
  // Keep the form draft stable if a background refresh updates the shared cache.
  const [initialContext] = useState(context);
  return <OnboardingFlow editSection={section} initialContext={initialContext} onSaved={publishCurrentProfile} />;
}

export function ProfileEditExperience({ section }: { section: ProfileSection }) {
  const state = useCurrentProfile();
  if (!state.context?.profile) return <ProfileAccessState state={state} />;
  return <LoadedProfileEditor key={`${state.context.authUserId}:${section}`} context={state.context} section={section} />;
}
