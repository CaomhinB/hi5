"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

export type SwipeDirection = "left" | "right";

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  displacement: number;
  axis: "pending" | "horizontal" | "vertical";
  threshold: number;
};

// Keep in sync with the exit and rear-card durations in Discovery.module.css.
const EXIT_DURATION = 1000;

export function useSwipeDeck(profileCount: number) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [swipeThreshold, setSwipeThreshold] = useState(96);
  const [dragging, setDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const locked = useRef(false);
  const pendingExit = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (exitTimer.current !== null) clearTimeout(exitTimer.current);
  }, []);

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function finishDismissal() {
    // Both animationend and the fallback timer can fire. Advance exactly once.
    if (!pendingExit.current) return;
    pendingExit.current = false;
    if (exitTimer.current !== null) clearTimeout(exitTimer.current);
    setIndex((current) => current + 1);
    setDragX(0);
    setExitDirection(null);
    // Rear cards have already moved forward during the exit animation.
    locked.current = false;
  }

  function dismiss(direction: SwipeDirection) {
    if (locked.current || gesture.current || index >= profileCount) return;
    locked.current = true;
    pendingExit.current = true;
    setDragging(false);
    setExitDirection(direction);
    // Fallback covers interrupted animations and reduced-motion CSS.
    exitTimer.current = setTimeout(finishDismissal, prefersReducedMotion() ? 0 : EXIT_DURATION + 80);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0 || locked.current || gesture.current) return;
    const width = event.currentTarget.getBoundingClientRect().width;
    const threshold = Math.min(120, Math.max(72, width * 0.24));
    setSwipeThreshold(threshold);
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      displacement: 0,
      axis: "pending",
      threshold,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;

    // Lock to the first intentional direction. CSS pan-y preserves native scrolling.
    if (current.axis === "pending") {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      current.axis = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    }
    if (current.axis !== "horizontal") return;
    current.displacement = dx;
    setDragging(true);
    setDragX(dx);
  }

  function releasePointer(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    gesture.current = null;
    releasePointer(event);
    setDragging(false);
    if (current.axis === "horizontal" && Math.abs(current.displacement) >= current.threshold) {
      dismiss(current.displacement < 0 ? "left" : "right");
    } else {
      setDragX(0);
    }
  }

  function onPointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current?.pointerId !== event.pointerId) return;
    gesture.current = null;
    releasePointer(event);
    setDragging(false);
    setDragX(0);
  }

  function reset() {
    if (exitTimer.current !== null) clearTimeout(exitTimer.current);
    gesture.current = null;
    locked.current = false;
    pendingExit.current = false;
    setIndex(0);
    setDragX(0);
    setDragging(false);
    setExitDirection(null);
  }

  const passFeedback = exitDirection === "left" ? 1 : Math.min(1, Math.max(0, -dragX / swipeThreshold));
  const hiFeedback = exitDirection === "right" ? 1 : Math.min(1, Math.max(0, dragX / swipeThreshold));

  return {
    index, dragX, dragging, exitDirection, passFeedback, hiFeedback,
    busy: exitDirection !== null || dragging,
    dismiss, finishDismissal, reset,
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture: onPointerCancel },
  };
}
