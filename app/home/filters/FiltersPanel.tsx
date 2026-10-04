"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FilterIcon } from "./FilterIcon";
import type { FilterIconName } from "./FilterIcon";
import {
  createDefaultFilters, DISTANCE_OPTIONS, EXPERIENCE_LEVELS, INDUSTRIES,
  LOOKING_FOR_OPTIONS, MAX_SKILLS, OPEN_TO_OPTIONS, PROFESSIONS, SKILLS, WORK_ARRANGEMENTS,
} from "./filterOptions";
import type { Filters } from "./filterOptions";
import { getFiltersSnapshot, parseStoredFilters, saveFilters, subscribeToFilters } from "./filterStorage";
import { getFilterReturnPath } from "./returnPath";
import { SearchableSelect } from "./SearchableSelect";
import styles from "./Filters.module.css";

const serverSnapshot = () => null;

function FilterSection({ id, icon, title, detail, children }: {
  id: string; icon: FilterIconName; title: string; detail?: string; children: ReactNode;
}) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={styles.sectionHeading}>
        <h2 id={id}><FilterIcon name={icon} size={17} /><span>{title}</span></h2>
        {detail && <span className={styles.sectionDetail}>{detail}</span>}
      </div>
      <div className={styles.sectionControls}>{children}</div>
    </section>
  );
}

function ChoicePills<T extends string>({ labelledBy, options, value, onChange, columns }: {
  labelledBy: string; options: readonly T[]; value: T; onChange: (value: T) => void; columns?: string;
}) {
  return (
    <div className={styles.pills} role="group" aria-labelledby={labelledBy}
      style={{ gridTemplateColumns: columns ?? `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button key={option} type="button" className={styles.choicePill}
          aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>
      ))}
    </div>
  );
}

export function FiltersPanel({ returnTo }: { returnTo: string | null }) {
  const router = useRouter();
  const stored = useSyncExternalStore(subscribeToFilters, getFiltersSnapshot, serverSnapshot);
  const savedFilters = useMemo(() => parseStoredFilters(stored), [stored]);
  const [draft, setDraft] = useState<Filters | null>(null);
  const [resetCount, setResetCount] = useState(0);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const filters = draft ?? savedFilters;
  const distanceIndex = DISTANCE_OPTIONS.findIndex((option) => option.value === filters.location);
  const distance = DISTANCE_OPTIONS[distanceIndex];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    // The existing /home shell stays mounted beneath this route panel.
    const shellControls = Array.from(document.querySelectorAll<HTMLElement>(
      'header[aria-label="Account controls"], nav[aria-label="Main navigation"], a[href="#home-content"]',
    )).map((element) => ({ element, inert: element.inert }));
    for (const { element } of shellControls) element.inert = true;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      for (const { element, inert } of shellControls) element.inert = inert;
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    const dialog = dialogRef.current;
    if (!viewport || !dialog) return;
    function fitAboveKeyboard() {
      if (!viewport || !dialog || Math.abs(viewport.scale - 1) > 0.01) return;
      dialog.style.setProperty("--filters-viewport-height", `${viewport.height}px`);
      dialog.style.setProperty("--filters-viewport-top", `${viewport.offsetTop}px`);

      // Scroll only the filter sections to keep the active control above the keyboard.
      const control = dialog.querySelector<HTMLElement>(
        '[data-filter-scroll] [role="combobox"][aria-expanded="true"]',
      );
      const scrollArea = control?.closest<HTMLElement>("[data-filter-scroll]");
      if (!control || !scrollArea) return;
      const bounds = scrollArea.getBoundingClientRect();
      const rect = control.getBoundingClientRect();
      if (rect.bottom > bounds.bottom - 12) scrollArea.scrollTop += rect.bottom - bounds.bottom + 12;
      else if (rect.top < bounds.top + 12) scrollArea.scrollTop -= bounds.top + 12 - rect.top;
    }
    fitAboveKeyboard();
    viewport.addEventListener("resize", fitAboveKeyboard);
    viewport.addEventListener("scroll", fitAboveKeyboard);
    return () => {
      viewport.removeEventListener("resize", fitAboveKeyboard);
      viewport.removeEventListener("scroll", fitAboveKeyboard);
    };
  }, []);

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setDraft({ ...filters, [key]: value });
    setError("");
  }

  function returnToApp() {
    const previousPage = getFilterReturnPath(document.referrer, window.location.origin);
    router.replace(returnTo ?? previousPage ?? "/home/discover");
  }

  function apply() {
    try {
      saveFilters(filters);
      returnToApp();
    } catch {
      setError("Your filters couldn’t be saved. Please allow browser storage and try again.");
    }
  }

  function handleDialogKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      // An open dropdown handles Escape first, leaving the Filters panel open.
      if (dialogRef.current?.querySelector('[role="combobox"][aria-expanded="true"]')) return;
      event.preventDefault();
      returnToApp();
    } else if (event.key === "Tab") {
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled):not([tabindex="-1"]), input:not(:disabled), [tabindex="0"]',
      ) ?? []).filter((element) => !element.closest("[inert]") && element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last?.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus({ preventScroll: true });
      }
    }
  }

  return (
    <div ref={dialogRef} className={styles.overlay} role="dialog" aria-modal="true"
      aria-labelledby="filters-title" aria-describedby="filters-description" tabIndex={-1}
      onKeyDown={handleDialogKeys}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <span className={styles.grabHandle} aria-hidden="true" />
          <div className={styles.titleRow}>
            <h1 id="filters-title">Filters</h1>
            <button ref={closeRef} type="button" className={styles.closeButton}
              aria-label="Close filters" onClick={returnToApp}><FilterIcon name="close" size={19} /></button>
          </div>
          <p id="filters-description" className={styles.srOnly}>Choose who you want to meet. Apply Filters to save your choices.</p>
        </header>

        <div key={resetCount} className={styles.sections} data-filter-scroll>
          <FilterSection id="looking-for-heading" icon="sparkles" title="I'm looking for…">
            <div className={styles.lookingGrid} role="group" aria-labelledby="looking-for-heading">
              {LOOKING_FOR_OPTIONS.map((option) => (
                <button key={option.value} type="button" className={styles.lookingButton}
                  aria-pressed={filters.lookingFor === option.value} onClick={() => update("lookingFor", option.value)}>
                  <FilterIcon name={option.icon} size={22} /><span>{option.label}</span>
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection id="location-heading" icon="location" title="Location" detail={distance.description}>
            <div className={styles.distanceControl} style={{ "--distance-progress": `${distanceIndex * 25}%` } as CSSProperties}>
              <input className={styles.distanceSlider} type="range" min={0} max={4} step={1}
                value={distanceIndex} aria-labelledby="location-heading" aria-valuetext={distance.description}
                onChange={(event) => update("location", DISTANCE_OPTIONS[Number(event.target.value)].value)} />
              <div className={styles.distanceLabels}>
                {DISTANCE_OPTIONS.map((option) => (
                  <button key={option.label} type="button" aria-pressed={filters.location === option.value}
                    aria-label={option.description} onClick={() => update("location", option.value)}>{option.label}</button>
                ))}
              </div>
            </div>
          </FilterSection>

          <FilterSection id="work-heading" icon="house" title="Work arrangement">
            <ChoicePills labelledBy="work-heading" options={WORK_ARRANGEMENTS} value={filters.workArrangement}
              onChange={(value) => update("workArrangement", value)} />
          </FilterSection>

          <FilterSection id="industry-heading" icon="building" title="Industry">
            <SearchableSelect label="Industries" labelledBy="industry-heading" placeholder="Select industries"
              options={INDUSTRIES} value={filters.industries} onChange={(value) => update("industries", value)} multiple searchInside />
          </FilterSection>

          <FilterSection id="profession-heading" icon="person" title="Role / Profession">
            <SearchableSelect label="Profession" labelledBy="profession-heading" placeholder="Select or type a profession"
              options={PROFESSIONS} value={filters.profession ? [filters.profession] : []}
              onChange={(value) => update("profession", value[0] ?? null)} allowCustom />
          </FilterSection>

          <FilterSection id="experience-heading" icon="chart" title="Experience level">
            <ChoicePills labelledBy="experience-heading" options={EXPERIENCE_LEVELS} value={filters.experienceLevel}
              onChange={(value) => update("experienceLevel", value)} />
          </FilterSection>

          <FilterSection id="skills-heading" icon="wrench" title="Skills">
            <SearchableSelect label="Skills" labelledBy="skills-heading" placeholder="Add skills (e.g. Python, Marketing, Sales...)"
              options={SKILLS} value={filters.skills} onChange={(value) => update("skills", value)}
              multiple allowCustom maxSelections={MAX_SKILLS} chevron="chevronRight" />
          </FilterSection>

          <FilterSection id="open-to-heading" icon="heart" title="Open to">
            <ChoicePills labelledBy="open-to-heading" options={OPEN_TO_OPTIONS} value={filters.openTo}
              columns="minmax(0, 0.65fr) minmax(0, 1.5fr) minmax(0, 1.15fr) minmax(0, 1.1fr)"
              onChange={(value) => update("openTo", value)} />
          </FilterSection>
        </div>

        <footer className={styles.footer}>
          {error && <p className={styles.saveError} role="alert">{error}</p>}
          <div className={styles.footerActions}>
            <button type="button" className={styles.resetButton} onClick={() => {
              setDraft(createDefaultFilters());
              setResetCount((count) => count + 1);
              setError("");
            }}><FilterIcon name="reset" size={18} />Reset</button>
            <button type="button" className={styles.applyButton} onClick={apply}>Apply Filters</button>
          </div>
        </footer>
      </div>
      <div id="filters-popovers" className={styles.popoverRoot} />
    </div>
  );
}
