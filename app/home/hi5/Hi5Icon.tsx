export function Hi5Icon({ name, size = 16 }: { name: "clock" | "send" | "check" | "card" | "plus"; size?: number }) {
  const paths = {
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    send: <><path d="m21 3-7 18-4-7-7-4L21 3ZM10 14 21 3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    card: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M6 16c0-3 6-3 6 0M15 9h3M15 13h3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
