"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProfileCard } from "../discover/ProfileCard";
import { DiscoveryIcon } from "../discover/DiscoveryIcon";
import type { DiscoveryProfile } from "../discover/discoveryProfile";
import sheet from "../discover/DiscoveryProfileOverlay.module.css";
import styles from "./Hi5.module.css";

/** Native modal shares the full-profile sheet shape and Safari viewport fitting. */
export function MyCardPreview({ profile, opener, onClose }: {
  profile: DiscoveryProfile; opener: HTMLButtonElement; onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const backdrop = useRef(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    if (!dialog || !panel) return;
    const body = document.body;
    const scrollX = window.scrollX, scrollY = window.scrollY;
    const previous = { overflow: body.style.overflow, position: body.style.position,
      top: body.style.top, left: body.style.left, width: body.style.width, paddingRight: body.style.paddingRight };
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    if (gutter > 0) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gutter}px`;
    Object.assign(body.style, { overflow: "hidden", position: "fixed", top: `${-scrollY}px`, left: `${-scrollX}px`, width: "100%" });
    const viewport = window.visualViewport;
    function fit() {
      if (!viewport || !dialog || Math.abs(viewport.scale - 1) > 0.01) return;
      dialog.style.setProperty("--profile-viewport-height", `${viewport.height}px`);
      dialog.style.setProperty("--profile-viewport-top", `${viewport.offsetTop}px`);
    }
    fit(); dialog.showModal(); closeRef.current?.focus({ preventScroll: true });
    const frame = requestAnimationFrame(() => {
      dialog.dataset.ready = "true";
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { dialog.dataset.entered = "true"; return; }
      const animation = panel.animate([
        { transform: `translate3d(0, ${panel.getBoundingClientRect().height + 32}px, 0)` },
        { transform: "translate3d(0, 0, 0)" },
      ], { duration: 650, easing: "cubic-bezier(0.25, 0.1, 0.25, 1)" });
      animationRef.current = animation;
      void animation.finished.then(() => { if (dialog.isConnected) dialog.dataset.entered = "true"; }).catch(() => {});
    });
    viewport?.addEventListener("resize", fit); viewport?.addEventListener("scroll", fit);
    return () => {
      cancelAnimationFrame(frame); animationRef.current?.cancel();
      viewport?.removeEventListener("resize", fit); viewport?.removeEventListener("scroll", fit);
      dialog.close(); Object.assign(body.style, previous);
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
      if (opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [opener]);

  useEffect(() => {
    if (!closing) return;
    const panel = panelRef.current;
    if (panel) {
      const transform = getComputedStyle(panel).transform;
      animationRef.current?.cancel();
      animationRef.current = panel.animate([{ transform }, { transform: `translate3d(0, ${panel.getBoundingClientRect().height + 32}px, 0)` }],
        { duration: 280, easing: "ease-in", fill: "forwards" });
    }
    const timer = setTimeout(onClose, 300);
    return () => clearTimeout(timer);
  }, [closing, onClose]);

  function close() {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) onClose();
    else setClosing(true);
  }

  return <dialog ref={dialogRef} className={sheet.overlay} aria-labelledby="my-card-title" data-closing={closing ? "true" : undefined}
    onCancel={(event) => { event.preventDefault(); close(); }}
    onPointerDown={(event) => { backdrop.current = event.target === event.currentTarget; }}
    onPointerUp={(event) => { if (backdrop.current && event.target === event.currentTarget) close(); backdrop.current = false; }}>
    <div ref={panelRef} className={sheet.panel}>
      <header className={sheet.header}><span className={sheet.grabHandle} aria-hidden="true" />
        <div className={sheet.titleRow}><h2 id="my-card-title">My Card</h2>
          <button ref={closeRef} type="button" className={sheet.closeButton} disabled={closing} aria-label="Close My Card" onClick={close}><DiscoveryIcon name="close" size={20} /></button>
        </div>
      </header>
      <div className={sheet.content}>
        <p className={styles.previewText}>This is how your profile card looks to other people. Your match score is personal to each viewer.</p>
        <div className={styles.previewFrame}><ProfileCard profile={profile} active /></div>
      </div>
      <footer className={sheet.footer}><Link href="/home/profile" className="btn btn-primary">Edit my profile</Link></footer>
    </div>
  </dialog>;
}
