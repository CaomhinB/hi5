# Hi5: Open Questions and Suggested Answers

Every open question from the spec (`docs/Hi5 Documentation - Pav.docx`). Each has a suggested answer. Kevin can accept or change each one.

Tag: **[Demo]** means it matters for the partner demo. **[Later]** means park it.

---

Testing Git knowledge 

## 1. Vision

**Why would someone use Hi5 instead of LinkedIn?** [Demo]
- Suggest: LinkedIn is a big list. Hi5 gives you 5 picked people a day and one clear action, "Say Hi". Simple, fast, no scrolling.

**What makes professional matchmaking useful?** [Demo]
- Suggest: it removes cold messaging. Both sides say Hi first, so every chat is wanted.

**Who is the main target user?** [Demo]
- Suggest: solopreneurs and founders. It fits the spec ideas (social connection for solopreneurs, taking a start-up from idea to product).

**What type of relationships?** [Demo]
- Suggest: collaborators, co-founders, freelancers and clients.

**Collaboration, recruitment, networking, co-founders, or all?**
- Suggest: collaboration and co-founders first. Add the rest later. Recruitment is a different product.

---

## 2. Target Users

**Who could use Hi5? Which types first?** [Demo]
- Suggest: founders, developers, designers, marketers, sales people. Show a mix in the fake profiles.

**AI agents through an MCP (idea from KB)?** [Later]
- Suggest: park it. Not in the demo.

**What is each user type looking for?** [Demo]
- Suggest: use the spec's list. Founder looks for developer, sales, marketing or partner. Developer looks for marketing help or a founder. Designer looks for collaborators.

---

## 3. Features

**Which profile fields are needed?** [Demo]
- Suggest: photo, name, role, location, company stage, years of experience, short bio, up to 4 tags. This is exactly what the mockup card shows. Skip the rest for now.

**Block matches and spam protection?** [Later]
- Suggest: add a Block option inside "More". Nothing else for the demo.

**Swipe left and right?** [Demo]
- Suggest: no. The mockups use buttons (Pass, Say Hi). Buttons are simpler to build and demo.

**Match percentage?** [Demo]
- Suggest: show it (87% in the mockups). In the demo it is a fixed number per fake profile. Real scoring later.

**Which filters?** [Demo]
- Suggest: role, industry, location, what they are looking for. Filters button opens a simple sheet.

**Chat after a match, read and unread, notifications, archive?** [Demo]
- Suggest: chat with a conversation list, unread dot and last message preview. Archive later.

**Match Pool: priority, notes, categories, favourites?** [Later]
- Suggest: Matches tab shows a simple list of matches. Add favourites and private notes later. Skip the priority ranking.

**Which notifications?** [Demo]
- Suggest: new match, new message, "Hi about to expire". Show them on the bell.

---

## 4. Structure and User Journey

**Spec navigation (Home/Profile, Match Search, Match Pool, Messages, Notifications, Settings) or mockup navigation (Discover, Matches, Hi5, Messages, Settings)?** [Demo]
- Suggest: use the mockup menu. It is the design truth.
- Mapping: Match Search becomes Discover. Match Pool becomes Matches. Home becomes the Hi5 tab. Notifications live behind the bell. Profile lives behind "My Card" and the avatar.

**What does the Hi5 tab do compared with Discover?** [Demo]
- Suggest: Hi5 is today's 5 people, with the card view. Discover is browse and search with filters.

**Landing, Login, Register, Forgot Password pages?** [Demo]
- Suggest: for the demo, skip login. Open straight into the app as a demo user. Add a simple landing page only if partners need one.

**Extra pages?**
- Suggest: none for now.

---

## 5. Onboarding

**How much information is required?** [Demo]
- Suggest: name, role, one goal. Everything else optional.

**What is optional?**
- Suggest: photo, bio, links, industries, location preference.

**Should users pick what they are looking for? One goal or many?** [Demo]
- Suggest: yes, pick one or more from the spec list (co-founder, developer, marketing help, client, mentor and so on). Better matches.

**Search with bare minimum info, full profile only to connect (idea from KB)?** [Later]
- Suggest: good idea. Try it after the demo. In the demo, skip onboarding.

---

## 6. Page-by-Page

**Landing page: headline, button, how it works.** [Later]
- Suggest: headline "Meet 5 people worth saying Hi to". One button. Three "how it works" steps.

**Register fields?** [Later]
- Suggest: name, email, password. Drop "confirm password" and use a show-password eye instead.

**Home dashboard: matches count, messages, profile completeness?** [Demo]
- Suggest: use the mockup only. The "Your Hi5" strip (3/5) is the dashboard.

**What do "Meet" and "More" do?** [Demo]
- Suggest: "More" opens a menu: view full profile, block, report. "Meet" suggests a time to meet a matched person (there is a dot on it). For the demo, make it a simple "coming soon" sheet.

**What is "My Card"?** [Demo]
- Suggest: your own profile card, as others see it.

**Chat page contents?** [Demo]
- Suggest: messages, a profile preview at the top, a message box. Fake replies are fine.

**Settings contents?** [Demo]
- Suggest: show the list from the spec (account, notifications, matching, privacy, logout). Buttons do nothing yet.

---

## 7. Visual Design

**Overall feel?** [Demo]
- Suggest: premium, calm, friendly, professional. Matches the mockups.

**Colour palette (primary, secondary, accent, background, text)?** [Demo]
- Suggest: primary blue `#2A5BEA` to violet `#7B5CF0` gradient. Accent cyan `#22D3EE`. Background lavender blur. Text navy `#12203D`. Detail in `CLAUDE.md`.

**Fonts (3 to 4)?** [Demo]
- Suggest: just one, Plus Jakarta Sans, in different weights. Simpler and cleaner than four.

---

## 8. Parking Lot

**Expiry: 3 days (Hatim) or 5 days (KB)?** [Demo]
- Suggest: 5 days. It matches the name and the mockups show "5d left". Send a reminder at 2 days left.

**"Meet 5 people within 5 days" wording?** [Demo]
- Suggest: keep it as a tagline. The mockup line is "Meet 5 people worth saying Hi to".

**Is it 5 a day or 5 within 5 days?** [Demo]
- Suggest: 5 picks at a time. Each Hi lasts 5 days. Refill as slots free up ("Finding for you..." in the strip). This clashes with "5 a day" in the brief, so please confirm.

---

## 9. Monetisation

**Free first month?** [Later]
- Suggest: yes. Not shown in the demo.

**Tiers: Bronze $5 (1 search a week), Silver $7 (3 a week), Gold $10 (unlimited)?** [Later]
- Suggest: not in the demo. The tiers say "searches", but the product is 5 picks. Rework the tiers around the number of Hi5 slots (for example 5, 10, unlimited) before pricing.

---

## 10. Demo Decisions (not in the spec)

**Fake login or none?** [Demo]
- Suggest: none. Open as a demo user.

**Where does the fake data live?** [Demo]
- Suggest: Supabase tables, filled by one script. Change it once, it changes everywhere.

**How many fake profiles?** [Demo]
- Suggest: 30. Enough that Pass and Say Hi never run out.

**Fake faces?**
- Suggest: AI-made portraits (Magnific). Never real people.

**Does "Say Hi" ever get a Hi back?** [Demo]
- Suggest: yes, for chosen profiles. After a short delay the app shows "It's a match", so partners see the full flow.

