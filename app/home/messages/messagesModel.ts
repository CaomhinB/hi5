import type { ProfileRecord } from "../../onboarding/profileModel";

export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface HiRequest {
  id: string;
  sender_id: string;
  sent_at: string;
  expires_at: string;
  profile: ProfileRecord;
}

export interface Conversation {
  id: string;
  matched_at: string;
  activity_at: string;
  unread_count: number;
  profile: ProfileRecord;
  last_message: ChatMessage | null;
}

export interface MessagesInbox {
  server_time: string;
  requests: HiRequest[];
  conversations: Conversation[];
}

export function requestTimeLeft(expiresAt: string, now: number): string {
  const remaining = Date.parse(expiresAt) - now;
  if (remaining <= 0) return "Expired";
  if (remaining >= 86_400_000) {
    const days = Math.ceil(remaining / 86_400_000);
    return `${days} ${days === 1 ? "day" : "days"} left`;
  }
  const hours = Math.ceil(remaining / 3_600_000);
  return `${hours} ${hours === 1 ? "hour" : "hours"} left`;
}

export function messageTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function activityTime(value: string): string {
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString() ? messageTime(value)
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}

export function mergeMessages(...groups: ChatMessage[][]): ChatMessage[] {
  const unique = new Map(groups.flat().map((message) => [message.id, message]));
  return [...unique.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}
