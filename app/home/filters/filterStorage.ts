import {
  createDefaultFilters, DISTANCE_OPTIONS, EXPERIENCE_LEVELS, INDUSTRIES,
  LOOKING_FOR_OPTIONS, MAX_SKILLS, OPEN_TO_OPTIONS, WORK_ARRANGEMENTS,
} from "./filterOptions";
import type { Filters } from "./filterOptions";

export const FILTERS_STORAGE_KEY = "hi5.filters.v1";
const FILTERS_CHANGED_EVENT = "hi5:filters-changed";

function isOption<T>(value: unknown, options: readonly T[]): value is T {
  return options.includes(value as T);
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function parseStoredFilters(raw: string | null): Filters {
  const defaults = createDefaultFilters();
  if (!raw) return defaults;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
    const saved = value as Record<string, unknown>;
    return {
      lookingFor: isOption(saved.lookingFor, LOOKING_FOR_OPTIONS.map((option) => option.value))
        ? saved.lookingFor : defaults.lookingFor,
      location: isOption(saved.location, DISTANCE_OPTIONS.map((option) => option.value))
        ? saved.location : defaults.location,
      workArrangement: isOption(saved.workArrangement, WORK_ARRANGEMENTS)
        ? saved.workArrangement : defaults.workArrangement,
      industries: uniqueStrings(saved.industries).filter((industry) => isOption(industry, INDUSTRIES)),
      profession: typeof saved.profession === "string" ? saved.profession.trim() || null : null,
      experienceLevel: isOption(saved.experienceLevel, EXPERIENCE_LEVELS)
        ? saved.experienceLevel : defaults.experienceLevel,
      skills: uniqueStrings(saved.skills).slice(0, MAX_SKILLS),
      openTo: isOption(saved.openTo, OPEN_TO_OPTIONS) ? saved.openTo : defaults.openTo,
    };
  } catch {
    return defaults;
  }
}

// A string snapshot stays stable between renders and is safe during hydration.
export function getFiltersSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(FILTERS_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function subscribeToFilters(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === FILTERS_STORAGE_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(FILTERS_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(FILTERS_CHANGED_EVENT, callback);
  };
}

/** Read saved filters from a client component; missing/invalid data uses defaults. */
export function readStoredFilters(): Filters {
  return parseStoredFilters(getFiltersSnapshot());
}

/** Throws if storage is unavailable so the caller can keep the draft on screen. */
export function saveFilters(filters: Filters) {
  const normalized = parseStoredFilters(JSON.stringify(filters));
  window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(FILTERS_CHANGED_EVENT));
}
