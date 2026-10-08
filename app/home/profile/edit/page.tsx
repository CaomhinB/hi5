import type { Metadata } from "next";
import { PROFILE_SECTIONS } from "../../../onboarding/profileModel";
import { ProfileEditExperience } from "./ProfileEditExperience";

export const metadata: Metadata = { title: "Edit my profile | Hi5" };

export default async function EditProfilePage({ searchParams }: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const requested = (await searchParams).section;
  const section = PROFILE_SECTIONS.find((option) => option === requested) ?? "about";
  return <ProfileEditExperience section={section} />;
}
