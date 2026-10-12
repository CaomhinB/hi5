# Profile onboarding

The existing four-step form now collects `networking_role`, `work_arrangement`
and `open_to` in Step 3, under "How would you like to connect?". Options are
shared with My Profile's networking editor. Existing saved choices are prefilled;
new profiles use the agreed Collaborator / Any / Any defaults. Native select
controls use the form's existing glass styles and 16px mobile text.

`profileModel.ts` includes the choices in draft creation, validation and the
full onboarding payload. Section-edit payloads still contain only their original
section columns; networking choices are edited through the separate My Profile
networking section. Existing complete profiles do not need onboarding again.

The installed `save_my_onboarding_profile` function updates the core fields but
does not persist the new networking columns. `saveOnboardingProfile` therefore
uses the existing owner-validated `saveMatchingProfile` helper first, updating
just these three fields under the Hi5 Stage 2 RLS policies. City is omitted from
this update. Then the original core onboarding RPC saves the remaining profile.
Signup already creates the owner profile row, as established for this project.

This order ensures the chosen attributes exist before the profile becomes
complete and its first Hi5 can be generated. A profile-change event is emitted
after the full save succeeds, so the shared profile cache does not reload a
partly completed profile. If the core save fails, the networking choices may
already be stored; the form stays open and preserves its draft for retry.
No additional SQL installation is required.

TypeScript and ESLint checks pass. Live onboarding/database writes were not
exercised by the coding agent.
