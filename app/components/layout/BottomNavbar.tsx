"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNavbar.module.css";

const navigationItems = [
  {
    label: "Discover",
    href: "/home/discover",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" />
      </>
    ),
  },
  {
    label: "Matches",
    href: "/home/matches",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
  },
  {
    label: "Hi5",
    href: "/home/hi5",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 21v-2a6 6 0 0 0-4-5.65" />
      </>
    ),
  },
  {
    label: "Messages",
    href: "/home/messages",
    icon: (
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H5l-3 2V11.5a9.5 9.5 0 0 1 19 0Z" />
    ),
  },
  {
    label: "Settings",
    href: "/home/settings",
    icon: (
      <>
        <path d="m9.5 3-.6 2.3-1.8 1-2.2-.6-2.5 4.3 1.6 1.7v2.1l-1.6 1.7 2.5 4.3 2.2-.6 1.8 1 .6 2.3h5l.6-2.3 1.8-1 2.2.6 2.5-4.3-1.6-1.7v-2.1l1.6-1.7-2.5-4.3-2.2.6-1.8-1L14.5 3Z" />
        <circle cx="12" cy="12.75" r="3" />
      </>
    ),
  },
];

export function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav className={styles.navbar} aria-label="Main navigation">
      <ul className={styles.list}>
        {navigationItems.map(({ label, href, icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href} className={styles.item}>
              <Link
                href={href}
                className={`${styles.link}${isActive ? ` ${styles.active}` : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  {icon}
                </svg>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
