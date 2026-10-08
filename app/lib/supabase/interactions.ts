"use client";

import { getSupabaseBrowserClient } from "./browser";

export type InteractionAction = "hi" | "pass";
export type InteractionSource = "hi5" | "discover";

export interface ProfileInteractionResult {
  action: InteractionAction;
  matched: boolean;
  matchId: string | null;
  message: string;
}

function interactionError(code: string, message: string): string {
  if (/Authenticated user does not have a public\.users record/i.test(message)) {
    return "Your account setup isn’t complete yet. Please complete it before trying again.";
  }
  if (/Target user does not exist/i.test(message) || code === "23503") {
    return "This profile isn’t available for interactions yet. Please try again later.";
  }
  if (/yourself/i.test(message)) return "You can’t say Hi to or pass your own profile.";
  if (code === "42501" || code === "PGRST301" || /authenticated|JWT|session/i.test(message)) {
    return "Please sign in to say Hi or pass a profile.";
  }
  return "We couldn’t confirm that your choice was saved. Please try again.";
}

/** IDs here belong to public.users. The RPC resolves the sender from auth.uid(). */
export async function recordProfileInteraction({ targetUserId, action, source, signal }: {
  targetUserId: string;
  action: InteractionAction;
  source: InteractionSource;
  signal: AbortSignal;
}): Promise<ProfileInteractionResult> {
  const client = getSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  signal.throwIfAborted();
  if (sessionError || !sessionData.session) {
    throw new Error("Please sign in to say Hi or pass a profile.");
  }

  const { data, error } = await client.rpc(action === "hi" ? "say_hi" : "pass_profile", {
    target_user_id: targetUserId,
    interaction_origin: source,
  }).abortSignal(signal);
  signal.throwIfAborted();
  if (error) throw new Error(interactionError(error.code, error.message), { cause: error });

  const value: unknown = data;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("We couldn’t confirm that your choice was saved. Please try again.");
  }
  const result = value as Record<string, unknown>;
  if (action === "pass" && result.success === true) {
    return { action, matched: false, matchId: null, message: "Profile passed" };
  }
  if (action === "hi" && typeof result.matched === "boolean"
    && (!result.matched || typeof result.match_id === "string")) {
    return {
      action,
      matched: result.matched,
      matchId: result.matched ? result.match_id as string : null,
      message: result.matched ? "It’s a match!" : "Hi sent",
    };
  }
  throw new Error("We couldn’t confirm that your choice was saved. Please try again.");
}
