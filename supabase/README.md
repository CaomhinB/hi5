# Hi5 signup setup

The SQL in `migrations/202610060001_signup_onboarding.sql` was approved and applied
to project `hzfshaqmnnucwvfpfsiw` on 6 October 2026 using the authenticated CLI.
The trigger, all four policies, and ownership/anonymous update restrictions were verified.
The instructions below also support applying this script to another matching environment.
The live schema was inspected read-only on 6 October 2026:

- `users.id`: UUID, default `gen_random_uuid()`; `auth_user_id`: unique UUID referencing Auth.
- `users.email`: required unique text.
- `user_profiles.id`: UUID primary key referencing `users.id`, with no default.
- `user_profiles.name`: required text. `interests`, `industries`, and `skills`: `text[]`.
- RLS was enabled on both tables, with no policies and no custom Auth signup triggers.

## Review and apply the SQL

1. Open the Supabase dashboard for project `hzfshaqmnnucwvfpfsiw`.
2. Open **SQL Editor**, then **New query**.
3. Copy the complete migration file into the editor. Review it before pressing **Run**.
4. Run it as the database owner (`postgres`). It runs in a transaction. If it fails,
   resolve the reported schema mismatch rather than changing or dropping existing columns.
5. Verify the new trigger and the four policies under Database / Authentication.

It creates one signup trigger/function and four RLS policies. Auth signup inserts a
`users` row using its existing UUID default, then creates the corresponding profile
with the name and both metadata arrays. Empty project selections become `[]`.
No tables are created, no columns are changed, and no existing rows are modified.
Rerunning preserves the named trigger/policies and refreshes the function/grants.
Review any policies introduced by teammates since inspection: permissive policies
combine with OR, so a broader policy could weaken ownership restrictions.

Authenticated accounts can read their own user row and all profiles for discovery.
They can update their own email and profile fields, but not the ownership IDs.
Anonymous accounts cannot access these tables. Frontend insert/delete privileges
are removed; the owner-executed trigger creates both rows atomically. These grants
affect any other real clients using these tables, so review them with the team.
Updating `users.email` does not change the Supabase Auth email; use Auth APIs for
actual email changes when implementing account settings.

The trigger requires valid `full_name` metadata for future Auth signups, including
any future OAuth or admin signup integration. Adapt those flows to send a name.
Existing Auth accounts are not backfilled. A legacy `users` row with the same email
will cause signup to fail atomically; reconcile it manually without assigning an
existing profile to an unverified account.

## Local environment and email confirmation

Copy `.env.example` to `.env.local`. Set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://hzfshaqmnnucwvfpfsiw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<the project's public anon key>
```

Use the public anon key from the Supabase API settings, never a secret/service-role
key. `.env.local` is ignored by Git. Restart the development server after editing it.

In Authentication → URL Configuration, set the appropriate Site URL and add
`http://localhost:3000/signup/confirmed` and the deployed equivalent to the redirect
allowlist. The default confirmation email must retain its `ConfirmationURL` link.
The browser Supabase client consumes the confirmation link's implicit-flow tokens
on `/signup/confirmed`, then takes a confirmed session to `/home`.

## Check the flow

Run `npm run dev`, then open `/signup`:

1. Check required fields, invalid emails and passwords shorter than 8 characters.
2. Continue. Select two interests: Continue stays disabled. Select three: it enables.
3. Go Back and confirm your entries/selections remain. No Auth signup occurs yet.
4. Filter project tags, select and remove suggestions using mouse and keyboard.
5. With the SQL applied, submit once with a new test email. Check Auth and both
   existing tables: the IDs join correctly and arrays contain the displayed labels.
6. With email confirmation enabled, verify the check-email screen and follow the
   emailed link. With confirmation disabled, signup goes directly to `/home`.
7. Test Skip for now: it creates the account with `industries = []`.
8. Test duplicate signup, network failures and invalid/expired confirmation links.
9. As separate authenticated test accounts, verify each can read profiles but
   cannot update the other's profile, user row or ownership IDs. Anonymous requests
   must not read or write these tables.

The current `/home` screens remain the existing demo; signup does not add route
protection, real discovery queries, or a real login flow.
