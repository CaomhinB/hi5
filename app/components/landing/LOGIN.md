# Landing-page login

`Navbar.tsx` opens `LoginModal.tsx`, which keeps the existing landing-page modal
appearance. Form state, loading, accessible focus handling and error messages
are isolated from the rest of the navbar. Styles extend `landing.css` through
`LoginModal.module.css`.

The form calls the existing Supabase browser client's
`auth.signInWithPassword({ email, password })`. A successful session routes to
`/onboarding`, which checks the stored profile and sends complete profiles to
`/home`. Incomplete profiles see the setup form. Session persistence now uses
`@supabase/ssr` cookies shared with Next.js. Passwords stay in transient form state
and are cleared on success.

Invalid credentials, unconfirmed email, rate limits and connection errors have
friendly messages. A ref prevents duplicate submissions. Closing is paused
during sign-in, and an unmounted modal ignores the response for navigation.
Keyboard focus is trapped and restored on close; the dialog fits the visual
viewport above a mobile keyboard, and its inputs use 16px text.

Home routes now require login. See `app/lib/supabase/AUTH.md` for the server guard,
session refresh, signed-in landing navigation and migration notes.

API reference: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
