import type { StaticImageData } from "next/image";

export type SkillTone = "blue" | "cyan" | "purple" | "pink";

export interface DiscoveryProfile {
  id: string;
  name: string;
  verified: boolean;
  professionalTitle: string;
  location: string;
  industry: string;
  experience: string;
  biography: string;
  skills: { label: string; tone: SkillTone }[];
  whyThisProfile: string;
  image: StaticImageData | string | null;
  placeholderTone: "blue" | "purple" | "teal";
}

/** The fields Discovery selects from public.user_profiles. */
export interface UserProfileRow {
  id: string;
  name: string | null;
  organisation: string | null;
  location: string | null;
  job_title: string | null;
  bio: string | null;
  skills: (string | null)[] | null;
  experience: number | null;
  industries: (string | null)[] | null;
  interests: (string | null)[] | null;
  current_projects: string | null;
  image_path: string | null;
  created_at: string;
}

function uniqueLabels(values: (string | null)[]): string[] {
  const seen = new Set<string>();
  return values.map((value) => value?.trim() ?? "").filter((value) => {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mapDiscoveryProfile(row: UserProfileRow, image: string | null): DiscoveryProfile {
  const interests = uniqueLabels(row.interests ?? []);
  const labels = uniqueLabels([...(row.skills ?? []), ...interests]).slice(0, 4);
  const tones: SkillTone[] = ["blue", "cyan", "purple", "pink"];
  const project = row.current_projects?.trim();
  const context = [
    project ? `Working on ${project}` : "",
    interests.length ? `Interested in ${interests.slice(0, 3).join(", ")}.` : "",
  ].filter(Boolean).join(" ");

  return {
    id: row.id,
    name: row.name?.trim() || "Professional",
    // This table has no verification or match fields; do not invent those claims.
    verified: false,
    professionalTitle: [row.job_title?.trim(), row.organisation?.trim()].filter(Boolean).join(" · ") || "Professional",
    location: row.location?.trim() || "Location not provided",
    industry: uniqueLabels(row.industries ?? []).slice(0, 2).join(" · ") || "Industry not provided",
    experience: row.experience === null
      ? "Experience not provided"
      : `${row.experience} ${row.experience === 1 ? "year" : "years"}`,
    biography: row.bio?.trim() || "No bio added yet.",
    skills: labels.map((label, index) => ({ label, tone: tones[index % tones.length] })),
    whyThisProfile: context || "Explore their skills and experience to see whether you’d like to connect.",
    image,
    placeholderTone: "blue",
  };
}
