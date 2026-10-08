"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCurrentProfile } from "../../lib/supabase/currentProfile";
import { profilePhotoUrl } from "../../onboarding/onboardingApi";
import styles from "./HeaderButton.module.css";

export function ProfileMenu() {
  const { context } = useCurrentProfile();
  const [failedImage, setFailedImage] = useState("");
  const profile = context?.profile;
  const image = context?.photoExists && profile?.image_path ? profilePhotoUrl(profile.image_path) : "";
  const imageKey = `${context?.authUserId ?? "guest"}:${image}:${profile?.updated_at ?? ""}`;
  const name = profile?.name || (typeof context?.metadata.full_name === "string" ? context.metadata.full_name : "");
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <Link href="/home/profile" className={styles.button} aria-label="My profile" title="My profile">
      {image && failedImage !== imageKey ? (
        <Image key={imageKey} src={image} alt="" fill sizes="(min-width: 768px) 48px, 44px"
          className={styles.profileImage} onError={() => setFailedImage(imageKey)} />
      ) : initials ? <span className={styles.profileInitials} aria-hidden="true">{initials}</span> : (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></svg>
      )}
    </Link>
  );
}
