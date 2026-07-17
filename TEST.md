# Trim.ph — Test Document

> Comprehensive end-to-end testing guide for all user flows, edge cases, and integrations.
> Follow each path in order. Each test has steps, expected results, and verification commands.

---

## Table of Contents

1. [Environment & Test Accounts](#1-environment--test-accounts)
2. [Landing Page](#2-landing-page)
3. [Authentication](#3-authentication)
4. [Affiliate Flows](#4-affiliate-flows)
5. [Vendor Digital Flows](#5-vendor-digital-flows)
6. [Vendor Traditional (Take One) Flows](#6-vendor-traditional-take-one-flows)
7. [Tracking Router](#7-tracking-router)
8. [Payouts & Wallets](#8-payouts--wallets)
9. [Group Chat & Presence](#9-group-chat--presence)
10. [QR Codes & PDF Export](#10-qr-codes--pdf-export)
11. [Edge Cases & Deduplication](#11-edge-cases--deduplication)
12. [Theme & Responsive](#12-theme--responsive)

---

## 1. Environment & Test Accounts

### 1.1 Services

| Service | Port | Status check |
|---------|------|-------------|
| Next.js app | 3000 | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → `200` |
| Chat service (socket.io) | 3003 | `curl -s -o /dev/null -w "%{http_code}" "http://localhost:3003/?XTransformPort=3003"` → `400` (expected — socket.io endpoint) |

### 1.2 Pre-existing Test Accounts

These accounts already exist in the database from prior testing. You can log into any of them with the password `password123`.

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Affiliate | `affiliate@test.com` | `password123` | Has no links yet |
| Affiliate | `affdirect1784234966@test.com` | `password123` | Has 1 tracking link + 1 verified click |
| Vendor (digital) | `builder@test.com` | `password123` | Has "My SaaS App" campaign |
| Vendor (digital) | `vendor1784235116@test.com` | `password123` | Has "Click Test Campaign" |
| Vendor (traditional) | `cafe@test.com` | `password123` | Has "Free Pastry with Coffee" Take One |

> **Tip:** To start fresh, create new accounts with unique emails during the signup tests below.

### 1.3 Pre-existing Campaigns

| Campaign | Type | Reward | Seeded? | Vendor |
|----------|------|--------|---------|--------|
| Click Test Campaign | digital / click | ₱2.50/click | No | vendor1784235116@test.com |
| Free Pastry with Coffee | take_one / walk_in | ₱15/walk-in | No | cafe@test.com |
| My SaaS App | digital / click | ₱5/click | No | builder@test.com |
| TaskFlow — Productivity App | digital / email | ₱12/email | **Yes (Beta sample)** | demo@trim.ph |
| Bean & Brew Coffee Co. | take_one / walk_in | ₱25/walk-in | **Yes (Beta sample)** | demo@trim.ph |
| FitForge Gym — Free Trial Pass | take_one / walk_in | ₱80/walk-in | **Yes (Beta sample)** | demo@trim.ph |

---

## 2. Landing Page

### Test 2.1 — Landing page renders

**Steps:**
1. Open the Preview Panel (or a fresh incognito tab).
2. Navigate to `/`.

**Expected:**
- [ ] Header shows Trim.ph logo + nav (Browse, How it works, Free forever) + Theme toggle + "Affiliate login" + "Become an affiliate" buttons
- [ ] Hero shows "Your link, your code, your cut." in large Fraunces font (the word "your cut." is italic and muted)
- [ ] Hero eyebrow: "FREE FOREVER · NO PLATFORM FEES"
- [ ] Two CTA buttons: "Browse offers" (black) and "Sign up as affiliate" (outline)
- [ ] Featured offer card on the right (desktop only) showing a live campaign with QR code, payout, and "Take deal" button
- [ ] "Start in 30 seconds." section with 3 steps + the signup form
- [ ] "Browse programs by city." section with filters + program cards in a 3-column grid
- [ ] "Three sides, one network." section with Campaigns / Programs / Take One cards
- [ ] "Humans only, bots blocked." Secure Click section with ₱0 display
- [ ] "No fees. No catch. Ever." section on a black background with 2 readable buttons
- [ ] Footer with logo + "Made with ♥ by the Trim.ph community"

### Test 2.2 — Full-width container

**Steps:**
1. On the landing page, resize browser to 1440px wide.
2. Check section backgrounds.

**Expected:**
- [ ] Section backgrounds (header, hero, browse, footer) span the full viewport width edge-to-edge
- [ ] Content padding scales: `px-6` on mobile, `px-10` on tablet, `px-16` on desktop
- [ ] No horizontal scrollbar: `document.body.scrollWidth <= window.innerWidth` → `true`

### Test 2.3 — Confetti cursor animation

**Steps:**
1. On the landing page, move your mouse around.

**Expected:**
- [ ] Small monochrome confetti particles spawn at the cursor and drift/fade
- [ ] Particles are subtle (low opacity, mix-blend-mode: multiply)
- [ ] No performance lag

### Test 2.4 — Browse filters work

**Steps:**
1. Scroll to "Browse programs by city."
2. Click the city combobox → type "Makati" → select it.
3. Clear it, type a custom city name not in the list (e.g. "Marikina") → select "Use 'Marikina'".
4. Type in the search box: "coffee".
5. Change the type dropdown to "In-store codes".

**Expected:**
- [ ] City combobox filters the Philippine city list live as you type
- [ ] Custom city input is accepted via "Use '...'" option
- [ ] Search filters programs by title/description
- [ ] Type dropdown filters to digital or take_one only
- [ ] Empty state shows "No programs found" when no matches

### Test 2.5 — Program card QR + copy + PDF

**Steps:**
1. On any program card, click the QR icon button.
2. Click "Copy link" — verify clipboard has the tracking URL.
3. Click "PDF" — verify a PDF downloads with the campaign title + QR code.

**Expected:**
- [ ] QR code renders as crisp SVG
- [ ] Copy button shows a check icon briefly after clicking
- [ ] PDF downloads as `trimph-qr-codes.pdf` with the campaign name + QR

---

## 3. Authentication

### Test 3.1 — Sign up as affiliate

**Steps:**
1. Go to landing page, scroll to the "Start in 30 seconds" form.
2. Click "I'm an affiliate" toggle (should be active by default).
3. Enter email: `test+aff<timestamp>@test.com` (use a unique email).
4. Enter password: `password123`.
5. Click "Sign up / Log in".

**Expected:**
- [ ] Toast: "Welcome to Trim.ph!"
- [ ] Page reloads → shows "Affiliate dashboard"
- [ ] URL hash becomes `#dashboard`
- [ ] Session active: `fetch('/api/auth/session').then(r=>r.json()).then(d=>d.user.role)` → `"affiliate"`

### Test 3.2 — Sign up as vendor (digital)

**Steps:**
1. Sign out (click the sign-out icon in the dashboard header).
2. On landing, scroll to the form, click "I'm a vendor".
3. Click "App / website" sub-toggle.
4. Enter unique email + password.
5. Click "Sign up / Log in".

**Expected:**
- [ ] Toast: "Welcome to Trim.ph!"
- [ ] Dashboard shows "App builder dashboard"
- [ ] Role is `vendor_digital`

### Test 3.3 — Sign up as vendor (traditional)

**Steps:**
1. Sign out.
2. On landing form, click "I'm a vendor" → "Physical store".
3. Enter unique email + password.
4. Sign up.

**Expected:**
- [ ] Dashboard shows "Local business dashboard"
- [ ] Role is `vendor_traditional`
- [ ] Nav shows "Take One", "Verify & redeem" tabs (not "Campaigns"/"Leads")

### Test 3.4 — Login with existing account

**Steps:**
1. Sign out.
2. On landing form, enter `affiliate@test.com` / `password123`.
3. Click "Sign up / Log in".

**Expected:**
- [ ] No error toast (account exists → proceeds to login)
- [ ] Affiliate dashboard loads

### Test 3.5 — Login with wrong password

**Steps:**
1. Sign out.
2. Enter `affiliate@test.com` / `wrongpassword`.
3. Click "Sign up / Log in".

**Expected:**
- [ ] Toast: "Invalid credentials."
- [ ] Stays on landing page

### Test 3.6 — Duplicate signup

**Steps:**
1. Sign out.
2. Enter `affiliate@test.com` / `password123` (already exists).
3. Click "Sign up / Log in".

**Expected:**
- [ ] No error toast (the form treats 409 as "proceed to login")
- [ ] Successfully logs in

### Test 3.7 — Sign out

**Steps:**
1. From any dashboard, click the sign-out icon (top-right).

**Expected:**
- [ ] Returns to landing page
- [ ] Session cleared: `fetch('/api/auth/session').then(r=>r.json())` → `{}`

---

## 4. Affiliate Flows

> **Prerequisite:** Log in as an affiliate (use `affiliate@test.com` / `password123` or create a new one).

### Test 4.1 — Overview tab

**Steps:**
1. Go to the affiliate dashboard → Overview tab.

**Expected:**
- [ ] 4 stat cards: Active links, Verified clicks, Est. earnings (₱), Total paid (₱)
- [ ] "Your top links" section shows up to 5 links (or empty state with "Browse programs" button)

### Test 4.2 — Browse programs & take a real deal

**Steps:**
1. Click "Browse programs" tab.
2. Find "Click Test Campaign" (or "My SaaS App" or "Free Pastry with Coffee").
3. Click "Take deal".

**Expected:**
- [ ] Toast: "Deal taken! Your tracking link is ready."
- [ ] Page reloads to dashboard
- [ ] Overview now shows 1 active link

### Test 4.3 — Take a SEEDED deal (Beta toast)

**Steps:**
1. In Browse programs, find a campaign tagged "Beta sample" (e.g. TaskFlow, Bean & Brew, FitForge).
2. Click "Take deal".

**Expected:**
- [ ] Orange warning toast: "This is a seeded campaign for mockup"
- [ ] Description: "Please choose one of the real active campaigns. Admin will remove these seed campaigns at the end of Beta Test stage on Aug 15, 2026."
- [ ] Toast lasts ~8 seconds
- [ ] **No link is created** (the take-deal API call is blocked client-side)

### Test 4.4 — My links tab

**Steps:**
1. Click "My links" tab.

**Expected:**
- [ ] Each link card shows: campaign title, type badge, vendor name + online dot, reward amount, full tracking URL, Copy + QR + PDF + Open link buttons
- [ ] Click "Show QR" → QR code renders below
- [ ] Click "Copy" → clipboard updated, check icon appears
- [ ] Click "PDF" → single-page QR PDF downloads
- [ ] Click "Export all QR (PDF)" → multi-page PDF with all links
- [ ] Click "Open link" → opens tracking page in new tab

### Test 4.5 — Earnings tab

**Steps:**
1. Click "Earnings" tab.
2. Check the per-campaign breakdown table.

**Expected:**
- [ ] Stat cards: Total clicks, Emails captured, Walk-ins, Total conversions
- [ ] Pending payout (₱) and Total received (₱)
- [ ] Table lists each campaign with conversion count + reward total

### Test 4.6 — Payout wallet tab

**Steps:**
1. Click "Payout wallet" tab.
2. Click "GCash" preset → a row appears with name "GCash".
3. Enter a value: `09171234567`.
4. Click "+ Custom" → enter name "PayMaya" + value `test@example.com`.
5. Click "Save payout info".

**Expected:**
- [ ] Rows for GCash and PayMaya with editable name + value fields
- [ ] Trash icon removes a row
- [ ] Toast: "Payout info saved"
- [ ] Reload the page → entries persist

---

## 5. Vendor Digital Flows

> **Prerequisite:** Log in as a digital vendor (use `builder@test.com` / `password123`).

### Test 5.1 — Overview tab

**Steps:**
1. Go to the App builder dashboard → Overview.

**Expected:**
- [ ] 4 stat cards: Campaigns, Verified clicks, Est. owed (₱), Total paid (₱)
- [ ] "Recent campaigns" list (or empty state)

### Test 5.2 — Create a click campaign

**Steps:**
1. Click "New campaign" (sidebar or overview button).
2. Fill in:
   - Title: "Test Click Campaign"
   - Description: "Earning per verified click"
   - Destination URL: `https://example.com/signup`
   - Reward type: "Per verified click"
   - Reward amount: `0.50`
   - Max redemptions: `50`
   - Category: "SaaS"
3. Click "Create".

**Expected:**
- [ ] Modal closes, toast: "Campaign created"
- [ ] Campaign appears in the Campaigns tab
- [ ] Tracking link format: `/c/<campaignId>?aff=[affiliate]`

### Test 5.3 — Create an email campaign

**Steps:**
1. New campaign → reward type: "Per email captured", amount `10`.
2. Create.

**Expected:**
- [ ] Campaign created
- [ ] When an affiliate takes this deal and a visitor clicks, the tracking page shows an email capture step before redirect

### Test 5.4 — Campaign detail view

**Steps:**
1. Campaigns tab → click "View details" on any campaign.

**Expected:**
- [ ] Modal shows: title, description, shareable link + copy button, QR code
- [ ] Funnel stats: Clicks, Emails, Conv. rate
- [ ] Max redemptions indicator (if set)
- [ ] "Affiliates & payouts" section listing each affiliate with verified/paid counts
- [ ] Each affiliate has a "Payout info" button (opens their wallet)
- [ ] Checkboxes to select verified conversions + "Mark N as paid (₱X)" button

### Test 5.5 — Mark conversions as paid

**Steps:**
1. Open a campaign detail that has verified conversions.
2. Select 1+ verified conversions via checkbox.
3. Click "Mark N as paid (₱X)".

**Expected:**
- [ ] Toast: "Marked ₱X.XX as paid"
- [ ] Selected conversions move to "paid" status
- [ ] Vendor's "Total paid" stat increases
- [ ] Affiliate's "Total received" stat increases

### Test 5.6 — View affiliate payout wallet

**Steps:**
1. In a campaign detail, click "Payout info" next to an affiliate.

**Expected:**
- [ ] Modal shows the affiliate's name/email
- [ ] Lists their wallet entries (GCash, bank, etc.) with name + value
- [ ] If affiliate hasn't set up wallet: "No payout info provided yet."

### Test 5.7 — Leads tab + CSV export

**Steps:**
1. Click "Leads" tab.
2. If there are leads, click "Export CSV".

**Expected:**
- [ ] Table of captured emails with campaign + date
- [ ] CSV file downloads as `trimph-leads.csv` with columns: email, campaign_id, date

### Test 5.8 — Delete campaign

**Steps:**
1. Campaigns tab → click "Delete" on a campaign.
2. Confirm in the dialog.

**Expected:**
- [ ] Campaign + its tracking links + conversions + take-one codes + chat rooms all deleted
- [ ] Toast: "Campaign deleted"
- [ ] Campaign disappears from list

### Test 5.9 — Max redemptions enforcement

**Steps:**
1. Create a click campaign with max redemptions = `2`.
2. As an affiliate, take the deal.
3. Visit the tracking link 3 times (solve quiz each time from different sessions/IPs).

**Expected:**
- [ ] First 2 clicks register successfully
- [ ] 3rd click returns: "This campaign has reached its maximum redemptions."
- [ ] No 3rd conversion created

---

## 6. Vendor Traditional (Take One) Flows

> **Prerequisite:** Log in as a traditional vendor (use `cafe@test.com` / `password123`).

### Test 6.1 — Overview tab

**Steps:**
1. Go to the Local business dashboard → Overview.

**Expected:**
- [ ] 4 stat cards: Take One campaigns, Walk-ins redeemed, Est. owed (₱), Total paid (₱)

### Test 6.2 — Create a Take One campaign

**Steps:**
1. Click "New Take One".
2. Fill in:
   - Offer title: "Test Discount"
   - Description: "20% off test"
   - Reward per walk-in: `20`
   - Max redemptions: `100`
   - Number of TRIM codes: `5`
   - City: "Makati"
   - Category: "Food & Beverage"
3. Click "Create campaign".

**Expected:**
- [ ] Toast: "Created with 5 TRIM codes"
- [ ] Campaign appears in the Take One tab
- [ ] All 5 codes start with `TRIM-` (e.g. `TRIM-ABC123`)

### Test 6.3 — View codes

**Steps:**
1. Take One tab → click "View codes" on a campaign.

**Expected:**
- [ ] Modal shows: total codes, redeemed count, remaining count
- [ ] "Export all QR (PDF)" button
- [ ] Search box to filter codes
- [ ] Each code shows status: Available (black badge) or Used (gray, strikethrough)
- [ ] All codes start with `TRIM-`

### Test 6.4 — Verify & redeem console

**Steps:**
1. Click "Verify & redeem" tab.
2. Type a valid TRIM code from your campaign (e.g. `TRIM-XXXXXX`).
3. Click "Verify & redeem".

**Expected:**
- [ ] Success: green box "Code verified & redeemed successfully · ₱20.00 credited to affiliate"
- [ ] Toast: "Redeemed! ₱20.00 credited to affiliate"
- [ ] Code marked as redeemed in DB

### Test 6.5 — Redeem already-used code

**Steps:**
1. In Verify & redeem, enter the same code you just redeemed.
2. Click "Verify & redeem".

**Expected:**
- [ ] Error: "This code has already been redeemed."
- [ ] No new conversion created

### Test 6.6 — Redeem invalid code (not starting with TRIM)

**Steps:**
1. Enter `ABC123` (no TRIM prefix).
2. Click "Verify & redeem".

**Expected:**
- [ ] Error: "Invalid code. All codes must start with TRIM."

### Test 6.7 — Redeem non-existent code

**Steps:**
1. Enter `TRIM-FAKE99`.
2. Click "Verify & redeem".

**Expected:**
- [ ] Error: "Code not found."

### Test 6.8 — Cross-vendor redemption blocked

**Steps:**
1. Log in as vendor A, create a Take One campaign.
2. Log in as vendor B (different traditional vendor).
3. Try to redeem vendor A's code in vendor B's console.

**Expected:**
- [ ] Error: "This code belongs to a different vendor."

### Test 6.9 — Export all codes as QR PDF

**Steps:**
1. View codes on a Take One campaign.
2. Click "Export all QR (PDF)".

**Expected:**
- [ ] Multi-page PDF downloads (`trimph-qr-codes.pdf`)
- [ ] Each page has: campaign title, code label, high-res QR code, Trim.ph footer

---

## 7. Tracking Router

> The tracking page at `/c/[campaignId]?aff=[affiliateId]&s=[slug]` is the core conversion engine.

### Test 7.1 — Digital click campaign (happy path)

**Prerequisite:** An affiliate has taken a click-type campaign deal.

**Steps:**
1. Get the tracking URL from the affiliate's "My links" tab (format: `/c/<id>?aff=<affId>&s=<slug>`).
2. Open it in a new incognito window.
3. Solve the quiz: click the **Circle** (●).

**Expected:**
- [ ] Page shows: "Select the circle to continue" + 3 shape buttons (square, circle, triangle)
- [ ] After clicking circle: "You're verified!" screen
- [ ] "Continue to [Vendor name]" button appears
- [ ] Click it → redirects to the campaign's target URL
- [ ] Conversion created in DB with correct `affiliateId` + `trackingLinkId`

**Verify in DB:**
```bash
# Run this from /home/z/my-project
cat > check.js << 'EOF'
import { db } from './src/lib/db'
const c = await db.conversion.findFirst({ orderBy: { createdAt: 'desc' } })
console.log('Latest conversion:', JSON.stringify(c, null, 2))
await db.$disconnect()
EOF
bun run check.js
```
- [ ] `affiliateId` is NOT null (matches the affiliate who owns the tracking link)
- [ ] `trackingLinkId` is NOT null (matches the slug)
- [ ] `status` is `"verified"`

### Test 7.2 — Affiliate dashboard reflects the click

**Steps:**
1. Log in as the affiliate (from Test 7.1).
2. Check Overview / Earnings tab.

**Expected:**
- [ ] "Verified clicks" = 1 (or incremented)
- [ ] "Est. earnings" = ₱X.XX (reward amount × clicks)
- [ ] Earnings breakdown table shows the campaign with 1 conversion

### Test 7.3 — Vendor dashboard reflects the click

**Steps:**
1. Log in as the vendor (campaign owner from Test 7.1).
2. Check Overview.

**Expected:**
- [ ] "Verified clicks" = 1
- [ ] "Est. owed" = ₱X.XX
- [ ] Campaign detail → affiliate is listed with 1 verified conversion

### Test 7.4 — Wrong quiz answer

**Steps:**
1. Open a tracking link.
2. Click **Square** (■) or **Triangle** (▲).

**Expected:**
- [ ] Button highlights red briefly
- [ ] "Not quite — try again." message
- [ ] No click registered in DB
- [ ] Can try again (quiz resets after 800ms)

### Test 7.5 — Back-button deduplication

**Steps:**
1. Open a tracking link, solve the quiz (click registers).
2. Press browser Back button.
3. Forward to the tracking page again.
4. Solve the quiz again.

**Expected:**
- [ ] First click registered (count = 1)
- [ ] Second visit: quiz still shows, but solving it does NOT create a new conversion
- [ ] Count stays at 1 (sessionStorage dedup)

### Test 7.6 — Server-side IP dedup

**Steps:**
1. Open a tracking link, solve the quiz (count = 1).
2. Clear sessionStorage: in browser console → `sessionStorage.clear()`
3. Reload the tracking page, solve the quiz again.

**Expected:**
- [ ] Count stays at 1 (server-side dedup: same IP + same campaign within 10 minutes)
- [ ] The click API returns the existing conversion ID with `deduplicated: true`

### Test 7.7 — Email capture campaign

**Prerequisite:** An affiliate has taken an email-type campaign deal.

**Steps:**
1. Open the tracking link.
2. Solve the quiz.
3. "You're verified!" → email input appears.
4. Enter `test@example.com`.
5. Click "Unlock & continue".

**Expected:**
- [ ] Email input field with placeholder `you@email.com`
- [ ] After submitting: "Redirecting…" screen → redirects to target URL
- [ ] Conversion has `capturedEmail` set in DB
- [ ] Vendor's Leads tab shows the email

### Test 7.8 — Email capture skip

**Steps:**
1. On an email campaign tracking page, solve the quiz.
2. Click "Skip email — just take me there".

**Expected:**
- [ ] Redirects to target URL without capturing email
- [ ] Conversion has no `capturedEmail` (just a click)

### Test 7.9 — Invalid email rejected

**Steps:**
1. On an email campaign, solve quiz.
2. Enter `notanemail`.
3. Try to submit.

**Expected:**
- [ ] Submit button is disabled (or no action) — regex validation blocks invalid emails

### Test 7.10 — Take One tracking page (code display)

**Prerequisite:** A take_one campaign exists with unredeemed codes.

**Steps:**
1. Open the tracking link for a take_one campaign: `/c/<campaignId>?aff=<affId>&s=<slug>`
2. View the page.

**Expected:**
- [ ] Shows "Verified offer" badge
- [ ] Campaign title + description
- [ ] A TRIM code in a dashed box (e.g. `TRIM-XXXXXX`)
- [ ] QR code below the code
- [ ] "Copy code" button
- [ ] No quiz (take_one campaigns skip human verification)
- [ ] "All codes claimed" message if no codes remain

### Test 7.11 — Exhausted campaign

**Steps:**
1. Create a click campaign with max redemptions = `1`.
2. Take the deal as affiliate, click through once (uses the 1 redemption).
3. Open the tracking link again from a different session.

**Expected:**
- [ ] After solving quiz: "This campaign has reached its maximum redemptions."
- [ ] No new conversion created
- [ ] HTTP 410 from the click API

### Test 7.12 — Inactive campaign

**Steps:**
1. As vendor, create a campaign, then (via API or DB) set `isActive = false`.
2. Open the tracking link.

**Expected:**
- [ ] Error page: "Campaign not found or inactive."

---

## 8. Payouts & Wallets

### Test 8.1 — Affiliate sets up wallet

**Steps:**
1. As affiliate, go to "Payout wallet" tab.
2. Add: GCash `09171234567`, BPI `1234-5678-90`.
3. Save.

**Expected:**
- [ ] Toast: "Payout info saved"
- [ ] Entries persist after reload

### Test 8.2 — Vendor views affiliate wallet

**Steps:**
1. As vendor, open a campaign detail with conversions.
2. Click "Payout info" next to an affiliate who has set up their wallet.

**Expected:**
- [ ] Modal shows affiliate name/email
- [ ] Lists all wallet entries (name + value)
- [ ] Close button works

### Test 8.3 — Vendor logs a payout

**Steps:**
1. As vendor, open campaign detail.
2. Select 2 verified conversions via checkbox.
3. Click "Mark 2 as paid (₱X.XX)".

**Expected:**
- [ ] Toast: "Marked ₱X.XX as paid"
- [ ] Conversions move to `paid` status
- [ ] Payouts tab shows the new payout entry
- [ ] "Total paid" stat increases

### Test 8.4 — Affiliate sees received payout

**Steps:**
1. After Test 8.3, log in as the affiliate.
2. Check Earnings tab.

**Expected:**
- [ ] "Total received" stat = ₱X.XX (the payout amount)
- [ ] "Pending payout" decreases by the same amount

### Test 8.5 — Payouts tab (vendor)

**Steps:**
1. As vendor, click "Payouts & affiliates" tab.

**Expected:**
- [ ] "Total paid out" stat card
- [ ] Table of all payouts: affiliate name, amount, date

---

## 9. Group Chat & Presence

> Chat uses socket.io on port 3003, proxied via `?XTransformPort=3003`.

### Test 9.1 — Chat room auto-created on take-deal

**Steps:**
1. As affiliate, take a deal.

**Expected:**
- [ ] A chat room is created for that campaign (name: "<Campaign title> — Discussion")
- [ ] Both affiliate and vendor are members

### Test 9.2 — Send a message (affiliate)

**Steps:**
1. As affiliate, go to "Messages" tab.
2. Select a conversation from the left list.
3. Type "Hello, I have a question about this offer."
4. Press Enter (or click Send).

**Expected:**
- [ ] Message appears in the chat immediately (right-aligned, black bubble)
- [ ] Message persists after reload
- [ ] "live" indicator (green dot) shows socket connection is active

### Test 9.3 — Vendor receives message

**Steps:**
1. Log in as the vendor (in a different browser/incognito).
2. Go to Messages tab.
3. Select the same conversation.

**Expected:**
- [ ] The affiliate's message appears (left-aligned, gray bubble)
- [ ] Real-time: if both windows are open, new messages appear without reload
- [ ] Vendor's name shows in the conversation list

### Test 9.4 — Online presence indicator

**Steps:**
1. Open both affiliate and vendor dashboards simultaneously.
2. Check the conversation list.

**Expected:**
- [ ] Vendor's name shows a green dot + "online" when their dashboard is open
- [ ] Dot turns gray + "offline" when vendor signs out or closes the tab
- [ ] Presence updates within ~30 seconds (heartbeat interval)

### Test 9.5 — Typing indicator

**Steps:**
1. Both affiliate and vendor have the same chat open.
2. Affiliate starts typing in the input.

**Expected:**
- [ ] Vendor sees "Affiliate typing…" (italic, muted) in real-time
- [ ] Disappears when affiliate stops typing or sends the message

### Test 9.6 — Empty chat state

**Steps:**
1. Log in as a brand new affiliate with no links.
2. Go to Messages tab.

**Expected:**
- [ ] Empty state: "No conversations yet"
- [ ] Description: "Take a deal to start chatting with the vendor about an offer."

---

## 10. QR Codes & PDF Export

### Test 10.1 — QR code renders (high-res)

**Steps:**
1. On any program card, click the QR icon.
2. Inspect the QR code element.

**Expected:**
- [ ] QR renders as an inline SVG (not a raster image)
- [ ] Source SVG is generated at 1000×1000px (crisp at any display size)
- [ ] Scannable with a phone QR reader → opens the tracking URL

### Test 10.2 — Single QR PDF export

**Steps:**
1. On a program card or affiliate link, click "PDF".

**Expected:**
- [ ] File downloads: `trimph-qr-codes.pdf`
- [ ] A4 page with: campaign title (top), QR code (center, ~280pt), code/URL (below), "Trim.ph" footer
- [ ] QR is embedded as vector SVG (zoom in — stays sharp)

### Test 10.3 — Bulk QR PDF export

**Steps:**
1. As affiliate, go to "My links" → click "Export all QR (PDF)".
2. As vendor, open a Take One campaign → "Export all QR (PDF)".

**Expected:**
- [ ] Multi-page PDF — one page per link/code
- [ ] Each page has the campaign/code title + QR
- [ ] All pages have consistent layout

---

## 11. Edge Cases & Deduplication

### Test 11.1 — Click without affiliate ID in URL

**Steps:**
1. Open a tracking URL with NO `aff` or `s` params: `/c/<campaignId>`.

**Expected:**
- [ ] Quiz still shows
- [ ] After solving: conversion created with `affiliateId: null` (no one gets credited)
- [ ] This is acceptable for direct vendor links, but affiliates should always use their full URL with `&s=<slug>`

### Test 11.2 — Click with invalid affiliate ID

**Steps:**
1. Open: `/c/<campaignId>?aff=invalidId123`.

**Expected:**
- [ ] Quiz shows
- [ ] After solving: the click API validates `aff` against User table → invalid → `affiliateId: null`
- [ ] No crash, no false credit

### Test 11.3 — Click with valid slug (aff resolved from slug)

**Steps:**
1. Open: `/c/<campaignId>?s=<validSlug>` (no `aff` param).

**Expected:**
- [ ] Click API resolves affiliate from the tracking link's `affiliateId`
- [ ] Conversion has correct `affiliateId` + `trackingLinkId`
- [ ] Affiliate dashboard reflects the click

### Test 11.4 — Seeded campaign take-deal blocked

**Steps:**
1. As affiliate, try to take a seeded campaign.

**Expected:**
- [ ] Warning toast (see Test 4.3)
- [ ] No tracking link created
- [ ] Verify: `fetch('/api/links', {method:'POST',body:JSON.stringify({campaignId:'<seededId>'})})` → still blocked server-side? **Note:** The block is client-side only. If you call the API directly, the link IS created. This is by design — the toast warns the affiliate. The seeded flag is informational.

### Test 11.5 — Max uses on Take One codes

**Steps:**
1. As vendor, create a Take One with max redemptions = `2` and 5 codes.
2. Redeem 2 codes via the verify console.
3. Try to redeem a 3rd code.

**Expected:**
- [ ] First 2 redemptions succeed
- [ ] 3rd redemption: "This campaign has reached its maximum redemptions."
- [ ] Even though unredeemed codes remain, the campaign-level max is enforced

### Test 11.6 — Concurrent clicks (race condition)

**Steps:**
1. Create a campaign with max redemptions = `1`.
2. Open 2 tracking links simultaneously in 2 tabs.
3. Solve both quizzes at the same time.

**Expected:**
- [ ] Only 1 click registers (the maxUses check + count may allow a brief race, but the dedup by IP catches the second one since same IP)
- [ ] If from different IPs: the first succeeds, the second gets "exhausted" (410)

---

## 12. Theme & Responsive

### Test 12.1 — Light theme (default)

**Steps:**
1. Open the landing page (first visit).

**Expected:**
- [ ] Default theme is light (white background, black text)
- [ ] `document.documentElement.className` → `"light"`

### Test 12.2 — Dark theme toggle

**Steps:**
1. Click the theme toggle (moon/sun icon) in the header.

**Expected:**
- [ ] Background switches to dark (`oklch(0.11 0 0)`)
- [ ] Text becomes light
- [ ] `document.documentElement.className` → `"dark"`
- [ ] Trim.ph logo adapts (uses `currentColor`)
- [ ] Theme persists across reloads (localStorage)
- [ ] All sections, dashboards, modals respect dark theme

### Test 12.3 — Responsive (mobile)

**Steps:**
1. Resize browser to 375px wide (iPhone).
2. Scroll through the landing page.

**Expected:**
- [ ] Hero headline scales down (`text-6xl` on mobile vs `text-8xl` on desktop)
- [ ] Featured offer card stacks below the hero (single column)
- [ ] Program cards: 1 column on mobile, 2 on tablet, 3 on desktop
- [ ] Filters stack vertically
- [ ] Dashboard sidebar becomes horizontal scrollable tabs at top
- [ ] No horizontal scroll on any page

### Test 12.4 — Responsive (tablet)

**Steps:**
1. Resize to 768px.

**Expected:**
- [ ] 2-column program grid
- [ ] Hero + form side by side
- [ ] All touch targets ≥ 44px

---

## Appendix: Quick Verification Commands

### Check all services are running
```bash
curl -s -o /dev/null -w "App: %{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "Chat: %{http_code}\n" "http://localhost:3003/?XTransformPort=3003"
```

### Check current DB state
```bash
cd /home/z/my-project
cat > check-db.mjs << 'EOF'
import { db } from './src/lib/db'
console.log('Users:', await db.user.count())
console.log('Campaigns:', await db.campaign.count())
console.log('Tracking links:', await db.trackingLink.count())
console.log('Conversions:', await db.conversion.count())
console.log('Take-one codes:', await db.takeOneCode.count())
console.log('Payouts:', await db.payout.count())
console.log('Chat rooms:', await db.chatRoom.count())
console.log('Chat messages:', await db.chatMessage.count())
const convs = await db.conversion.findMany({ select: { id: true, affiliateId: true, trackingLinkId: true, status: true, capturedEmail: true, offlineCode: true } })
const bad = convs.filter(c => !c.affiliateId && !c.offlineCode)
console.log('Conversions with null affiliateId (should be 0 for affiliate-tracked):', bad.length)
await db.$disconnect()
EOF
bun run check-db.mjs
rm check-db.mjs
```

### Reset all test data (fresh start)
```bash
cd /home/z/my-project
cat > reset.mjs << 'EOF'
import { db } from './src/lib/db'
await db.conversion.deleteMany({})
await db.payout.deleteMany({})
await db.chatMessage.deleteMany({})
await db.chatRoomMember.deleteMany({})
await db.chatRoom.deleteMany({})
await db.trackingLink.deleteMany({})
await db.takeOneCode.deleteMany({})
await db.campaign.deleteMany({ where: { isSeeded: false } })
await db.wallet.deleteMany({})
await db.user.deleteMany({ where: { email: { not: 'demo@trim.ph' } } })
console.log('Test data reset (kept demo vendor + seeded campaigns)')
await db.$disconnect()
EOF
bun run reset.mjs
rm reset.mjs
```

### Run lint
```bash
cd /home/z/my-project && bun run lint
```

---

## Test Checklist Summary

Use this checklist to track your testing progress:

- [ ] **Landing**: renders, full-width, confetti, filters, QR/PDF
- [ ] **Auth**: signup (3 roles), login, wrong password, duplicate, sign out
- [ ] **Affiliate**: overview, browse, take real deal, take seeded deal (toast), my links + QR, earnings, wallet
- [ ] **Vendor Digital**: overview, create click campaign, create email campaign, detail view, mark paid, view wallet, leads CSV, delete, max uses
- [ ] **Vendor Traditional**: overview, create Take One, view codes, verify/redeem, already-used, invalid code, cross-vendor, export PDF
- [ ] **Tracking**: click happy path, affiliate dashboard reflects, vendor dashboard reflects, wrong quiz, back-button dedup, IP dedup, email capture, skip email, invalid email, take-one display, exhausted, inactive
- [ ] **Payouts**: affiliate wallet setup, vendor views wallet, vendor logs payout, affiliate sees payout, payouts tab
- [ ] **Chat**: room auto-created, send message, real-time receive, online presence, typing indicator, empty state
- [ ] **QR/PDF**: high-res render, single PDF, bulk PDF
- [ ] **Edge cases**: no aff ID, invalid aff ID, slug-only resolution, seeded block, max uses take-one, concurrent clicks
- [ ] **Theme/Responsive**: light default, dark toggle, mobile, tablet
