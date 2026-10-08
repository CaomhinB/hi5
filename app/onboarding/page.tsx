import type { Metadata } from "next";
import { OnboardingFlow } from "./OnboardingFlow";

export const metadata: Metadata = { title: "Complete your profile | Hi5" };

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
