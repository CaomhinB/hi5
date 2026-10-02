import styles from "./PlaceholderPage.module.css";

// Temporary content for empty route stubs. Replace each page independently.
export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className={styles.page}>
      <h1 className="h-section">{title}</h1>
      <p className="lead">{description}</p>
    </section>
  );
}
