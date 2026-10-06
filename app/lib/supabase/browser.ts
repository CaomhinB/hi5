"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Signup is not configured yet. Please try again later.");
  }
  // Lazy creation keeps builds and the first two steps usable without credentials.
  client ??= createClient(url, key);
  return client;
}
