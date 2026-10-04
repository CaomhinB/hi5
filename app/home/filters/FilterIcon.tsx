import type { ReactNode } from "react";

const icons = {
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 21v-2a6 6 0 0 0-4-5.65" /></>,
  person: <><circle cx="12" cy="7" r="3" /><path d="M5 21v-3a7 7 0 0 1 14 0v3M8 21h8" /></>,
  rocket: <><path d="M14 4c3-2 6-2 7-1 1 1 1 4-1 7l-6 7-7-7 7-6ZM7 10H3l-1 6 5-1M14 17l-1 5 6-1v-4M6 18l-3 3" /><circle cx="16" cy="8" r="2" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3M3 12c6 3 12 3 18 0M12 12v4" /></>,
  graduation: <><path d="m2 9 10-5 10 5-10 5L2 9ZM6 11v6c4 3 8 3 12 0v-6M22 9v7" /></>,
  chart: <><rect x="3" y="14" width="4" height="7" rx="1" /><rect x="10" y="9" width="4" height="12" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" /></>,
  network: <><circle cx="12" cy="4" r="2" /><circle cx="4" cy="12" r="2" /><circle cx="20" cy="12" r="2" /><circle cx="12" cy="20" r="2" /><circle cx="12" cy="12" r="2" /><path d="M12 6v4M6 12h4M14 12h4M12 14v4" /></>,
  sparkles: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM4 2v4M2 4h4" /></>,
  location: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  house: <><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" /></>,
  building: <><rect x="3" y="7" width="8" height="14" rx="1" /><path d="M11 21h10V3H11v4M6 11h2M6 15h2M14 7h3M14 11h3M14 15h3M15 21v-3" /></>,
  wrench: <path d="M21 7a6 6 0 0 1-8 6L6 20a3 3 0 0 1-4-4l7-7a6 6 0 0 1 6-8l-3 4 3 3 6-1Z" />,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  reset: <><path d="M3 10a9 9 0 1 1 1.5 8M3 3v7h7" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
} satisfies Record<string, ReactNode>;

export type FilterIconName = keyof typeof icons;

export function FilterIcon({ name, size = 18 }: { name: FilterIconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      {icons[name]}
    </svg>
  );
}
