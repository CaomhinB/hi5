# Website authentication

`/home` and every `/home/*` request require a verified Supabase login. Guests and
invalid sessions redirect to `/`. This includes direct URLs, reloads and Next.js
route requests. The public landing, signup, confirmation and presentation pages
remain accessible.

## Boundaries

- Root `proxy.ts` calls `proxy.ts` in this folder before matched routes render.
  It verifies JWT claims, refreshes session cookies and passes refreshed cookies
  to both the renderer and browser. Redirects preserve cookie updates.
- `server.ts` creates a client per request, validates the user with Supabase Auth,
  and provides `requireUser`. The home layout calls this as an additional check.
  React's `cache` deduplicates checks within a render; it is not a shared user cache.
- `HomeSessionBoundary` closes an already-open home screen on sign-out and reloads
  on account changes or restoration from the browser back/forward cache. It
  supplements the server guard; hiding a component is not the security boundary.
- Auth-related responses are private and not cached. Session cookies use Secure
  in production (serve production over HTTPS) and SameSite=Lax via Supabase SSR.
  They remain browser-readable because the existing Supabase browser features
  need them. No service-role or secret key is used.

Root `/` checks the signed-in user on the server and initializes `Navbar` with
that result. A session listener keeps its controls current. Signed-in users get
the existing profile-photo circle and Home button on desktop and mobile; the
main signup CTAs also point to Home. The photo opens My Profile. Missing photos
use the existing initials/person fallback.

## Existing sessions and confirmation links

The old SDK persisted sessions only in localStorage. Those sessions cannot be
verified on an incoming server request. Existing users must log in once after
upgrading. The browser helper removes unused legacy session entries instead of
leaving refresh tokens behind or treating browser storage as server authority.

New signup confirmations use Supabase SSR's PKCE flow. The existing confirmation
page waits for the SDK's code exchange. It also accepts old emailed hash-token
links explicitly, writes the resulting cookie session, and removes URL tokens.
If a link is opened without its original PKCE verifier, users can confirm their
email and use the confirmation page's login button to continue to onboarding.
Successful confirmation opens a fresh `/onboarding` document with the cookie session.

## Production confirmation redirect

The deployed Supabase project's Authentication / URL Configuration must have its
Site URL set to `https://www.hi5project.co.uk`, and its Redirect URLs must allow
`https://www.hi5project.co.uk/signup/confirmed`. Signup already requests the
current website origin plus `/signup/confirmed`. The confirmation page establishes
the session and then opens `/onboarding`; complete profiles continue to Home.

These are hosted Supabase Auth settings. Editing the local `supabase/config.toml`
or deploying the Next.js callback does not change a hosted project's Site URL.
The app's public key cannot administer those settings. A link that redirects to
localhost cannot reach this app to run any callback code. Existing emails may
retain their original redirect, so request a fresh email after fixing the setting,
or log in directly if the previous click already verified the email.

No environment variable names or SQL changes are required. Keep
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured in Vercel,
then deploy the updated app and lockfile. The added dependency is `@supabase/ssr`.

The dependency review also updated Next.js and its ESLint configuration to
16.3.8, and source-map-js to a compatible patched release. TypeScript checking
passes and `npm audit --omit=dev` reports zero vulnerabilities. Five high-severity
development-tool advisories remain in the full dependency tree; those are not
resolved by the production package patches. Browser auth flows were not exercised.

This change restricts website pages. Supabase RLS, grants and RPC ownership checks
still determine database access. Previously enabled public demo profile reads
and public storage URLs are not made private by this route guard.

Reference: https://supabase.com/docs/guides/auth/server-side/creating-a-client
