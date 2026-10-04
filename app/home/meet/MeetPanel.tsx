"use client";

import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { MeetIcon } from "./MeetIcon";
import { MeetingPreferencesForm } from "./MeetingPreferencesForm";
import { getMeetReturnPath } from "./returnPath";
import styles from "./Meet.module.css";

export function MeetPanel({ returnTo }: { returnTo: string | null }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    const shellControls = Array.from(document.querySelectorAll<HTMLElement>(
      'header[aria-label="Account controls"], nav[aria-label="Main navigation"], a[href="#home-content"]',
    )).map((element) => ({ element, inert: element.inert }));
    for (const { element } of shellControls) element.inert = true;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      for (const { element, inert } of shellControls) element.inert = inert;
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    const dialog = dialogRef.current;
    if (!viewport || !dialog) return;
    function fitAboveKeyboard() {
      if (!viewport || !dialog || Math.abs(viewport.scale - 1) > 0.01) return;
      dialog.style.setProperty("--meet-viewport-height", `${viewport.height}px`);
      dialog.style.setProperty("--meet-viewport-top", `${viewport.offsetTop}px`);

      const control = document.activeElement;
      if (!(control instanceof HTMLElement) || !dialog.contains(control)) return;
      const scrollArea = control.closest<HTMLElement>("[data-meet-scroll]");
      if (!scrollArea) return;
      const bounds = scrollArea.getBoundingClientRect();
      const rect = control.getBoundingClientRect();
      if (rect.bottom > bounds.bottom - 12) scrollArea.scrollTop += rect.bottom - bounds.bottom + 12;
      else if (rect.top < bounds.top + 12) scrollArea.scrollTop -= bounds.top + 12 - rect.top;
    }
    fitAboveKeyboard();
    viewport.addEventListener("resize", fitAboveKeyboard);
    viewport.addEventListener("scroll", fitAboveKeyboard);
    return () => {
      viewport.removeEventListener("resize", fitAboveKeyboard);
      viewport.removeEventListener("scroll", fitAboveKeyboard);
    };
  }, []);

  function close() {
    const previousPage = getMeetReturnPath(document.referrer, window.location.origin);
    router.replace(returnTo ?? previousPage ?? "/home/discover");
  }

  function handleDialogKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled):not([tabindex="-1"]), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
      ) ?? []).filter((element) => !element.closest("[inert]") && element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus({ preventScroll: true });
      }
    }
  }

  return (
    <div ref={dialogRef} className={styles.overlay} role="dialog" aria-modal="true"
      aria-labelledby="meet-title" aria-describedby="meet-description" tabIndex={-1} onKeyDown={handleDialogKeys}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <span className={styles.grabHandle} aria-hidden="true" />
          <div className={styles.titleRow}>
            <div className={styles.titleGroup}>
              <span className={styles.headerIcon}><MeetIcon name="coffee" size={21} /></span>
              <h1 id="meet-title">Meet</h1>
            </div>
            <button ref={closeRef} type="button" className={styles.closeButton} aria-label="Close Meet"
              onClick={close}><MeetIcon name="close" size={19} /></button>
          </div>
          <p id="meet-description">Set your preferences and let your connections know how you&apos;d like to meet.</p>
        </header>
        <MeetingPreferencesForm />
      </div>
    </div>
  );
}
