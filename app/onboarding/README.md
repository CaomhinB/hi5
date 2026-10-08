# Profile onboarding

Successful signup with a session, email confirmation and landing-page login
route to `/onboarding`. This page reads the signed-in user's profile. Complete
profiles immediately continue to `/home`; incomplete profiles start at their
first missing section. Direct `/home/*` access remains open for development.

## Required and optional details

Required: name, location, role, bio, integer years of experience, one or more
skills, 1–3 listed industries, and a stored profile photo. Optional: age,
organisation, interests, current projects, portfolio, LinkedIn and GitHub URLs.
Zero years of experience is valid. Existing profile values are prefilled;
signup metadata supplies missing name, industries and interests.

Industries, professions and skill suggestions use the Filters catalogs. Only
listed industries can be added, up to three. Role, skills and interests also
allow custom entries. Additional skill suggestions reflect the existing sample
profiles' sales, partnership and marketing context.

## Supabase setup

Run `onboarding.sql` in the Supabase SQL Editor. Signup must already create the
`public.users` row linked through `auth_user_id`; profile IDs equal public user
IDs. The script adds two authenticated, owner-scoped RPCs and photo upload/read
policies. It configures the existing `profile-images` bucket for JPEG, PNG and
WebP uploads of up to 5 MiB. The bucket's public setting stays as configured.

RPCs derive ownership from `auth.uid()` and check the expected auth user ID to
detect account changes. Client-supplied profile IDs and timestamps are ignored.
Server validation also enforces required fields, numeric bounds, the allowed
industry list/max three, and a real stored photo. Existing read policies stay
in place; no general browser write grant is added to the profile table.

If the Filters industry catalog changes, update the SQL whitelist and rerun the
script. No completion flag is required: the stored required fields and photo
existence determine whether onboarding is complete.

## Uploads and saves

`onboardingApi.ts` keeps SDK calls outside the form. New images use
`<auth user UUID>/<random UUID>.<extension>` keys with upsert disabled. Existing
images are retained. A successful upload is reused if the profile save fails
and the user retries. Unsaved fields and a selected file stay in form memory;
refreshing restores stored data, not an unfinished browser draft.

`OnboardingFlow.tsx` uses a four-step responsive form, field validation, image
preview, keyboard focus handling and a separate portal for the shared searchable
select. Compact viewport layouts keep fields usable with the mobile keyboard.

Image API: https://supabase.com/docs/reference/javascript/storage-from-upload
