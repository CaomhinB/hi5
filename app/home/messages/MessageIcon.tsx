import type { ReactNode } from "react";

export function MessageIcon({ name, size = 20 }: { name: "clock" | "send" | "back" | "chat" | "search"; size?: number }) {
  const paths: Record<typeof name, ReactNode> = {
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    send: <><path d="m21 3-7 18-4-7-7-4 18-7ZM10 14 21 3" /></>,
    back: <path d="m14 5-7 7 7 7M7 12h14" />,
    chat: <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H5l-3 2V11.5a9.5 9.5 0 0 1 19 0Z" />,
    search: <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
