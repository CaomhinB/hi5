import Image from "next/image";
import type { ProfileRecord } from "../../onboarding/profileModel";
import { profileImage } from "../hi5/hi5Api";
import styles from "./Messages.module.css";

export function MessageAvatar({ profile, large = false }: { profile: ProfileRecord; large?: boolean }) {
  const image = profileImage(profile);
  const initials = (profile.name || "Professional").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("");
  return <span className={`${styles.avatar} ${large ? styles.largeAvatar : ""}`}>
    {image ? <Image src={image} alt="" fill sizes={large ? "80px" : "48px"} /> : <span aria-hidden="true">{initials}</span>}
  </span>;
}
