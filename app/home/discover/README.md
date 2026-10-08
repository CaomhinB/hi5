# Discovery profile queue

`page.tsx` mounts the client experience. Production cards come from Supabase's
`public.user_profiles`; `mockProfiles.ts` remains an unused demo fixture.

## Fetching and swiping

- `discoveryProfilesApi.ts` selects card fields in pages of 10 using inclusive
  `.range(offset, offset + limit - 1)`, ordered by `created_at` then unique `id`.
- Signed-in requests resolve `public.users.id` through the current session's
  `auth_user_id` and exclude that ID with `.neq("id", ownProfileId)` before
  pagination. Visitors keep public demo access. Identity lookup failures stop
  that request rather than loading a batch that might contain the viewer.
- `useDiscoveryProfiles.ts` owns the local queue, offset, request lock, errors,
  exhaustion flag, and ID deduplication. It refills at four remaining profiles.
- Successful responses append to the current queue, including any swipes that
  happened during the request. Errors leave the queue and offset intact for Retry.
- A short or empty page ends pagination. An exact full final page needs one
  additional empty request to discover exhaustion; no total-table count is used.
- The experience renders `profiles.slice(0, 3)` only. Card frames have bounded
  text and fixed heights, so no additional hidden profile cards are needed.
- `useSwipeDeck.ts` removes the outgoing profile by ID only after both its
  one-second animation and the interaction RPC succeed. Save remains a
  temporary per-card showcase.
- Requests are aborted on unmount/restart, stale results are ignored, and React
  Strict Mode's discarded setup does not start a duplicate initial request.

## Full profile overlay

More opens a read-only, responsive modal for the currently active card. It loads
that single `user_profiles` record by its ID through
`fetchDiscoveryProfileDetails`; it does not expand the batch query or load other
profiles. The preview photo/name appear immediately, with a loading message,
error feedback and Retry for the full details. Photo, age, bio, location, role,
organisation, years of experience, every industry/skill/interest, projects,
portfolio, LinkedIn and GitHub links are shown, with joined/updated dates.
Links only become clickable for HTTP/HTTPS URLs.

Meeting preferences appear between Current projects and Explore their work.
Their single-record read runs alongside the profile request, using only the
active profile ID. The section shows meeting types, location, travel distance,
availability, duration and additional notes, using the shared Meet catalog and
canonical storage mappings. Missing rows show Not added yet without assigning
defaults. Preference errors have their own Retry and leave the rest of the
profile usable. Contents still appear only after the entrance animation ends.
Run the updated `app/home/meet/meeting-preferences.sql` to allow these reads:
preferences follow profile visibility while write guards enforce ownership.

`DiscoveryProfileOverlay.tsx` and its CSS own the modal. It matches the existing
bottom panels, with a 650 ms entrance. The native modal blocks background
controls, keeps focus inside, locks background scrolling and restores focus to
More when closed. Close, Back to Discover, backdrop clicks and Escape all close
it. Requests are aborted on unmount, reduced motion is respected, and closing
leaves the queue, active card and temporary Save state in place. More is disabled
during a swipe or pending interaction. Profile details use the existing public
profile read grant; meeting preferences need the read policy described above.

The dialog is sized to the visual viewport and focused at its resting position
before its transform animation starts. Its outer containers use `overflow: clip`
so Safari cannot scroll the sheet to an offscreen animated control. Background
scrolling is locked with a fixed body and restored to its saved position on close.
Full details fetch during the entrance but only render after motion finishes;
nested cards do not need additional backdrop blurs inside the frosted panel.

## Hi and Pass interactions

Buttons and drag gestures share the same interaction path: right sends `say_hi`,
left sends `pass_profile`, with `interaction_origin: "discover"`. The reusable
client helper is `app/lib/supabase/interactions.ts`; it also accepts `"hi5"` for
future integration on that screen.

The target ID is `user_profiles.id`, which must equal `public.users.id`. The
functions resolve the sender's public user ID using `auth.uid()` and
`public.users.auth_user_id`. A signed-in Supabase session, a corresponding public
user record, and permission to execute both RPCs are required. Interaction and
match foreign keys must reference `public.users(id)` to match these functions.

The request starts alongside the existing swipe animation. Duplicate clicks
are locked while either is pending. Queue removal occurs once, after both
succeed. RPC/auth failures restore the current card and display an error, so
the user can retry. A slow response keeps the card pending until it is confirmed.
Navigation cancels the client request and ignores stale callbacks; an RPC may
already have committed on the server, so retries use the functions' existing
unique-pair upserts. No automatic retry sends a second interaction.

Feedback shows Hi sent or It's a match. Passing has no success popup. The returned match ID
is retained in the typed result for future Matches integration. This change does
not implement a login screen or automatically create public user records.

## Table and images

`discoveryProfile.ts` separates database rows from the card model. The mapping
uses name, job title, organisation, location, industries, experience, bio, skills,
interests and current projects. Verification and shared-match claims are not
invented because the table contains no matching fields.
The nullable `int4` experience value is displayed as years, for example `7 years`
or `1 year`. Zero is shown as `0 years`; null displays `Experience not provided`.

`image_path` is relative to the PUBLIC `profile-images` bucket; a `profile-images/`
prefix is also accepted. Public URLs are resolved without additional network
requests. `next.config.ts` permits this project's bucket URLs for image
optimisation. Only the three mounted cards request portraits; missing or failed
images fall back to initials. Set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, then restart Next.js.

Public demo reads need the table grant and, when RLS is enabled, a read policy.
Run `public-demo-access.sql` in the Supabase SQL Editor. The browser key cannot
apply database permission changes. This script does not grant write access.

## Filtering

`useDiscoveryFilters.ts` reads the saved Filters state and waits for hydration
before fetching. A canonical query key remounts the queue and swipe state when
supported search criteria change. Existing requests are cancelled and the offset
starts at zero. Changes to demo preferences do not restart Discovery.
The query key also includes the signed-in account, so login, logout and account
switches discard the old queue and swipe state. Initial loading waits for the
shared account lookup; each batch checks the current session before querying.

`discoveryFilters.ts` maps Industry, Role / Profession, Skills and numeric
Experience. Industry uses exact array overlap. Profession and Skills match any
shared word, ignoring case and common punctuation. Selected skills combine with
OR; different filter sections combine with AND. Experience endpoints are
inclusive. Empty selections and Any impose no restriction.

Run `search-functions.sql` in the Supabase SQL Editor. It adds immutable,
read-only computed fields and GIN expression indexes for word matching. Queries
use array overlap on these fields before ordering/range, retaining 10-row
network requests. Permissions and RLS on the profile table still apply.

Looking for, distance, Work arrangement and Open to stay as saved demo choices
until the table has matching fields and location coordinates.

## Adding other filters and exclusions later

Add further database predicates to the query in `discoveryProfilesApi.ts` before
`order/range`. Pass a memoised `DiscoveryBatchLoader` to `useDiscoveryProfiles`
for a different query; a changed loader aborts pending work and resets the queue
and offset. Apply exclusions before pagination, and reset pagination whenever
the query changes. The queue hook remembers fetched IDs only in memory to
prevent repeated cards across batches. The interaction functions now persist
Hi/Pass decisions, but excluding previously interacted profiles from future
queries remains a separate integration.

Offset pagination assumes a mostly stable table during a browsing session.
ID deduplication handles overlapping pages, but live insertions/deletions can
still shift offsets; use cursor pagination if that becomes a requirement.
