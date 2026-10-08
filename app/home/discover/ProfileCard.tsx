"use client";

import { useState } from "react";
import Image from "next/image";
import { DiscoveryIcon } from "./DiscoveryIcon";
import type { DiscoveryProfile } from "./discoveryProfile";
import styles from "./Discovery.module.css";

export function ProfileCard({
  profile,
  active,
}: {
  profile: DiscoveryProfile;
  active: boolean;
}) {
  const [failedImage, setFailedImage] = useState<DiscoveryProfile["image"]>(null);
  const initials = profile.name.split(" ").map((part) => part[0]).slice(0, 2).join("");

  return (
    <article className={styles.card} aria-labelledby={`profile-${profile.id}`}>
      <div className={styles.photo}>
        {profile.image && profile.image !== failedImage ? (
          <Image
            src={profile.image}
            alt={`Portrait of ${profile.name}`}
            fill
            sizes="(max-width: 440px) calc(100vw - 48px), 392px"
            loading="eager"
            fetchPriority={active ? "high" : "auto"}
            onError={() => setFailedImage(profile.image)}
            draggable={false}
            className={styles.headshot}
          />
        ) : (
          <div
            className={styles.portraitPlaceholder}
            data-tone={profile.placeholderTone}
            role="img"
            aria-label={`Profile image placeholder for ${profile.name}`}
          >
            <span className={styles.portraitInitials}>{initials}</span>
            <span className={styles.portraitHalo} />
          </div>
        )}
      </div>

      <div className={styles.profileInfo}>
        <div className={styles.nameRow}>
          <h2 id={`profile-${profile.id}`} title={profile.name}>{profile.name}</h2>
          {profile.verified && (
            <span className={styles.verified} role="img" aria-label="Verified profile">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="m12 1 3 2 3.6.4 1.1 3.4 2.8 2.3-1.1 3.4.4 3.6-3.1 1.8-1.8 3.1-3.6-.4L10 23l-2.3-2.8-3.4-1.1L4 15.5 2 12.5l2-3L4.4 6l3.4-1.1L10.1 2 12 1Z" />
                <path d="m7.5 12 3 3 6-6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </div>
        <p className={styles.professionalTitle} title={profile.professionalTitle}>{profile.professionalTitle}</p>

        <ul className={styles.details} aria-label="Professional details">
          <li title={profile.location}><DiscoveryIcon name="location" size={13} /><span>{profile.location}</span></li>
          <li title={profile.industry}><DiscoveryIcon name="industry" size={13} /><span>{profile.industry}</span></li>
          <li title={profile.experience}><DiscoveryIcon name="experience" size={14} /><span>{profile.experience}</span></li>
        </ul>

        <p className={styles.biography}>{profile.biography}</p>
        <ul className={styles.skills} aria-label="Skills and interests">
          {profile.skills.map((skill) => (
            <li key={skill.label} className={styles.skill} data-tone={skill.tone} title={skill.label}>
              {skill.label}
            </li>
          ))}
        </ul>

        <div className={styles.whyProfile}>
          <DiscoveryIcon name="sparkles" size={16} className={styles.sparkle} />
          <div>
            <h3>Why this profile?</h3>
            <p>{profile.whyThisProfile}</p>
          </div>
          <DiscoveryIcon name="chevron" size={14} className={styles.chevron} />
        </div>
      </div>
    </article>
  );
}
