# Settings

The route uses the shared home layout, with feature styles and icons contained
in this directory. Account, Preferences and Help rows are demo buttons. Clicking
a row shows a coming-soon message; no preferences are changed or persisted.

Log out uses the existing Supabase browser client with
`auth.signOut({ scope: "local" })`, then replaces the document with `/`. The
local scope signs out the current session. Errors keep the page open and allow
retrying; a ref prevents duplicate requests. The button has red text with a
subtle static glow, keyboard focus styling, and a disabled loading state.

Reference: https://supabase.com/docs/reference/javascript/auth-signout
