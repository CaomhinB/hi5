# Discovery profile queue

`page.tsx` mounts the client experience. Production cards come from Supabase's
`public.user_profiles`; `mockProfiles.ts` remains an unused demo fixture.

## Fetching and swiping

- `discoveryProfilesApi.ts` selects card fields in pages of 10 using inclusive
  `.range(offset, offset + limit - 1)`, ordered by `created_at` then unique `id`.
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
