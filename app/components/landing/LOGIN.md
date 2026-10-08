# Landing-page login

`Navbar.tsx` opens `LoginModal.tsx`, which keeps the existing landing-page modal
appearance. Form state, loading, accessible focus handling and error messages
are isolated from the rest of the navbar. Styles extend `landing.css` through
`LoginModal.module.css`.

The form calls the existing Supabase browser client's
`auth.signInWithPassword({ email, password })`. A successful session routes to
`/onboarding`, which checks the stored profile and sends complete profiles to
`/home`. Incomplete profiles see the setup form. Session persistence uses the SDK's
existing browser storage. Passwords stay in transient form state and are cleared
on success; no additional credential storage is added.

Invalid credentials, unconfirmed email, rate limits and connection errors have
friendly messages. A ref prevents duplicate submissions. Closing is paused
during sign-in, and an unmounted modal ignores the response for navigation.
Keyboard focus is trapped and restored on close; the dialog fits the visual
viewport above a mobile keyboard, and its inputs use 16px text.

Home routes remain public for development. This feature adds no route guards,
middleware, or requirement to log in before opening `/home/*`. Existing database
permissions and authenticated interaction RPCs continue to apply.

API reference: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
