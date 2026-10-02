# CLAUDE.md: Hi5

## What Hi5 is

- Hi5 is a professional matchmaking app.
- Each day you get 5 picked people. You tap "Say Hi" on the ones you like.
- If they say Hi back, you match and can chat.

## Goal

- A partner demo web app.
- It must look like the mockups, on a phone.
- It is filled with fake profiles. No real users.
- Speed matters more than depth. Look and feel come first.

## Source files

- Spec: `docs/Hi5 Documentation - Pav.docx` (brainstorm doc, mostly questions).
- Mockups: `docs/mockup-home-1.png` and `docs/mockup-home-2.png`. These are the design truth.
- Logo: `docs/logo.png`.
- Open questions and suggested answers: `docs/decisions.md`.
- If the spec and the mockups clash, the mockups win.

## Tech

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (database, fake profiles, later login and chat)
- Vercel (hosting)

## Bottom menu

Five tabs, in this order. Same on every screen.

1. Discover
2. Matches
3. Hi5 (centre tab, highlighted, the home screen)
4. Messages
5. Settings

## Home screen (Hi5 tab), top to bottom

- Logo "Hi5" with the line "Meet 5 people worth saying Hi to". Bell and avatar on the right.
- "Your Hi5" strip. Shows 3/5 and 5 small avatars with a status under each: New, Hi sent (days left), Matched, Finding for you.
- Profile card. Photo, match percentage badge, name, verified tick, role, location, company stage, years, short bio, tag pills.
- Three buttons: Pass, Say Hi (big, in the middle), More.
- Row of three: Filters, Meet, My Card.
- Bottom menu.

## Design rules

Taken from the mockups and the logo.

**Feel:** premium, calm, friendly, professional. Light and airy.

**Colours**
- Brand gradient: blue to violet. About `#2A5BEA` to `#7B5CF0`. Used for the logo icon, the "5", the Say Hi ring and active states.
- Accent: cyan `#22D3EE` (from the logo, the "5" and the left figure).
- Lilac: `#B79CFF` (from the logo, the right figure).
- Dark text: navy `#12203D` (the "Hi" in the logo). Never pure black.
- Muted text: soft grey-blue.
- Verified tick: bright blue.
- Tag pills: soft tints of blue, teal, purple and pink, with darker text of the same colour.
- Page background: blurred lavender, periwinkle and pale blue swirl. A darker blue blurred version is used behind the phone on wide screens.
- Colours above are estimates from the images. Sample the real files if exact values matter.

**Frosted glass cards**
- White at about 50 to 70 percent see-through, with a background blur.
- Thin light border, soft shadow.
- The main profile card has two more cards stacked behind it, slightly offset.

**Shapes**
- Big rounded corners. About 24 to 32px on cards. Fully round for avatars and the circle buttons.
- Pills for tags and the smaller buttons.
- Nothing sharp.

**Fonts**
- One rounded, geometric sans. Use Plus Jakarta Sans (or Inter as a fallback) through `next/font`.
- Bold for the wordmark and names. Regular for bio text. Small text for labels.
- Chosen to match the logo, since the spec names no fonts. Kevin can change this.

**Logo**
- Use `docs/logo.png` as given. Do not redraw it or recolour it.
- Icon on its own for small spots. Icon plus wordmark for headers and the landing page.

**Layout**
- Built for a phone first. Around 390px wide.
- On a desktop screen, show the app inside a phone-shaped frame, centred.
- Big tap targets. Bottom menu always visible.

## Rules for Claude

- Kevin has not coded for 20 years. Explain everything in plain English. Short sentences. No jargon. If a tech word is needed, add a short plain tag after it.
- Always plan before building. Show the plan in short bullets. Wait for a yes.
- Make small changes. One thing at a time. Never a big rewrite.
- After every change, say how to test it. Give the exact steps, for example the command to run and what he should see.
- Ask before installing anything, adding a paid service, or spending money.
- Keep fake data realistic and safe. Use made-up names. Use AI-made or stock faces only. Never real people.
- Do not add features that are not in the mockups without asking.
- When something breaks: say what broke, what it means, and what you will do next. No error logs unless asked.
- No em dashes. Ever.
- Follow the chat style in the parent `CLAUDE.md` (answer first, then bullets, then what Kevin needs to do).


## Rules for All Agents
- This is the collaborative project where each member is assigned to a separate feature and will be developing it in separate branch and then merging to the main branch, therefore please while generating new files and code make it easy to merge versions into main branch later. 
- Utilise existing components when necessary. For example, If a component seems like a part of a main layout check in app/components/layout folder for their existance before generating a new one. 
- The backend should be handled withing Next.js as long as it's possible. If some backend feature will require a dedicated backend service please inform me by clearly stating the problem and options to me before proceeding.
- Refer to global.css for the main design features but generate page/component specific css files when needed. 
- Please analyse each prompt and if it seems to lack some crucial information please ask me for more details before proceeding.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
