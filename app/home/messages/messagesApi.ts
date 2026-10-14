"use client";

import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import type { ChatMessage, MessagesInbox } from "./messagesModel";

function messagingError(code: string, message: string): Error {
  if (/messages_request_expired/.test(message)) return new Error("This Hi is no longer available. Please refresh your requests.");
  if (/messages_auth_required/.test(message)) return new Error("Your signed-in account changed. Please log in again.");
  if (/messages_conversation_unavailable/.test(message)) return new Error("This conversation is no longer available.");
  if (code === "PGRST202" || code === "42P01") return new Error("Messaging is being set up. Please try again later.");
  return new Error("We couldn’t load or save your messages. Check your connection and try again.");
}

async function call<T>(name: string, parameters: Record<string, unknown>, signal: AbortSignal): Promise<T> {
  const { data, error } = await getSupabaseBrowserClient().rpc(name, parameters).abortSignal(signal);
  signal.throwIfAborted();
  if (error) throw messagingError(error.code, error.message);
  return data as T;
}

export async function fetchMessagesInbox(authUserId: string, signal: AbortSignal): Promise<MessagesInbox> {
  const result = await call<MessagesInbox>("get_messages_inbox", { expected_auth_user_id: authUserId }, signal);
  if (!result || !Array.isArray(result.requests) || !Array.isArray(result.conversations)
    || !Number.isFinite(Date.parse(result.server_time))) throw new Error("Your messages couldn’t be read. Please try again.");
  return result;
}

export function respondToHi(authUserId: string, requestId: string, response: "hi" | "pass", signal: AbortSignal) {
  return call<{ match_id: string | null }>("respond_to_message_hi", {
    expected_auth_user_id: authUserId, request_id: requestId, response,
  }, signal);
}

export function fetchMessageThread(authUserId: string, matchId: string, signal: AbortSignal, before?: ChatMessage) {
  return call<ChatMessage[]>("get_message_thread", { expected_auth_user_id: authUserId, target_match_id: matchId,
    before_created_at: before?.created_at ?? null, before_id: before?.id ?? null }, signal);
}

export function sendChatMessage(authUserId: string, matchId: string, messageId: string, body: string, signal: AbortSignal) {
  return call<ChatMessage>("send_chat_message", { expected_auth_user_id: authUserId,
    target_match_id: matchId, message_id: messageId, message_body: body }, signal);
}

export function markChatRead(authUserId: string, matchId: string, through: ChatMessage, signal: AbortSignal) {
  return call<void>("mark_chat_read", { expected_auth_user_id: authUserId, target_match_id: matchId,
    through_created_at: through.created_at, through_id: through.id }, signal);
}
