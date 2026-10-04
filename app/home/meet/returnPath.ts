/** Return to a local app page, with Discovery as the caller's fallback. */
export function getMeetReturnPath(value: string | undefined, origin = "https://hi5.local"): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || !/^\/home(?:\/|$)/.test(url.pathname)
      || /^\/home\/(?:meet|filters)(?:\/|$)/.test(url.pathname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
