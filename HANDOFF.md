# Joyshine — handoff brief

**Read this first if you are an AI assistant picking this project up.**
It is written so any capable model can continue without re-deriving decisions.
Everything below is fact as of the last commit, not aspiration.

---

## 1. What this is

A static e-commerce site for Joyshine, a 3D-printing studio in India, plus an
optional Supabase backend. No build step, no framework, no bundler. Plain HTML,
CSS and vanilla JavaScript, served by GitHub Pages.

- **Live:** https://joyshine.in
- **Control panel:** https://joyshine.in/admin.html
- **Repository:** https://github.com/rajuvegeshana/Joyshine (branch `main`)
- **Database:** Supabase project `fofjkevcrzxlaqbetqhq`, region as created
- **Owner's GitHub:** `rajuvegeshana` (note: a second account `rajuvegesana98`
  exists and does **not** have push access — see §9)

---

## 2. Hard rules for whoever works on this next

These are not preferences. Breaking them breaks the product.

1. **No build step.** Every file must run when opened directly. No npm, no
   bundler, no JSX, no TypeScript. Third-party code only from a CDN, and only
   in `admin.html` (currently SheetJS). The shop itself has zero dependencies.
2. **The database is optional.** The shop must render completely when Supabase
   is empty, slow or unreachable. Files are the fallback, always. This is
   tested; do not regress it.
3. **Never invent business facts.** No fake reviews, no invented star ratings,
   no made-up dispatch figures, no guessed festival dates. If a value is not
   known, leave it blank and surface that in the panel.
4. **The anon/publishable key is public.** It belongs in `config.js`. The
   `service_role` / `sb_secret_` key must never appear in any file here. Row
   Level Security is the actual protection.
5. **Customer data is not world-readable.** Orders and requests hold names,
   phone numbers and addresses. Anyone may INSERT one; only an authenticated
   user may SELECT. Verified by attempting both.
6. **Say what is true about payments.** Razorpay runs client-side with no
   server, so nothing is signature-verified and discount arithmetic is not
   tamper-proof. The README and the panel say this plainly. Do not quietly
   imply otherwise.
7. **Preserve `CNAME`.** It holds `joyshine.in`. Losing it detaches the domain.
8. **Run `./bump.sh` before committing any CSS or JS change.** GitHub Pages
   serves `cache-control: max-age=600`, so without a version stamp on the asset
   URLs a returning visitor runs yesterday's JavaScript against today's HTML.
   The script rewrites `?v=` on local `src`/`href` only — never a CDN or font.

---

## 3. File map

```
index.html                 the shop: app shell, panels, mobile tab bar
admin.html                 the control panel (Designer Kid design system)
CNAME                      joyshine.in
.nojekyll                  stops GitHub Pages running Jekyll

assets/css/
  base.css                 structure, type, layout, motion
  components.css           buttons, cards, drawers, forms, toasts, ribbon, popup
  shop.css                 rails, categories, product page, search, tab bar
  rig.css                  the printer chrome (scale rails, feed, bed)
  themes.css               retro / future / clay token sets
  admin.css                the control panel, on Designer Kid tokens

assets/js/
  config.js      <- business settings; the panel overrides these
  occasions.js   35 Indian occasions + the date resolver
  products.js    30 placeholder products, the ART library, shared variants
  cloud.js       Supabase REST client: auth, tables, storage, diagnostics
  settings.js    merges Supabase / site.json over config.js defaults
  catalogue.js   loads products & categories from Supabase, files as fallback
  promo.js       ribbon, welcome popup, discount codes, visit counter
  store.js       cart, wishlist, recently viewed, money, search, totals
  views.js       every screen, rendered as HTML strings
  fly.js         the fly-into-the-basket animation
  app.js         router, interactions, Razorpay + WhatsApp, order recording
  rig.js         the printer chrome, driven by scroll
  admin.js       panel shell, occasions, settings, publishing
  admin-catalogue.js  products, orders, requests, reviews, offers, visits, xlsx

assets/data/site.json      what the panel saved (settings + occasion overrides)
supabase/*.sql             three migrations, applied in order
```

---

## 4. How data flows

```
config.js defaults
   ↓  overridden by
Supabase `settings` row  (or assets/data/site.json if no database)
   ↓  read at boot by settings.js
window.JOYSHINE

products.js (30 placeholders)
   ↓  replaced, only if the table has rows, by
Supabase `products` + `categories`
   ↓  read at boot by catalogue.js
window.PRODUCTS / window.CATEGORIES
```

Boot order in `app.js`: `SETTINGS.load()` → `CATALOGUE.load()` → resolve theme
→ render route → `PROMO.start()`.

---

## 5. Database

Project `fofjkevcrzxlaqbetqhq`. Tables and their access:

| Table | Anonymous | Signed in |
| --- | --- | --- |
| `settings` | read | read + write |
| `categories` | read | read + write |
| `products` | read | read + write |
| `offers` | read | read + write |
| `reviews` | read published, **insert unpublished only** | full |
| `orders` | **insert only, cannot read** | full |
| `requests` | **insert only, cannot read** | full |
| `visits` | **insert only, cannot read** | read |
| storage `product-images` | read | write |

`public.claim_offer(text)` is a `security definer` function so a code's use
count increments atomically without exposing the table to writes.

Auth: email + password, **signups disabled**. One user. Password recovery emails
go through Supabase's shared SMTP and are unreliable — see §9.

---

## 6. What is built

- Shop: 8 categories, 30 products, variants (size/material/colour) with price
  deltas, personalisation, bulk tiers, cart, wishlist, recently viewed
- Search with a custom-print path when nothing matches
- Two buying routes: Razorpay checkout, and WhatsApp with a pre-filled message
- Custom Print: upload design / STL / MakerWorld link / describe, → WhatsApp
- Engineering & prototyping service line at `#/engineering`, locked to the
  futuristic theme
- Three themes, switchable, plus a 35-occasion festival calendar that re-skins
  the shop automatically around each date
- The printer "rig": scale rails top and bottom, filament feed, print bed,
  all driven by scroll, reporting the real material of the product in view
- Fly-to-basket animation (arc, spring, ripple), ported from Motion
- Control panel: occasions, themes, contact, shipping, bulk tiers, products,
  orders, requests, reviews, marketing, SEO, publishing, connection checker
- Products download to `.xlsx` and upload back
- Ribbon, welcome popup, discount codes, visitor counting

---

## 7. Future scope, in priority order

Nothing below is started.

**1. Replace the placeholder catalogue.** *Blocking everything.* All 30
products, their prices, materials and print times are invented. The owner
should export the spreadsheet, rewrite it, and upload it back.

**2. Razorpay verification.** Add one serverless route that creates a Razorpay
Order and a webhook that marks orders paid. Until then `orders` rows are a
record of intent. README §4 has the code sketch.

**3. Policy pages.** Terms, Privacy, Refund/Cancellation, Shipping, Contact.
Razorpay activation normally requires them.

**4. Section images and copy editing.** The panel edits settings and products
but not hero copy, rail titles or per-section images. Needs a `content` table
keyed by section id, and `views.js` reading from it with the current strings as
fallback.

**5. Blog.** The `posts` table already exists with RLS. Needs: a list page, a
post page, and an editor pane. No migration required.

**6. More themes + theme upload.** See the warning in §8.

**7. Design-system editing.** Exposing radii, shadows, fonts and the icon set
as editable tokens. Large; do §4 first.

**8. Stock.** A quantity per product, decremented when an order is recorded.
Only meaningful once §2 exists, otherwise counts drift.

**9. Customer accounts and order tracking.** Genuinely needs auth for shoppers.
Consider whether WhatsApp already serves this better.

---

## 8. Known risks, and one to refuse politely

**Uploading arbitrary code as a theme.** The owner has asked for this. Be
careful: accepting a JavaScript file and executing it on the shop means anyone
who reaches the panel — or the storage bucket — can inject a script into a page
that handles checkout. That is how card-skimming happens. The safe version is a
**CSS-only theme**: a token file validated against an allow-list of custom
properties, no `@import`, no `url()` to third parties. Offer that instead; it
delivers the same outcome (new looks) without the hole.

**Discount codes are client-side.** Expiry and usage limits are enforced by the
database, but the arithmetic happens in the browser. Fine as marketing; not
accounting-grade.

**Supabase free-tier email is unreliable.** Password recovery frequently never
arrives. Point SMTP at Resend/Brevo/SendGrid if it matters.

**Two GitHub accounts.** `gh auth token` returns the wrong account's token even
when `gh auth status` shows the right one active. Always
`gh auth token -u rajuvegeshana`.

---

## 9. Working practices that mattered

- **Never use the clipboard to move code into a browser.** It was overwritten
  twice mid-task by passwords the owner had copied, which then landed in the
  Supabase SQL editor. Write into the editor directly:
  `monaco.editor.getModels()[0].setValue(sql)`.
- Verify security by attempting the thing you are preventing, not by reading
  the policy. Every claim in §5 was tested with curl.
- The browser automation runs in a background tab where `requestAnimationFrame`
  never fires. Anything driven by rAF needs a timeout fallback, and screenshots
  taken right after a state change are often a stale frame.
