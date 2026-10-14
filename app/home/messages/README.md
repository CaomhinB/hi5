# Messages

`/home/messages` shows incoming Hi requests and conversations for the signed-in
account. `/home/messages/[conversationId]` opens a conversation using its match ID.
The implementation uses the existing Next.js App Router, TypeScript, Supabase
browser client, shared home navigation, profile overlay and CSS design tokens.

## Behaviour

- Each new Hi gets a request with a 120-hour response window from its send time.
  The photo has a days-left badge, switching to hours in the final day. Requests
  disappear at expiry. The server also rejects late responses.
- This request window is separate from the existing recommendation batch expiry.
  Accepting a request creates/reactivates the canonical match and synchronizes
  live Hi5 candidate states without rewriting final shortlist decisions.
- Pass dismisses only the incoming request. It does not unmatch an existing chat
  or notify the sender. A later new Hi can create a new request; retries do not
  extend the deadline. Updating the underlying interaction to Pass withdraws it.
- Existing active matches appear as chats even before the first message. Chats
  survive recommendation round expiry. Unmatched conversations become unavailable.
- Text messages are limited to 5,000 characters. Failed sends retain the text;
  retrying the same send uses its original UUID to prevent duplicates.
- New messages, requests, matches and read receipts refresh through Supabase
  Realtime, with focus/reconnect and a 30-second visible-tab polling fallback.
- Conversations fetch the latest 50 messages and support loading earlier history
  with a timestamp/UUID cursor. Unread counts and Sent/Read labels use stored data.
- Desktop shows list and chat together. Mobile shows one at a time with a back
  link, horizontal request strip and composer sized to the visual viewport when
  the keyboard opens. The shared bottom navigation remains available.
- Guests see a login prompt. Account changes unmount the previous account's data,
  cancel its requests and remove its subscriptions.

## Database

`supabase/migrations/202610130001_messages.sql` was applied to the linked project
`hzfshaqmnnucwvfpfsiw` on 13 October 2026. The existing `messages` table was reused;
its history was preserved. The migration adds `message_hi_requests`, indexes,
participant read protection, server-owned write functions and Realtime publication
entries. Existing live, recent Hi interactions were backfilled as requests.

The migration depends on the existing `users`, `user_profiles`, `interactions`,
`matches` and `_hi5_sync_pair` database contract. It is a versioned migration to
apply once, not a standalone replacement for the team's existing schema.

Only RPCs write messages/read receipts. They derive the sender from `auth.uid()`,
check the expected account and active match membership, and assign timestamps on
the server. Browsers cannot forge senders, rewrite messages, or read another
account's conversations. No secret credentials are included in application code.

Attachments, typing indicators, blocking/reporting and meeting scheduling are
outside this implementation. View profile reuses the existing full profile sheet,
including the person's meeting preferences.

## Validation

- TypeScript, full-project ESLint and the production build.
- `supabase/tests/messages.sql`: rollback-only database checks for request expiry
  independent of batch expiry, acceptance, idempotent sends, blank-message
  rejection, unread counts, read receipts, forged writes, outsider isolation,
  expected-account checks and anonymous denial. All fixture records roll back.
- Live browser checks with temporary accounts: desktop at 1440px, mobile at 390px,
  request acceptance, sending, Realtime delivery, recipient unread count and back
  navigation. Temporary accounts and their data were deleted afterward.

To try it: start the app, sign in to two accounts in separate browser profiles,
send a Hi from Discover, then open Messages as the recipient. Select the timed
avatar, say Hi back, and send a message. Switch accounts to reply and check read
receipts. At mobile width, opening a chat replaces the list; Back returns to it.
