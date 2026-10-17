"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./DemoVideo.module.css";

const VIDEO_ID = "PsioKN4X9L0";
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 5 11 7-11 7V5Z" fill="currentColor" />
    </svg>
  );
}

function VideoWindow({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitStarted = useRef(false);
  const [closing, setClosing] = useState(false);

  const dismiss = useCallback(() => {
    if (exitStarted.current) return;
    exitStarted.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    // Remove the iframe now so audio stops before the closing animation finishes.
    setClosing(true);
    closeTimer.current = setTimeout(onClose, 240);
  }, [onClose]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) {
      document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
    }
    document.body.style.overflow = "hidden";

    const viewport = window.visualViewport;
    const fitViewport = () => {
      if (viewport && Math.abs(viewport.scale - 1) < 0.01) {
        element.style.setProperty("--video-viewport-height", `${viewport.height}px`);
        element.style.setProperty("--video-viewport-top", `${viewport.offsetTop}px`);
      }
    };
    fitViewport();
    viewport?.addEventListener("resize", fitViewport);
    viewport?.addEventListener("scroll", fitViewport);
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });

    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      viewport?.removeEventListener("resize", fitViewport);
      viewport?.removeEventListener("scroll", fitViewport);
      element.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialog}
      id="hi5-demo-video"
      className={`${styles.dialog} ${closing ? styles.closing : ""}`}
      aria-labelledby="demo-video-title"
      aria-describedby="demo-video-description"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}
    >
      <div className={styles.window} onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) onClose();
      }}>
        <header className={styles.header}>
          <div>
            <span className={styles.label}>HI5 IN ACTION</span>
            <h2 id="demo-video-title">A better reason to say Hi.</h2>
          </div>
          <button ref={closeButton} type="button" className={styles.close} aria-label="Close video" onClick={dismiss}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="m6 6 12 12M6 18 18 6" />
            </svg>
          </button>
        </header>
        <div className={styles.player}>
          {!closing && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&playsinline=1&rel=0`}
              title="Hi5 project demo"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
        </div>
        <footer className={styles.footer}>
          <p id="demo-video-description">See how Hi5 brings people together.</p>
          <a href={VIDEO_URL} target="_blank" rel="noopener noreferrer">Open on YouTube <span aria-hidden="true">↗</span></a>
        </footer>
      </div>
    </dialog>,
    document.body,
  );
}

export function DemoVideo() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <section className={styles.banner} aria-label="Watch the Hi5 demo">
        <div className={styles.intro}>
          <span className={styles.symbol}><PlayIcon size={25} /></span>
          <div>
            <h2>See Hi5 in action.</h2>
            <p>Your next connection starts with a Hi.</p>
          </div>
        </div>
        <button type="button" className={`btn btn-primary ${styles.watch}`} aria-haspopup="dialog"
          aria-expanded={open} aria-controls={open ? "hi5-demo-video" : undefined} onClick={() => setOpen(true)}>
          <PlayIcon size={18} /> Watch demo
        </button>
      </section>
      {open && <VideoWindow onClose={close} />}
    </>
  );
}
