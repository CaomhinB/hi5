# My profile

The account avatar opens `/home/profile`, reads the signed-in user's profile
photo, and falls back to their initials if no usable photo exists. The profile
page shows every current `user_profiles` column. Profile ID, image storage path
and timestamps appear in the read-only record details; the image itself can be
changed through Photo & links.

## Supabase setup

The existing signup migration grants authenticated users permission to update
their own profile's editable columns, with owner-only RLS. Profile editing can
use those permissions without installing an additional function.

Optionally run `profile-edit.sql` in the project's Supabase SQL Editor. This adds
the authenticated `update_my_profile_section` RPC, which the editor prefers when
available. It uses `auth.uid()` to resolve
the owner through `public.users.auth_user_id`, checks the expected account ID,
locks the profile row, validates the chosen section, and updates only that
section's columns. It grants no general browser write access to the table.

The existing `app/onboarding/onboarding.sql` setup provides the private profile
read RPC and upload policies for the public `profile-images` bucket. Profile IDs
must equal `public.users.id`. Keep the industry whitelist in both SQL scripts
aligned with `app/home/filters/filterOptions.ts` when changing the catalog.

## Editing and shared state

Each section's Edit button opens `/home/profile/edit?section=about|work|skills|photo`.
The editor reuses onboarding fields, validation, searchable choices and photo
uploads. Only that section's required fields must be present to save it. Cancel
discards the draft. Other sections, the record ID and creation date are preserved.

`profileApi.ts` keeps section saves outside the UI. Only a missing RPC (`PGRST202`)
enables the fallback: check the current session, resolve the owner ID from
`public.users`, update that ID's section columns under RLS, then read the saved
profile through the existing read RPC. Other RPC failures keep their error;
they do not cause a second write. IDs and timestamps are never sent as editable
fields. The optional section RPC validates fields in the database and sets
`updated_at`; the fallback leaves timestamps to existing database triggers.

The saved row is published immediately to `app/lib/supabase/currentProfile.ts` so
the profile page and header photo update together. That store shares one read
between components, follows auth changes, clears data on logout, and refreshes
when the window regains focus or onboarding publishes a profile change. Drafts
are snapshots and are not reset by background reads.

Photos use the existing JPEG/PNG/WebP, 5 MiB uploader with fresh paths; earlier
uploads remain in storage. Unsaved edits are not persisted across refreshes.
Home routes remain open for development. Signed-out profile viewers get a login
prompt; this feature does not add a global authentication guard.
