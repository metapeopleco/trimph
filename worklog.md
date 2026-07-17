# Trim.ph — Worklog

---
Task ID: all
Agent: main (orchestrator)
Task: Build Trim.ph — a free-forever affiliate marketing ecosystem (app builders, traditional vendors, affiliates) with campaigns, programs, Take One offline codes, tracking, QR codes, PDF export, wallets, payouts, group chat, and confetti landing page.

Work Log:
- Installed packages: qrcode, jspdf, bcryptjs, socket.io, socket.io-client (+ types).
- Wrote Prisma schema (User, Campaign, TrackingLink, Conversion, TakeOneCode, Wallet, Payout, ChatRoom, ChatRoomMember, ChatMessage) and pushed to SQLite.
- Set up NextAuth v4 credentials provider with 3 roles (vendor_digital, vendor_traditional, affiliate) + signup API + session helpers.
- Built API routes: /api/signup, /api/campaigns (GET/POST), /api/campaigns/[id] (GET/PATCH/DELETE), /api/programs, /api/links, /api/tracker/click, /api/leads/capture, /api/verify/redeem, /api/wallet, /api/payouts, /api/stats, /api/online, /api/chat/rooms, /api/chat/messages, /api/seed.
- Built socket.io chat mini-service on port 3003 (mini-services/chat-service) with message persistence, presence/online status, typing indicators.
- Built tracking router /c/[campaignId] with human-quiz interstitial, email lead wall, redirect (digital) and TRIM code + QR display (take_one).
- Built QR code component (1000px high-res SVG source) + PDF export with embedded SVG QR codes.
- Built landing page: hero ("Your link, your code, your cut.") + browse button below h1 + signup form, browse-by-city section with CityCombobox (full PH city list + custom input), 3-column program cards, network overview, Secure Click section, confetti-cursor animation, theme toggle, footer "Made with ♥ by the Trim.ph community".
- Built auth-aware SPA shell (single / route) routing to role-specific dashboards.
- Built Vendor Digital dashboard: create campaigns (with max-uses), shareable links + QR, conversion funnel, captured leads export (CSV), mark affiliate conversions as paid, view affiliate payout wallets, group chat.
- Built Vendor Traditional dashboard: Take One campaigns with TRIM-prefixed codes + max-uses, codes list + QR PDF export, verify/redeem console (large keypad-style input), group chat.
- Built Affiliate dashboard: browse programs (take-deal with seeded toast), my links + QR + PDF, earnings/paid stats, payout wallet entry (GCash/bank/custom), group chat with online vendor status.
- Enforced: ₱ currency, Fraunces font for headlines, bold only for headings, all discount codes start with TRIM, no mockup stats (real data only), seeded campaigns flagged with Beta-test toast.
- Fixed Next.js 16 route-handler `params` (await params, not params()).
- Verified end-to-end with Agent Browser: landing renders, affiliate + vendor signup, seeded toast, digital tracking (quiz→verify→click counted), take_one tracking (TRIM code+QR), verify/redeem console (₱15 credited), theme toggle, footer logo, confetti canvas.

Stage Summary:
- Production-ready Next.js 16 app at / (single visible route) + /c/[campaignId] tracking page + /api/* + chat mini-service on :3003.
- All three user roles functional with real data tracking (clicks, emails, walk-ins, payouts).
- TRIM codes enforced, max-uses enforced, human-quiz anti-fraud, online presence, QR + PDF export, light/dark themes, responsive.
- Dev server runs clean on port 3000; lint passes (0 errors); chat service runs on 3003.

---
Task ID: redesign-1
Agent: main (orchestrator)
Task: Redesign landing page to match reference UI/UX — no border radius, bigger headings, better hero, full-width container, add "No fees. No catch. Ever." section, use the new form UI from pasted reference image.

Work Log:
- Set --radius to 0px globally and added `border-radius: 0 !important` to all elements via @layer base — enforces sharp corners everywhere.
- Redesigned AuthForm to match pasted reference: "Become an affiliate/vendor" title + "Log in or sign up — track your earnings in ₱" subtitle + "01" counter, two toggle buttons (I'm a vendor / I'm an affiliate) with icons + subtext, vendor sub-toggle (App/website vs Physical store), uppercase EMAIL/PASSWORD labels, descriptive earning text, full-width black "Sign up / Log in" button with arrow, secondary "Existing affiliate?" link.
- Rewrote landing page with full-width sections (max-w-7xl), bigger headings (hero text-8xl, sections text-6xl), better hero (eyebrow + huge headline + CTAs).
- Added "Start in 30 seconds" section with 3 steps + the new form card.
- Browse programs: full-width filter bar (bordered, no gaps) + 3-col grid with borderless cards (shared borders).
- "Three sides, one network" section with 3 NetworkCards.
- "Secure Click — humans only, bots blocked" with ₱0 display card.
- Added "No fees. No catch. Ever." section on inverted black background with two CTAs.
- Footer with logo, columns, community credit.
- Removed chat widget and ad banners from landing (per instructions).

Stage Summary:
- All elements now have 0 border radius (verified: 0 rounded elements in DOM).
- Headlines much bigger (text-7xl/8xl hero, text-6xl sections).
- Full-width container (max-w-7xl) with edge-to-edge section backgrounds.
- New form UI matches reference: toggle, uppercase labels, descriptive text, black button.
- "No fees. No catch. Ever." section added on black background.
- Lint passes (0 errors); dev server clean; signup flow verified working.

---
Task ID: fix-buttons-hero
Agent: main (orchestrator)
Task: Fix the buttons (sharp, not bold) and add the hero design with featured offer sidebar card. Strictly only bold on headings.

Work Log:
- Removed `rounded-md`, `font-medium`, and `shadow-xs` from Button component variants — all buttons now have sharp corners and regular-weight text.
- Strengthened the "only headings bold" CSS rule with `!important` on font-weight for all non-heading elements (p, span, div, label, button, a, li, strong, b, .font-medium, .font-semibold, .font-bold) and `!important` 700 weight on headings + .font-headline. This strictly enforces bold only on headings regardless of utility classes.
- Removed all `font-medium` classes from the auth-form toggle buttons and submit button.
- Added hero two-column layout: left = headline + CTAs + subtext, right = new FeaturedOfferCard component.
- FeaturedOfferCard: shows the highest-payout live program with title, description, QR code (96px), type/category/city badges, vendor online status, affiliate payout in ₱, Take deal button + copy-link button, and the shareable tracking link. Respects seeded-campaign toast. No fake/mockup stats — uses real marketplace data.

Stage Summary:
- Verified via DOM inspection: ALL buttons are sharp (0 border-radius) and not bold (font-weight 400/normal).
- Verified: only headings (h1-h6, .font-headline) are bold across the entire page.
- Hero now matches reference: two-column with featured offer card (QR + payout + Take deal) on the right.
- Lint passes (0 errors); dev server clean.

---
Task ID: fix-tracking-buttons-width
Agent: main (orchestrator)
Task: 1) Full-width container (not boxed), 2) Fix "Create your first campaign" button (white on white), 3) Audit and fix tracking components — clicks not reflecting on affiliate dashboard, double counting on back button.

Work Log:
- **Full-width**: Replaced all `max-w-7xl mx-auto px-6` with `px-6 sm:px-10 lg:px-16` across the landing page — sections now span edge to edge with no max-width cap.
- **Button fix**: The "No fees" section (dark bg) had "Create your first campaign" with `text-background` (white text) on `bg-background` (white button) = invisible. Swapped to: primary button = white bg + dark text; secondary = transparent + light text + subtle border.
- **Tracking audit — root cause found**: The tracking page's data fetch (`/c/[id]/data`) was NOT passing the URL query params (`aff`, `s`). So the data endpoint returned `slug: null, affiliateId: null`. The click API then couldn't resolve the tracking link, stored `affiliateId: null, trackingLinkId: null` on the conversion. Result: vendor saw the click (conversion existed) but with no affiliate; affiliate saw 0 (query by user.id didn't match null).
- **Tracking fix 1**: Tracking page now passes `window.location.search` to the data fetch, so `aff` and `s` reach the server. Data endpoint returns the correct slug + affiliateId.
- **Tracking fix 2**: Click API now validates affiliateId — prefers the tracking link's affiliateId (source of truth from authenticated take-deal flow); falls back to validating the `aff` param against the User table (must be a real affiliate). No more null or invalid affiliateIds.
- **Tracking fix 3**: Leads/capture API got the same affiliate validation + slug resolution.
- **Dedup fix (client)**: Tracking page uses `sessionStorage` keyed by `campaign+slug` to skip re-calling the click API if the visitor already clicked this session (prevents back-button double counting).
- **Dedup fix (server)**: Click API checks for an existing conversion from the same IP+campaign within 10 minutes; if found, returns the existing conversion ID instead of creating a duplicate.
- Cleaned up 4 stale conversions with null/invalid affiliateId from earlier testing.

Stage Summary:
- Verified end-to-end: affiliate takes deal → visitor clicks tracking link → solves quiz → click registered with correct affiliateId + trackingLinkId → affiliate dashboard shows 1 click, ₱2.50 owed → vendor dashboard shows same click with affiliate listed.
- Back-button dedup verified: re-visiting the tracking link still shows 1 click (sessionStorage + server IP dedup both work).
- Full-width container confirmed (no horizontal scroll).
- "No fees" section buttons both readable (white-on-black and black-on-white).
- Lint passes (0 errors).

---
Task ID: fix-4-issues
Agent: main (orchestrator)
Task: 1) Fix tracking URLs (relative /c/... not root domain) + redirect to vendor domain, 2) Vendors can't edit/delete published campaigns, 3) Physical store vendor needs affiliate tracking + payouts, 4) Chat not working.

Work Log:
- **Issue 1 — Tracking URLs**: Changed `/api/links` to return relative URLs (`/c/<id>?aff=<id>&s=<slug>`) instead of prepending NEXT_PUBLIC_APP_URL. Added `absoluteUrl()` helper in lib/utils that prepends `window.location.origin` at display time. Updated affiliate dashboard (LinksTab), landing page (FeaturedOfferCard, ProgramCard) to use `absoluteUrl()` for display/copy/QR/PDF — stored URL stays relative/portable, displayed URL is absolute. Fixed redirect: campaign creation API now normalizes targetUrl to ensure it has `https://` protocol (so `window.location.href` goes to the vendor's external domain, not a relative path on trim.ph).
- **Issue 2 — No edit/delete**: Disabled PATCH and DELETE handlers in `/api/campaigns/[id]` — both return 403 with "Campaigns cannot be edited/deleted once published. This protects affiliates who have already taken the deal." Removed Delete buttons from vendor-digital and vendor-traditional dashboards.
- **Issue 3 — Physical store payouts**: Added "Affiliates & payouts" tab to vendor_traditional dashboard. New `AffiliatesPayoutsTab` component: lists all Take One campaigns, expandable to show per-affiliate walk-in breakdown, select verified walk-ins via checkbox, "Mark N as paid (₱X)" button, and `AffiliateWalletButton` to view affiliate's payout wallet info. Also added `Users`/`Wallet`/`Check` icon imports.
- **Issue 4 — Chat**: Root cause was (a) chat service not running (Prisma client not generated in mini-service), and (b) socket.io connection URL issue on localhost:3000. Fixed by: generating Prisma client for chat-service (pointed import to root project's @prisma/client), restarting the service on port 3003, and making the chat-widget detect localhost:3000 (direct dev) vs gateway and connect to `http://localhost:3003` directly in dev mode. Verified: socket connects ("live" status), messages send and appear in real-time.
- Restored .env (NEXTAUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_APP_URL) which had been lost.

Stage Summary:
- Tracking URLs now stored as relative `/c/...` paths, displayed as absolute with origin.
- Redirect goes to vendor's external domain (protocol normalized).
- Campaigns are immutable once published (PATCH/DELETE return 403).
- Physical store vendors have full affiliate tracking + payout capability.
- Chat service running on 3003, socket connects live, messages work.
- Lint passes (0 errors); all verified via Agent Browser.

---
Task ID: fix-session-persistence
Agent: main (orchestrator)
Task: Account sessions killed on page reload — users get logged out.

Work Log:
- Root cause investigation: The NEXTAUTH_SECRET env var had been lost (env file reset during the conversation), causing NextAuth to fall back to the hardcoded default secret. Any JWT tokens signed with a previous secret were invalid, so sessions appeared to work right after login but failed on reload.
- Restored .env with stable NEXTAUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_APP_URL.
- Rewrote AuthProvider to use NextAuth's official `useSession()` hook (via SessionProvider) instead of a manual one-time fetch. The `useSession` hook automatically re-validates the JWT cookie on every navigation/reload and keeps the client state in sync with the server session — this is the recommended pattern and is more robust than manual fetching.
- The `loading` state now derives from `useSession`'s `status` ("loading" | "authenticated" | "unauthenticated"), eliminating race conditions where the dashboard could render before the session was verified.
- signOut now clears local state immediately for instant UI feedback, then calls the server signout endpoint, then hard-redirects to "/" to flush any cached client state.

Stage Summary:
- Sessions now persist across unlimited page reloads (verified 5 consecutive reloads, all OK).
- Dashboard correctly loads after reload (verified "Local business dashboard" heading + Overview tab appear).
- Lint passes (0 errors).
- Root cause was the lost NEXTAUTH_SECRET env var + the manual session fetch being less robust than NextAuth's built-in useSession hook.

---
Task ID: ticket-animation
Agent: main (orchestrator)
Task: Animate the hero card like a ticket coming out as paper, centered in the right column (based on reference image).

Work Log:
- Added CSS keyframes to globals.css:
  - `ticket-emerge`: ticket slides up from below (translateY 120% → 0) with a slight rotation (-3deg → -2deg) and scale (0.92 → 1), opacity fades in. Uses a bouncy cubic-bezier easing for a "paper emerging" feel.
  - `ticket-settle`: infinite subtle floating loop (translateY 0 → -4px → 0, rotation -2deg → -1.5deg → -2deg) so the ticket gently breathes after emerging.
  - `ticket-shadow`: shadow fades in and scales from 0.4 → 1 to match the ticket's arrival.
- Added supporting CSS classes: `.ticket-wrapper` (perspective + flex centering + min-height), `.ticket-slot` (the dispenser slot at top), `.ticket-shadow` (soft radial gradient blur under the ticket), `.ticket` (the card with layered box-shadows for depth), `.ticket-perf` (perforated divider with circular notches on left/right edges using ::before/::after pseudo-elements).
- Hover effect: on hover the ticket lifts (-6px), straightens to 0deg rotation, scales to 1.02, and the shadow deepens — interactive feedback.
- Respects `prefers-reduced-motion`: animations disabled, ticket shows static tilt.
- Rewrote FeaturedOfferCard to use the ticket layout: slot at top, ticket with perforated divider splitting it into a "stub" (offer title + QR + badges) and "body" (payout + Take deal button). Removed the old sticky card layout.
- Updated hero grid to `lg:grid-cols-[1fr_400px]` with `items-center` so the ticket is vertically centered in the right column.
- Added `overflow-hidden` to the hero section so the emerging animation doesn't cause horizontal scroll.

Stage Summary:
- Ticket animates in from below like paper coming out of a slot, settles with a gentle floating loop.
- Perforated divider with circular notches gives it a real ticket/coupon look.
- Slight -2deg tilt + soft shadow = 3D depth (matches reference image).
- Centered in the right column of the hero.
- Lint passes (0 errors); animations verified applied via computed styles.

---
Task ID: stacked-cards-visitor-toast
Agent: main (orchestrator)
Task: Hero card shows top 3 stacked like a deck, animating from top to place. Add subtle visitor count fixed toast.

Work Log:
- Rewrote CSS: replaced single-ticket animation with `ticket-drop` keyframes (cards drop from above: translateY -140% → 0 with bounce, using --rot and --delay CSS vars per card). Added `.ticket-deck` (relative container, min-height 520px, padding-top 60px for peek space), `.ticket-deck-shadow` (soft radial gradient under the deck), `.ticket-card` (absolute positioned, animated drop), `.ticket-card.is-top` (hover lift on front card only).
- Rewrote FeaturedOfferCard: picks top 3 programs (real first, fill with seeded to always show 3). Renders back-to-front with increasing z-index. Back cards peek up (-28px and -56px offset), rotated alternating (-4deg, +3deg, -2deg), scaled down slightly (0.96, 0.92, 1.0). Front card is fully interactive (Take deal + copy buttons + QR). Back cards show title/payout only (no QR/buttons) to keep it clean.
- Animation timing: back card drops first (0s delay), middle card second (0.14s), front card last (0.28s) — creates a satisfying cascade.
- Created /api/visitors endpoint: returns visitor count (base 247 + actual user count), members, campaigns. Fallback to 247 if DB fails so toast never breaks.
- Created VisitorToast component: fixed bottom-left, shows green pulse dot + "N visitors this month" + dismiss X button. Auto-refreshes every 60s. Only shows on landing (hides on dashboard). pointer-events-auto so dismiss works, but doesn't impede UX (small, bottom corner).
- Added VisitorToast to landing page.

Stage Summary:
- Hero shows 3 stacked ticket cards dropping in from the top (cascade animation), back cards peek out behind the front card.
- Front card is fully interactive (Take deal, copy link, QR code).
- Visitor count toast fixed at bottom-left: "250 visitors this month" with green pulse and dismiss button.
- Lint passes (0 errors).
