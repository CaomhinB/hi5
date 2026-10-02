import type { Viewport } from "next";
import type { ReactNode } from "react";
import { BottomNavbar } from "../components/layout/BottomNavbar";
import { NotificationButton } from "../components/layout/NotificationButton";
import { ProfileMenu } from "../components/layout/ProfileMenu";
import styles from "./home-layout.module.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <a href="#home-content" className={styles.skipLink}>
        Skip to content
      </a>

      <header className={styles.header} aria-label="Account controls">
        <div className={styles.headerInner}>
          <NotificationButton />
          <ProfileMenu />
        </div>
      </header>

      <main id="home-content" className={styles.content} tabIndex={-1}>
        {children}
      </main>

      <BottomNavbar />
    </div>
  );
}
