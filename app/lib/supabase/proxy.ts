import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function preventCaching(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedRoute = pathname === "/home" || pathname.startsWith("/home/");
  let response = NextResponse.next({ request });

  function redirectToLanding() {
    const target = request.nextUrl.clone();
    target.pathname = "/";
    target.search = "";
    const redirect = NextResponse.redirect(target);
    // Preserve refreshed/cleared session cookies on redirects as well.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return preventCaching(redirect);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return protectedRoute ? redirectToLanding() : preventCaching(response);
  }

  const client = createServerClient(url, key, {
    cookieOptions: { secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        const previousCookies = response.cookies.getAll();
        response = NextResponse.next({ request });
        for (const cookie of previousCookies) response.cookies.set(cookie);
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    },
  });

  try {
    // Signature/expiry verification, not merely the presence of a session cookie.
    const { data, error } = await client.auth.getClaims();
    if (protectedRoute && (error || !data?.claims?.sub)) return redirectToLanding();
  } catch {
    if (protectedRoute) return redirectToLanding();
  }

  return preventCaching(response);
}
