# Meet preferences

Route: `/home/meet`. The Discover page links here through its existing Meet action.
The shared `/home` layout supplies navigation, notifications, and the profile menu.
Meet opens as a modal route panel with the same dimensions, rounded shape, and
600 ms slide-up entrance as Filters. Its header and Save actions remain visible
while preferences scroll. The panel also fits above the mobile keyboard.

## Opening and closing

Link to `/home/meet?from=/home/discover` (or another `/home` page). The top-right
Close button and Escape return to that local page. Direct visits use a suitable
same-origin referrer, then `/home/discover` as the fallback. Close discards unsaved
edits. Saving keeps the panel open. Background scrolling and controls are disabled
while the panel is open, and keyboard focus stays inside it.

## Feature files

- `meetingOptions.ts`: typed identifiers, form defaults, and validation.
- `meetingPreferencesApi.ts`: owner lookup, one-row reads and database upserts.
- `meetingPreferencesModel.ts`: storage mappings and read-only profile formatting.
- `useMeetingPreferences.ts`: loading, saving, retry and cancellation.
- `meetingStorage.ts`: the pure normalisation parser and unused legacy demo storage.
- `MeetingPreferencesForm.tsx`: form state and accessible controls.
- `MeetPanel.tsx` and `returnPath.ts`: modal behaviour and close navigation.
- `Meet.module.css` and `MeetIcon.tsx`: styles and icons scoped to this feature.
- `page.tsx`: route metadata and return-path parameters.

## Supabase setup

Run `meeting-preferences.sql` in the project's Supabase SQL Editor. The existing
table has `user_profile_id`, `meeting_types` (text[]), `location_preference`,
`availability` (text[]), `preferred_duration`, `additional_preferences`,
`created_at`, and `updated_at`. The script adds nullable integer `travel_radius`,
ensures the profile key is unique and references `user_profiles.id`, and enables
reads for visible profiles with owner-only inserts/updates. Ownership resolves through
`public.users.auth_user_id`; auth IDs are not used as profile IDs.

If the original setup is already installed, run `meeting-values-fix.sql` to
update only its validation trigger. It aligns the trigger with the table's
existing CHECK constraints and accepts the earlier form identifiers by
normalising them before validation. Existing records and CHECK constraints
are not rewritten.

Restrictive owner policies for writes constrain pre-existing broader policies.
Readers can see preferences for profiles their role can read from `user_profiles`.
Anonymous access is limited to the preference columns displayed on profiles.
The script preserves unrelated policies/triggers and adds
a trigger that validates stable option IDs, preserves creation time, prevents
moving a record to another profile, and stamps update time. Existing rows are
not rewritten or backfilled. Duplicate keys or incompatible existing foreign
key data stop the transaction instead of deleting records.

After adding the profile display feature, rerun the updated setup script. It
replaces our earlier restrictive ALL-command owner policy with separate write
guards, allowing the Discovery overlay to read other profiles' preferences.
Both signed-in members and public demo visitors can view visible profiles'
saved preferences; edits still require ownership.

## Persistence contract

Meet edits the signed-in user's own preferences. Reads select only that profile's
row; Save upserts on `user_profile_id`, inserting the first row or updating the
existing one. Server confirmation is required before showing success. Loading
errors keep controls disabled, retries preserve unsaved edits, and saving locks
duplicate submissions. Requests are cancelled on close or account changes;
already committed saves may still persist. Reopening restores database data.
No extra backend service or signup trigger is required.

Form values use the identifiers in `meetingOptions.ts`, rather than display labels.

The API translates form identifiers to the table's canonical values on save,
and translates them back when loading. Availability and duration IDs match
directly. The differing values are:

| Form identifier | Stored value |
| --- | --- |
| `coffee` | `coffee_casual` |
| `coworking` | `coworking_work_session` |
| `in_person` | `in_person_only` |
| `remote` | `remote_only` |

Fields are stored in these columns:

| Form field | Database column |
| --- | --- |
| Meeting methods | `meeting_types` |
| Location preference | `location_preference` |
| Willing to travel (km) | `travel_radius` |
| General availability | `availability` |
| Preferred meeting duration | `preferred_duration` |
| Additional preferences | `additional_preferences` |

`travel_radius = null` represents Remote only or Anywhere. Remote clears the
stored distance. Missing rows open with defaults: Both, Within 25 km, Weekends,
and 30–60 minutes. Methods start unselected; saving requires at least one.
Reset changes the draft only; save it explicitly to update the database.

Unknown stored option IDs and nullable legacy fields are normalised for the form.
Legacy browser demo preferences are neither read nor automatically assigned to
an account. Home routes remain open; signed-out Meet visitors see a login prompt.
When changing stored option values or validation limits, update the API mapping,
SQL trigger and corresponding database CHECK constraints together.

## Save validation errors

Database code `23514` can come from the Hi5 validation trigger or a pre-existing
table CHECK constraint. Known trigger rules show a specific field message.
Existing CHECK failures retain their constraint name in the browser console's
`[Meet] Database validation rejected the save` diagnostic; row contents and user
IDs are not logged. Before changing stored identifiers or table constraints,
inspect the live constraints with:

```sql
select conname as constraint_name, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.meeting_preferences'::regclass and contype = 'c';
```
