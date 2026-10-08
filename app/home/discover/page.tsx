import { DiscoveryExperience } from "./DiscoveryExperience";
import styles from "./Discovery.module.css";

export default function DiscoverPage() {
  return (
    <section className={styles.page} aria-labelledby="discover-title">
      <header className={styles.header}>
        <h1 id="discover-title">Discover</h1>
        <p>Find people beyond your Hi5</p>
      </header>
      <DiscoveryExperience />
    </section>
  );
}
