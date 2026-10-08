"use client";

import { useSyncExternalStore } from "react";
import { loadOnboardingContext, OnboardingError } from "../../onboarding/onboardingApi";
import type { OnboardingContext } from "../../onboarding/onboardingApi";
import { getSupabaseBrowserClient } from "./browser";
import { PROFILE_CHANGED_EVENT } from "./profileEvents";

interface ProfileSnapshot {
  status: "loading" | "ready" | "guest" | "error";
  context: OnboardingContext | null;
  error: string | null;
}

const serverSnapshot: ProfileSnapshot = { status: "loading", context: null, error: null };
let snapshot = serverSnapshot;
let authUserId: string | null | undefined;
let request: AbortController | null = null;
let unsubscribeAuth: (() => void) | null = null;
let subscriptionGeneration = 0;
const listeners = new Set<() => void>();

function publish(next: ProfileSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

export async function refreshCurrentProfile(): Promise<void> {
  if (!listeners.size || request || authUserId === null) return;
  const controller = new AbortController();
  const expectedUserId = authUserId;
  request = controller;
  publish({ ...snapshot, status: "loading", error: null });
  try {
    const context = await loadOnboardingContext(controller.signal);
    if (request !== controller || controller.signal.aborted || !listeners.size
      || (expectedUserId !== undefined && context.authUserId !== expectedUserId)) return;
    authUserId = context.authUserId;
    publish({ status: "ready", context, error: null });
  } catch (cause) {
    if (request !== controller || controller.signal.aborted || !listeners.size) return;
    if (cause instanceof OnboardingError && cause.signedOut) {
      authUserId = null;
      publish({ status: "guest", context: null, error: null });
    } else {
      publish({ status: "error", context: snapshot.context,
        error: cause instanceof OnboardingError ? cause.message : "We couldn’t load your profile. Please try again." });
    }
  } finally {
    if (request === controller) request = null;
  }
}

/** Publish the server's saved row immediately, preventing stale reads from replacing it. */
export function publishCurrentProfile(context: OnboardingContext) {
  if (!listeners.size || authUserId !== context.authUserId) return;
  request?.abort(); request = null;
  publish({ status: "ready", context, error: null });
}

function profileChanged(event: Event) {
  const detail = (event as CustomEvent<{ authUserId?: string }>).detail;
  if (detail?.authUserId === authUserId) void refreshCurrentProfile();
}

function onFocus() { void refreshCurrentProfile(); }

function startListening() {
  const generation = ++subscriptionGeneration;
  try {
    const { data } = getSupabaseBrowserClient().auth.onAuthStateChange((event, session) => {
      if (generation !== subscriptionGeneration || !listeners.size) return;
      const nextUserId = session?.user.id ?? null;
      if (nextUserId !== authUserId || event === "USER_UPDATED") {
        request?.abort(); request = null; authUserId = nextUserId;
        publish({ status: nextUserId ? "loading" : "guest", context: null, error: null });
        // Auth callbacks must return before starting another SDK auth operation.
        if (nextUserId) queueMicrotask(() => { void refreshCurrentProfile(); });
      }
    });
    unsubscribeAuth = () => data.subscription.unsubscribe();
    window.addEventListener(PROFILE_CHANGED_EVENT, profileChanged);
    window.addEventListener("focus", onFocus);
  } catch {
    publish({ status: "error", context: null, error: "Your profile is temporarily unavailable. Please try again later." });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) startListening();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      subscriptionGeneration++;
      unsubscribeAuth?.(); unsubscribeAuth = null;
      request?.abort(); request = null;
      window.removeEventListener(PROFILE_CHANGED_EVENT, profileChanged);
      window.removeEventListener("focus", onFocus);
      // A later login must never briefly display the previous account's details.
      authUserId = undefined; snapshot = serverSnapshot;
    }
  };
}

export function useCurrentProfile() {
  return useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
}
