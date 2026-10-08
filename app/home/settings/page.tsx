import type { Metadata } from "next";
import { SettingsExperience } from "./SettingsExperience";
import styles from "./Settings.module.css";

export const metadata: Metadata = { title: "Settings | Hi5" };

export default function SettingsPage() {
  return (
    <section className={styles.page} aria-labelledby="settings-title">
      <header className={styles.header}>
        <h1 id="settings-title">Settings</h1>
        <p>Make Hi5 work for you.</p>
      </header>
      <SettingsExperience />
    </section>
  );
}
