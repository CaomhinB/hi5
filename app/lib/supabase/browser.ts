"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Signup is not configured yet. Please try again later.");
  }
  // Lazy creation keeps builds and the first two steps usable without credentials.
  if (!client) {
    if (typeof window !== "undefined") {
      // Old localStorage sessions cannot authorize server requests. Remove their
      // unused refresh tokens; existing users sign in once to establish cookies.
      try {
        window.localStorage.removeItem(`sb-${new URL(url).hostname.split(".")[0]}-auth-token`);
      } catch { /* Cookie sessions do not require localStorage access. */ }
    }
    const legacyConfirmation = typeof window !== "undefined"
      && window.location.pathname === "/signup/confirmed"
      && new URLSearchParams(window.location.hash.slice(1)).has("access_token");
    client = createBrowserClient(url, key, {
      cookieOptions: { secure: process.env.NODE_ENV === "production" },
      // New links use PKCE. The confirmation page explicitly handles older hash links.
      auth: { detectSessionInUrl: typeof window !== "undefined" && !legacyConfirmation },
    });
  }
  return client;
}
