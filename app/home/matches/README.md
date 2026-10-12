# Matches

Route: `/home/matches`. The Matches item in the bottom navigation already links here.
The shared `/home` layout supplies the background, navigation, notifications, and
the profile menu. Only this folder and `supabase/migrations/202610100001_matches_read_unmatch.sql`
belong to this feature.

## What it shows

People who said Hi back. One glass card per active match, newest first: photo (or
initials), name, role, location and industry, up to three skill pills, and how long
ago the match happened. Each card has a Message button (links to `/home/messages`)
and a `...` menu with Unmatch. Unmatch asks for confirmation inside the card, then
removes the card once the database confirms.

States: loading, signed out (link to sign in), error with retry, and empty
(link to Discover).

## Feature files

- `page.tsx`: route metadata, page header, and the screen.
- `MatchesExperience.tsx`: chooses what to show for each state and lists the cards.
- `MatchCardItem.tsx`: one card, its menu, and the Unmatch confirmation.
- `useMatches.ts`: loads matches for the signed-in user and handles Unmatch.
- `matchesApi.ts`: the only file that talks to Supabase.
- `Matches.module.css`: styles scoped to this feature.

## Supabase

Uses `public.matches`, with `user_1_id` and `user_2_id` pointing at `public.users.id`.
Profile details come from `public.user_profiles` (same id) and photos from the
`profile-images` bucket, as in Discover. Matches are created by the existing
`say_hi` function when both people say Hi.

The migration adds two things:

- Policy `hi5_matches_read_own`: a signed-in user can read only matches they are in.
- Function `unmatch(target_match_id)`: sets `status = 'unmatched'` and `unmatched_at`
  for an active match the caller belongs to. Nothing else can be changed.
  Only signed-in users can run it.

The migration was applied to project `hzfshaqmnnucwvfpfsiw` on 10 October 2026.

## Known limits

- Unmatching ends the match for both people, because there is one `status` column.
- `say_hi` re-opens an unmatched pair if both earlier Hi actions still exist.
  Unmatch does not reset them.
- Not included, because the database has no place for it yet: priority stars, tags,
  private notes, last message, meetings, search, and the All / Priority / Recent /
  Archived tabs from the mockup.

## Review locally

Run `npm run dev`, sign in as a user with a match, and open `/home/matches`. Check
the list, then `...` then Unmatch then confirm, and that `status` becomes `unmatched`
in Supabase. Signed out, the page should show the sign-in prompt.
Run `npm run lint` and `npx tsc --noEmit` for checks.
