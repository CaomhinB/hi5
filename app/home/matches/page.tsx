import type { Metadata } from "next";
import { MatchesExperience } from "./MatchesExperience";
import styles from "./Matches.module.css";

export const metadata: Metadata = { title: "Matches | Hi5" };

export default function MatchesPage() {
  return (
    <section className={styles.page} aria-labelledby="matches-title">
      <header className={styles.header}>
        <h1 id="matches-title">Matches</h1>
        <p>People who said Hi back</p>
      </header>
      <MatchesExperience />
    </section>
  );
}
