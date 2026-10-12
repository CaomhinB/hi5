"use client";

import { useState } from "react";
import Image from "next/image";
import { DiscoveryIcon } from "../discover/DiscoveryIcon";
import { profileImage } from "./hi5Api";
import { candidateStatus } from "./hi5Model";
import type { Hi5Candidate } from "./hi5Model";
import { Hi5Icon } from "./Hi5Icon";
import styles from "./Hi5.module.css";

export function Hi5Avatar({ candidate, selected, disabled, remainingDays, onSelect }: {
  candidate: Hi5Candidate; selected: boolean; disabled: boolean; remainingDays: number; onSelect: () => void;
}) {
  const image = profileImage(candidate.profile);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const name = candidate.profile.name || "Professional";
  const state = remainingDays === 0 && ["pending", "hi_sent"].includes(candidate.state) ? "expired" : candidate.state;
  const label = candidateStatus(state, remainingDays);
  return <button type="button" className={styles.avatarButton} aria-pressed={selected} disabled={disabled}
    aria-label={`${name}: ${label}. Show profile.`} onClick={onSelect}>
    <span className={styles.avatar}>
      {image && image !== failedImage ? <Image src={image} alt="" fill sizes="56px" onError={() => setFailedImage(image)} />
        : <span>{name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}</span>}
      <span className={styles.avatarBadge} data-state={state}>
        {state === "passed" ? <DiscoveryIcon name="close" size={12} />
          : <Hi5Icon name={state === "matched" ? "check" : state === "hi_sent" ? "send" : "clock"} size={12} />}
      </span>
    </span>
    <span className={styles.avatarName}>{name.split(/\s+/)[0]}</span>
    <span className={styles.avatarStatus} data-state={state}>{label}</span>
  </button>;
}
