# Hi5 page

`/home/hi5` now uses the Supabase routines installed in setup Stages 1-5.
Personal recommendations need a signed-in user with a complete profile. Guests
can still open the page and go to log in; other home pages remain accessible.
No additional SQL installation, AI API or dedicated backend service is required.

## Behaviour

- One stored 120-hour shortlist, with at most five candidate profiles returned.
- Five avatar positions, stored decision states, live match updates and a countdown
  based on the server clock. Missing candidates leave empty positions.
- Selecting an avatar brings its card forward. Only three cards are mounted in
  the stack, using Discovery's fixed dimensions and desktop swipe space.
- Pass/Hi use the existing one-second animation. Requests save during that
  animation; advancement waits for success and animation completion. Failure
  restores the card. The animated three-card order stays fixed while notifications
  arrive, and the next pending candidate is the first rear card.
- First decisions are final for the round. Decided candidates stay accessible
  through avatars for More and Save. More remains enabled when decisions are
  disabled. Pass does not display a toast; Hi/match feedback reuses Discovery.
- More opens the existing full profile/meeting sheet. My Card opens a card
  preview in the same sheet shape, with a close button, reduced-motion handling,
  focus restoration and iOS visual viewport sizing. It invents no self-match score.
- Save stays a local showcase animation, reset when the selected profile changes.
- `/home/hi5/filters` reuses `FiltersPanel` with owner-only database preferences,
  independently of Discovery's browser filters. Distance is omitted. City comes
  from the owner profile and contributes to ranking. Saves affect the next round;
  current scores, candidates and snapshots remain unchanged.
- My Profile exposes city, networking role ("Connect with me as"), work arrangement
  and Open to in a separate editable section. Writes touch only those four owner
  columns and reuse the Stage 2 RLS policies. Full profile overlays display them.

## Files and boundaries

- `hi5Api.ts`: account checks, RPC response validation, card/image mapping and
  preference reads/upserts. Fetches the current batch only; no browser pool ranking.
- `hi5Model.ts`: database/form conversion and countdown/status labels.
- `useHi5Profiles.ts`: one in-flight fetch, queued refresh, account-scoped lifecycle,
  expiry refresh, Realtime subscription and focus/reconnect/poll fallback. It aborts
  a pre-action read before publishing a confirmed decision so old pending data
  cannot replace it. It does not cache profiles across accounts or paginate a pool.
- `Hi5Experience.tsx`: avatar selection, three-card order, action coordination and
  reuse of the Discovery cards, swipe hook, action controls and feedback.
- `Hi5.module.css`: feature layout, avatar states and match ring. Shared home
  layout/global design tokens and Discovery card/animation CSS are reused.
- `filters/`: owner preference loading/saving, with the existing filter sheet UI.
- `MyCardPreview.tsx`: native dialog and card preview, reusing the full-profile
  sheet styles. The full-profile overlay remains the More implementation.
- `../profile/ProfileMatchingPreferences.tsx` and its model/API/CSS: four-field
  profile editor. The original core profile editing flow remains separate.

The interaction helper retains Discovery's `say_hi`/`pass_profile` calls and adds
Hi5 routing to `say_hi5`/`pass_hi5` with `expected_batch_id` and expected auth-user
checks. The shared swipe action component has an optional `decisionMade` flag;
the swipe hook exposes `clearError` for avatar changes. The filters component has
optional controlled initial values and an async save callback; Discovery continues
to use its original defaults/storage path. These are additive shared interfaces.

## Database contract and limits

Setup scripts and the scoring/cooldown policy live in `setup/`. The frontend
does not update candidate scores, decisions or matches directly. It sends batch-
bound action RPCs, then refreshes authoritative records. Scores are compatibility
measures, not probabilities; broadened-search explanations use human-readable
labels rather than database identifiers.

Realtime listens to private batch/candidate INSERT/UPDATE events filtered by
owner/current batch. It refreshes after subscription/reconnection, focus and
visibility, with a one-minute visible-tab fallback. An expiry timer requests
the replacement batch. Reads preserve the stored current batch; refresh buttons
cannot bypass cooldowns or regenerate it early. Refresh data stays visible so
routine notifications do not replace the screen with a loading state.

There can be fewer than five candidates if the complete, linked profile pool
outside safety exclusions and cooldowns is too small. Saved filters can be
broadened; these exclusions stay enforced. Deleted profiles disappear and
leave a slot. Empty slots are not filled mid-cycle. Demo default attributes
remain valid until owners edit them; missing meeting rows are allowed.

TypeScript compilation and ESLint were checked for this implementation. Browser
behaviour and live Supabase interactions were not exercised by the coding agent.
