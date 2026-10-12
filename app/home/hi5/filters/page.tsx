import type { Metadata } from "next";
import { Hi5FiltersExperience } from "./Hi5FiltersExperience";

export const metadata: Metadata = { title: "Hi5 preferences | Hi5" };

export default function Hi5FiltersPage() {
  return <Hi5FiltersExperience />;
}
