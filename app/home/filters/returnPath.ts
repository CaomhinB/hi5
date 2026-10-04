/** Only return to another local app page, never an external URL or this panel. */
export function getFilterReturnPath(value: string | undefined, origin = "https://hi5.local"): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || !/^\/home(?:\/|$)/.test(url.pathname)
      || /^\/home\/filters(?:\/|$)/.test(url.pathname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
