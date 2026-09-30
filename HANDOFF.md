# Joyshine — the whole picture

Everything you need to pick this up cold and keep going. Read `CLAUDE.md`
first for the rules; this is the map.

Last written: 1 October 2026.

---

## 1. What Joyshine is

A 3D-printing business in Hyderabad, run by one person. It prints and sells
small things — puja pieces, lamps, keychains, desk objects, kids' toys,
personalised gifts — and also takes custom work: send a photo, an STL, a
MakerWorld link or just an idea, and get a quote.

The site is a shop with **two ways to buy**: Razorpay for card/UPI, or a form
that opens WhatsApp with the whole order typed out. WhatsApp is how most of the
business actually happens.

Tone throughout: *"Small things. Big joy."* Warm, plain, never shouty. British
spelling. No exclamation marks in the interface.

---

## 2. Shape of the thing

```
index.html          the shop — one page, hash routing, everything rendered by JS
admin.html          the control panel — same origin, no server, no password
404.html            GitHub Pages serves this for real paths; hands back to the app
CNAME               joyshine.in — deleting this detaches the domain
bump.sh             stamps ?v=<timestamp> on local asset URLs; run before every commit

assets/css/         base · components · shop · rig · character · themes · admin
assets/js/          see the table below
assets/data/        site.json — the file fallback if Supabase is unreachable
supabase/           eight SQL files, all of them run already
```

**15,900 lines**, 51 files, no dependencies, no build.

### The JavaScript, in load order

| File | Lines | What it owns |
|---|---|---|
| `config.js` | 245 | Every business setting. The thing the panel edits. |
| `occasions.js` | 337 | 45 Indian occasions + the resolver that picks today's |
| `products.js` | 672 | The seed catalogue, variant options, ~29 drawn SVGs |
| `cloud.js` | 272 | Supabase REST client — auth, settings, tables, uploads |
| `settings.js` | 111 | Merges Supabase → site.json → defaults, in that order |
| `catalogue.js` | 151 | Loads products/reviews/sales; customer file upload; line-up |
| `customise.js` | 251 | Per-product custom fields (text, dropdown, colour, upload) |
| `promo.js` | 167 | Ribbon, welcome popup, discount codes, visit counting |
| `analytics.js` | 98 | GA4 behind a consent notice — nothing loads until agreed |
| `legal.js` | 183 | Policy pages, hidden until the owner fills in three facts |
| `store.js` | 185 | Cart, wishlist, recents, money, search, totals |
| `icons.js` | 27 | The icon set, shared by shop and panel |
| `skin.js` | 330 | Uploaded art, icon overrides, per-theme type, cursors, logo |
| `kit.js` | 260 | Per-theme character: motif, accessory, accent icon, wording |
| `views.js` | 846 | Every screen, rendered as a string |
| `fly.js` | 190 | The add-to-basket arc (ported from a Motion component) |
| `app.js` | 1038 | Router, all interaction, Razorpay, WhatsApp, orders, GA |
| `review.js` | 121 | The confirm-before-publishing bar |
| `rig.js` | 226 | The printer chrome: ruler, filament rail, print bed |
| `admin.js` | 1184 | Panel shell, settings buffer, undo/redo, publish flow |
| `admin-catalogue.js` | 1071 | Products, orders, requests, reviews, offers, xlsx, line-up |
| `admin-content.js` | 486 | Content & art: hero, icons, type, brand, cursors, errors |
| `admin-shop.js` | 735 | The Workshop: filament, billing, money out, dashboard |

---

## 3. How the data flows

```
config.js defaults
      ↓ overridden by
assets/data/site.json          (only if Supabase is unreachable)
      ↓ overridden by
Supabase `settings` table      (what Publish writes)
      ↓ overridden by
localStorage preview           (only in the owner's own browser)
```

The catalogue works the same way: `products.js` is the seed and the safety net;
if the `products` table has rows, they win. **Any rows at all override the
whole seed** — which is why the shop currently shows one product.

---

## 4. Supabase

Project `fofjkevcrzxlaqbetqhq`. Sign-in is **`jaoyshine.3d@gmail.com`** — note
the extra *a*; it is not the shop's address.

### Tables

| Table | Who can read | Who can write |
|---|---|---|
| `settings` | anyone | signed in |
| `products`, `categories` | anyone | signed in |
| `orders` | **signed in only** | anyone may insert; signed in may change or delete |
| `requests` | **signed in only** | anyone may insert; signed in may change or delete |
| `reviews` | published ones, or signed in | anyone may insert **unpublished**; signed in may publish or pin |
| `posts` | published ones | signed in |
| `offers` | anyone | signed in |
| `visits` | signed in | anyone may insert |
| `filaments`, `bills`, `expenses` | **signed in only** | **signed in only** |
| `product_sales` (view) | anyone — id and count only | — |
| `filament_left` (view) | signed in only | — |

The asymmetry on `orders` is the important one: a customer must be able to
place an order without an account, and nobody must be able to read anyone's
address. Same for `requests` and for unpublished `reviews`.

### Storage

| Bucket | Public | Who may add |
|---|---|---|
| `product-images` | yes | signed in — also holds uploaded logos, fonts, animations |
| `customer-uploads` | readable by link | **anyone** — this is how a customer attaches an STL |
| `receipts` | no | signed in only — a receipt shows your supplier and prices |

`customer-uploads` being open to anonymous writes is deliberate and is the only
such door in the project. It is fenced by Supabase's own limits: 25 MB, and a
fixed list of types. Worth watching if it is ever abused.

### The SQL files — all eight have been run

1. `schema.sql` — settings
2. `schema-2-catalogue.sql` — products, categories, orders, requests, reviews, posts
3. `schema-3-media-reviews.sql` — product images bucket, customer reviews, offers, visits
4. `schema-4-uploads.sql` — the customer upload bucket **and the list of file types it takes**
5. `schema-5-reviews-sales.sql` — `reviews.pinned`, and the `product_sales` view
6. `schema-6-site-assets.sql` — widened `product-images` to take GIFs, fonts, Lottie JSON
7. `schema-7-workshop.sql` — filaments, bills, expenses, `filament_left`, receipts bucket
8. `schema-8-tidy.sql` — lets the owner delete an order or a request

They are all safe to re-run. The panel checks which are in place: **Publish →
Database setup → Check which are in place.**

---

## 5. What the shop does

**Buying** — Razorpay ("Buy now") or WhatsApp with the order pre-written. Cart,
wishlist, recently viewed, search with suggestions, bulk-price tiers, discount
codes with expiry and usage limits.

**Delivery address** — the PIN code is checked against India Post's own
directory: one it does not know cannot be used, one it does fills in district
and state and offers that PIN's localities. "Locate me" reverse-geocodes with
OpenStreetMap. Flat, building and floor are separate fields.

**Custom print** — four ways in (photo, 3D file, MakerWorld link, an idea). The
file uploads on send and WhatsApp gets the link; there is also a "paste a link"
field for anything already on a drive.

**Per-product customisation** — the owner defines fields per product (short
text, long text, dropdown, colour, file upload), and the customer fills them in
before adding to the cart.

**Reviews** — a customer can write one but cannot publish it; the database
refuses anything already marked published. The owner approves, and can pin one
to the homepage.

**"N people have bought this"** — read from a view over the real orders table,
which exposes a product id and a count and nothing else. Appears only once
something has genuinely sold.

**Eleven + eight themes** — clay, retro, futuristic, halloween, diwali, holi,
christmas, navratri, ganesh, krishna, tiranga, plus Valentine's week: rose,
propose, chocolate, teddy, promise, hug, kiss, valentine. Each brings its own
colours, typeface, motif drifting behind the page, accessory on the hero
unicorn, accent icon, wording and easing.

**The printer rig** — a ruler across the top that follows the pointer and the
scroll, a filament rail down the left that feeds as you read, and a print bed
along the bottom that fills as the page is consumed.

**Error pages** — a dead link, a product that has gone, a search that found
nothing, the database out of reach. Each offers the shop, the custom form, the
FAQ, every category and a pre-written WhatsApp message; each is editable.

---

## 6. What the panel does

**Dashboard** — is the shop answering and how fast, when it was last published,
what look it is wearing, takings and spending this month and all time, orders
waiting, filament nearly out, Razorpay key state, analytics state.

**Occasions** — 45 of them, each with a look, a banner, a featured tag and a
window. Fixed dates compute for ever. Lunar festivals stay off until the owner
sets the date — deliberately.

**Look** — the default theme, a pin that overrides everything, and whether the
engineering page keeps its own look.

**Content & art** — hero animation (four), hero artwork, twelve replaceable
icons with micro-interactions, per-theme typography with eight weights and
uploadable fonts, logo/favicon/share picture, the mouse pointer, error pages.

**Products** — full editor: sizes with L×B×H, materials with per-product
pricing and stock, colours, customisation fields, photographs, spreadsheet
import and export, and a **line-up** that decides which products lead the shop
and in what order, per occasion or every day.

**Orders, Requests, Reviews, Marketing, Traffic & SEO, Policies.**

**Workshop (private)** — Filament (spools with purchase date, price, weight;
what is left counted from bills), Billing (write up any sale, record grams and
which spool, see what the filament cost as a share of the price, print it), and
Money out (eleven categories, photographed receipts, a chart of the year).

**Publishing** — three buttons. *Cancel changes* lists what it will throw away.
*Save and preview* opens the shop wearing the changes. *Publish* stays closed
until you have previewed, then walks five steps on screen and, if one fails,
says which and offers the same settings as a file plus a link to commit them
through GitHub instead. Undo and redo, with Ctrl+Z.

---

## 7. Waiting on the owner

Nothing here can be invented. Each one blocks something real.

1. **The real catalogue.** One product exists. Everything else on the shop is
   placeholder art with invented prices. Fastest route: Publish → Download
   products.xlsx → fill it in → upload it back.
2. **The Razorpay Key ID.** Still `rzp_test_REPLACE_ME`, so "Buy now" cannot
   take a payment. WhatsApp orders work.
3. **Nine lunar festival dates** — Holi, Ugadi, Eid, Raksha Bandhan, Ganesh
   Chaturthi, Navratri, Dussehra, Dhanteras, Diwali. All switched on, all
   dateless, all therefore dormant.
4. **Real shipping, returns and bulk numbers** for the policy pages.
5. **GST status** — whether prices include it, and the number if registered.
6. **`www` CNAME at Hostinger** — `www.joyshine.in` still does not resolve.

---

## 8. Known and deliberate

- **Payments are not verified server-side.** The browser sets the amount and
  writes the "paid" mark. Someone could pay ₹1 for a ₹5,000 order, or invent a
  payment id entirely. The fix is a Supabase Edge Function that creates the
  Razorpay order server-side and checks the signature. Until then: **check the
  Razorpay dashboard before dispatch.** The owner has been told this plainly
  and chose to leave it for now.
- **The panel's work lives in one browser.** `localStorage` holds the draft, so
  publish from the machine you edited on. Opening the panel elsewhere starts
  from what is published.
- **Pop-ups.** Save and preview opens a tab; if the browser blocks it the same
  confirmation appears in the panel instead.
- **The `products` table overrides the seed entirely** — one row hides thirty.

## 9. Not built

Blog posts (the table exists), section-by-section image and copy editing, a
design-system editor, uploading a whole theme as a file (rejected on purpose —
CSS tokens only, never someone else's JavaScript), Razorpay server
verification, policy pages published (needs §7.4 and §7.5).

---

## 10. Things that have already gone wrong

Kept because they will otherwise happen again.

- A blanket `position: relative` rule to lift content above a background layer
  knocked the printer rig, the tab bar, the panels and the toasts out of fixed
  positioning. The filament rail vanished and the page grew 2,000px of nothing.
- `bump.sh` was once written with a regex that dropped the closing quote on
  every asset URL. Zero modules loaded. It is Python now, and it asserts.
- A patch script whose anchor no longer existed wrote the file back unchanged,
  leaving every button in the panel silently dead. **Assert before you write.**
- The clipboard was hijacked twice by the owner copying a password while a
  paste was pending, putting the password into the Supabase SQL editor. Use
  `monaco.editor.getModels()[0].setValue()` instead.
- The panel compared settings with `JSON.stringify`, but Postgres returns
  `jsonb` with its own key order, so it always believed there were unsaved
  changes. Sort keys before comparing.
- GitHub's `gh auth token` returns the wrong account's token on this machine.
  Always `-u rajuvegeshana`.
