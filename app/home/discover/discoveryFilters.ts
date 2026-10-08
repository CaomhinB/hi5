import type { Filters } from "../filters/filterOptions";
import { getSearchWords } from "../../lib/searchWords";

export interface DiscoveryFilters {
  industries: string[];
  professionWords: string[];
  skillWords: string[];
  experienceMin: number | null;
  experienceMax: number | null;
}

const EXPERIENCE_RANGES: Record<Filters["experienceLevel"], readonly [number | null, number | null]> = {
  "Any": [null, null],
  "0–2 yrs": [0, 2],
  "3–5 yrs": [3, 5],
  "5–10 yrs": [5, 10],
  "10+ yrs": [10, null],
};

/** Map only fields supported by user_profiles; canonical ordering keeps queries stable. */
export function getDiscoveryFilters(filters: Filters): DiscoveryFilters {
  const [experienceMin, experienceMax] = EXPERIENCE_RANGES[filters.experienceLevel];
  return {
    industries: [...new Set(filters.industries)].sort(),
    professionWords: getSearchWords(filters.profession ?? "").sort(),
    skillWords: [...new Set(filters.skills.flatMap(getSearchWords))].sort(),
    experienceMin,
    experienceMax,
  };
}

export function hasDiscoveryFilters(filters: DiscoveryFilters): boolean {
  return !!(filters.industries.length || filters.professionWords.length || filters.skillWords.length
    || filters.experienceMin !== null || filters.experienceMax !== null);
}
