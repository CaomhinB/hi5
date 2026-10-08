import { INDUSTRIES, PROFESSIONS, SKILLS } from "../home/filters/filterOptions";
import { interests } from "../signup/options";

export { INDUSTRIES, PROFESSIONS };
export const SKILL_OPTIONS = [...new Set([...SKILLS, "Sales", "Negotiation", "CRM", "Account Management", "Partnerships", "Strategy", "Marketing", "Leadership", "Communication", "Project Management"])];
export const INTEREST_OPTIONS = interests;
export const PROFILE_IMAGE_BUCKET = "profile-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export interface ProfileRecord {
  id: string;
  name: string | null;
  age: number | null;
  organisation: string | null;
  location: string | null;
  job_title: string | null;
  bio: string | null;
  skills: (string | null)[] | null;
  experience: number | null;
  industries: (string | null)[] | null;
  interests: (string | null)[] | null;
  current_projects: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  image_path: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ProfileDraft {
  name: string;
  age: string;
  organisation: string;
  location: string;
  job_title: string;
  bio: string;
  skills: string[];
  experience: string;
  industries: string[];
  interests: string[];
  current_projects: string;
  portfolio_url: string;
  linkedin_url: string;
  github_url: string;
}

export interface ProfileIssue { field: keyof ProfileDraft | "image_path"; message: string; }
export const PROFILE_STEPS = ["About you", "Your work", "Skills & interests", "Photo & links"] as const;
export const PROFILE_SECTIONS = ["about", "work", "skills", "photo"] as const;
export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

export function uniqueLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim())
    .filter((item) => { const key = item.toLowerCase(); if (!key || seen.has(key)) return false; seen.add(key); return true; });
}

export function createProfileDraft(profile: ProfileRecord | null, metadata: Record<string, unknown>): ProfileDraft {
  const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
  const savedIndustries = uniqueLabels(profile?.industries?.length ? profile.industries : metadata.industries);
  const listedIndustries = savedIndustries.map((industry) => INDUSTRIES.find((option) => option.toLowerCase() === industry.toLowerCase())).filter((item): item is (typeof INDUSTRIES)[number] => !!item);
  return {
    name: text(profile?.name) || text(metadata.full_name),
    age: profile?.age == null ? "" : String(profile.age),
    organisation: text(profile?.organisation), location: text(profile?.location), job_title: text(profile?.job_title),
    bio: text(profile?.bio), skills: uniqueLabels(profile?.skills),
    experience: profile?.experience == null ? "" : String(profile.experience),
    industries: [...new Set(listedIndustries)].slice(0, 3),
    interests: uniqueLabels(profile?.interests?.length ? profile.interests : metadata.interests),
    current_projects: text(profile?.current_projects), portfolio_url: text(profile?.portfolio_url),
    linkedin_url: text(profile?.linkedin_url), github_url: text(profile?.github_url),
  };
}

const stepFields: (keyof ProfileDraft | "image_path")[][] = [
  ["name", "location", "bio", "age"],
  ["job_title", "experience", "industries", "organisation"],
  ["skills", "interests", "current_projects"],
  ["image_path", "portfolio_url", "linkedin_url", "github_url"],
];

export function fieldStep(field: ProfileIssue["field"]): number {
  return stepFields.findIndex((fields) => fields.includes(field));
}

function validUrl(value: string): boolean {
  if (!value.trim()) return true;
  try { const url = new URL(value.trim()); return ["http:", "https:"].includes(url.protocol); } catch { return false; }
}

export function validateProfileDraft(draft: ProfileDraft, hasPhoto: boolean, step?: number): ProfileIssue | null {
  const issue = (field: ProfileIssue["field"], message: string): ProfileIssue | null =>
    step === undefined || fieldStep(field) === step ? { field, message } : null;
  const checks: [ProfileIssue["field"], boolean, string][] = [
    ["name", !!draft.name.trim() && draft.name.trim().length <= 120, "Enter your name (up to 120 characters)."],
    ["location", !!draft.location.trim() && draft.location.trim().length <= 160, "Tell us where you’re based (up to 160 characters)."],
    ["bio", !!draft.bio.trim() && draft.bio.trim().length <= 600, "Add a short bio (up to 600 characters)."],
    ["age", !draft.age || (/^\d+$/.test(draft.age) && Number(draft.age) >= 1 && Number(draft.age) <= 120), "Enter a whole-number age between 1 and 120, or leave it empty."],
    ["job_title", !!draft.job_title.trim() && draft.job_title.trim().length <= 160, "Choose or enter your role (up to 160 characters)."],
    ["experience", /^\d+$/.test(draft.experience) && Number(draft.experience) <= 100, "Enter your years of experience as a whole number from 0 to 100."],
    ["industries", draft.industries.length >= 1 && draft.industries.length <= 3 && draft.industries.every((item) => INDUSTRIES.some((option) => option === item)), "Choose between 1 and 3 industries from the list."],
    ["organisation", draft.organisation.trim().length <= 160, "Keep your organisation name within 160 characters."],
    ["skills", draft.skills.length >= 1 && draft.skills.every((item) => item.trim().length > 0 && item.length <= 80), "Choose or add at least one skill. Each skill can have up to 80 characters."],
    ["interests", draft.interests.every((item) => item.trim().length > 0 && item.length <= 80), "Keep each interest within 80 characters."],
    ["current_projects", draft.current_projects.trim().length <= 600, "Keep your project description within 600 characters."],
    ["image_path", hasPhoto, "Add a profile photo to finish your Hi5."],
    ["portfolio_url", validUrl(draft.portfolio_url), "Enter a full portfolio URL starting with https:// or http://."],
    ["linkedin_url", validUrl(draft.linkedin_url), "Enter a full LinkedIn URL starting with https:// or http://."],
    ["github_url", validUrl(draft.github_url), "Enter a full GitHub URL starting with https:// or http://."],
  ];
  for (const [field, valid, message] of checks) { if (!valid) { const result = issue(field, message); if (result) return result; } }
  return null;
}

/** Completion is derived from the stored required fields, not a browser flag. */
export function requiredProfileIssue(profile: ProfileRecord | null, photoExists: boolean): ProfileIssue | null {
  if (!profile) return { field: "name", message: "Complete your profile details." };
  const draft = createProfileDraft(profile, {});
  // Check the saved industry values themselves before normalising suggestions.
  draft.industries = uniqueLabels(profile.industries);
  draft.age = ""; draft.organisation = ""; draft.interests = []; draft.current_projects = "";
  draft.portfolio_url = ""; draft.linkedin_url = ""; draft.github_url = "";
  return validateProfileDraft(draft, photoExists);
}

export function isProfileComplete(profile: ProfileRecord | null, photoExists: boolean): boolean {
  return !requiredProfileIssue(profile, photoExists);
}

/** Only include the requested section so unrelated saved fields stay untouched. */
export function profileSectionPayload(draft: ProfileDraft, imagePath: string, section: ProfileSection): Record<string, unknown> {
  const optional = (value: string) => value.trim() || null;
  const url = (value: string) => value.trim() ? new URL(value.trim()).href : null;
  switch (section) {
    case "about": return { name: draft.name.trim(), age: draft.age ? Number(draft.age) : null, location: draft.location.trim(), bio: draft.bio.trim() };
    case "work": return { organisation: optional(draft.organisation), job_title: draft.job_title.trim(), experience: Number(draft.experience), industries: [...draft.industries] };
    case "skills": return { skills: uniqueLabels(draft.skills), interests: uniqueLabels(draft.interests), current_projects: optional(draft.current_projects) };
    case "photo": return { portfolio_url: url(draft.portfolio_url), linkedin_url: url(draft.linkedin_url), github_url: url(draft.github_url), image_path: imagePath };
  }
}

export function profilePayload(draft: ProfileDraft, imagePath: string): Record<string, unknown> {
  return Object.assign({}, ...PROFILE_SECTIONS.map((section) => profileSectionPayload(draft, imagePath, section)));
}
