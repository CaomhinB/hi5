import type { Metadata } from "next";
import { ProfileExperience } from "./ProfileExperience";

export const metadata: Metadata = { title: "My profile | Hi5" };

export default function ProfilePage() {
  return <ProfileExperience />;
}
