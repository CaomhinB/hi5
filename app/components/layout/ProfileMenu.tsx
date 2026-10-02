import Image from "next/image";
import styles from "./HeaderButton.module.css";

export function ProfileMenu() {
  return (
    <button type="button" className={styles.button} aria-label="Your profile">
      <Image
        src="/logo.png"
        alt=""
        fill
        sizes="(min-width: 768px) 48px, 44px"
        className={styles.profileImage}
      />
    </button>
  );
}
