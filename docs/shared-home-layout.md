# Shared Hi5 application layout

Every route under `/home` automatically receives the background, account controls,
content padding and bottom navigation from `app/home/layout.tsx`. `/home` redirects
to `/home/hi5`. The landing page at `/` uses the existing root layout.

## Building a feature page

Replace only your feature's placeholder `page.tsx`. Render the feature's content
there; the shared layout already provides the `main` element, notification button,
profile button and navigation. Use a `section` or `div` for your page's outer element.

Keep feature styles in a CSS module next to the page or component. Reuse the design
variables and helpers in `app/globals.css`. The layout controls the viewport
background, safe areas and space reserved for the fixed controls. Its content area
has a maximum width of `--page-width` (1180px); narrower features can set their own
maximum width inside it.

The shared components are named exports from `app/components/layout`:

- `BottomNavbar`: the only Client Component in the shell. It highlights both exact
  routes and descendants, such as `/home/messages/123`.
- `NotificationButton`: an accessible dummy button without notification behavior.
- `ProfileMenu`: an accessible dummy button displaying the existing `/logo.png`
  public asset, without profile or authentication behavior.

`HeaderButton.module.css` holds the common circular button styles. The other CSS
modules belong to their respective components or layout and do not affect other
routes. Icons are inline SVG; no icon dependency is required.

`PlaceholderPage` is temporary content for the existing empty route files. The
notification, profile, edit and conversation stubs also receive minimal exports
because empty `page.tsx` files prevent Next.js type checking and builds. Feature
owners can replace these placeholders independently.

## Review locally

Run `npm run dev` and open `/home`. Check all five navigation links, a nested route
such as `/home/messages/123`, and `/` at mobile and desktop widths. Only the matching
navigation item should be selected. Notification and profile buttons are inert.

Run `npm run lint`, `npx next typegen` and `npx tsc --noEmit` for lint and route/type
checks. `npm run build` verifies the production build.
