# Joyshine storefront

> **New here?** Start with the right file:
> - **[MANUAL.md](MANUAL.md)** — running the shop day to day. No code.
> - **[CHEATSHEET.md](CHEATSHEET.md)** — where everything lives, what it costs, what to avoid.
> - **[HANDOFF.md](HANDOFF.md)** — for a developer or an AI assistant taking this over.
> - **[BRIEF.md](BRIEF.md)** — the original product brief.
> - This file — how each part works, in detail.


Static site. Plain HTML, CSS and vanilla JavaScript — no build step, no npm,
no server. Open `index.html` and it runs. Drop the folder on GitHub Pages and
it is live.

```
joyshine/
  index.html                 app shell: header, search, footer, cart, tab bar
  .nojekyll                  tells GitHub Pages to serve the folder as-is
  BRIEF.md                   the product brief this was built from
  assets/css/base.css        structure, type, layout, motion
  assets/css/components.css  buttons, cards, drawers, forms, toasts
  assets/css/shop.css        rails, categories, product page, search, tab bar
  assets/css/rig.css         the printer chrome: scale bands, feed, bed
  assets/css/themes.css      the three looks (retro / future / clay)
  admin.html                 the control panel: occasions, themes, contact
  assets/data/site.json      what the panel saved; delete it for defaults
  assets/css/admin.css       control panel styles
  assets/js/admin.js         control panel logic
  assets/js/config.js        <- the defaults the panel edits
  assets/js/occasions.js     the Indian festival calendar
  assets/js/settings.js      merges Supabase / site.json over the defaults
  assets/js/cloud.js         Supabase REST client (optional)
  supabase/schema.sql        settings table (migration 1)
  supabase/schema-2-catalogue.sql   products, orders, requests, reviews, posts
  supabase/schema-3-media-reviews.sql  image bucket, customer reviews, offers, visits
  supabase/schema-4-uploads.sql     bucket for files customers attach to an enquiry
  supabase/schema-5-reviews-sales.sql  pinned reviews, and the real "how many sold"
  supabase/schema-6-site-assets.sql  room for GIFs, fonts and Lottie animations
  supabase/schema-7-workshop.sql    filament, bills, expenses — signed in only
  supabase/schema-8-tidy.sql        let the owner delete an order or a request
  assets/js/admin-shop.js    the Workshop: filament, billing, money out, dashboard
  assets/js/skin.js          hero art, icon overrides, per-theme type
  assets/js/review.js        the confirm-before-publishing bar
  assets/js/icons.js         the icon set, shared by shop and panel
  assets/js/admin-content.js the Content & art tab
  assets/js/catalogue.js     loads the catalogue from Supabase, files as fallback
  assets/js/promo.js         ribbon, welcome popup, discount codes, visits
  assets/js/admin-catalogue.js  products, orders, requests, reviews, offers, xlsx
  MANUAL.md                  the owner's guide
  CHEATSHEET.md              one page: where, how much, what to avoid
  HANDOFF.md                 brief for whoever works on this next
  assets/js/products.js      the catalogue, variants and drawn product art
  assets/js/store.js         cart, wishlist, recently viewed, money, search
  assets/js/views.js         every screen, rendered as HTML
  assets/js/app.js           router, interactions, Razorpay + WhatsApp handoff
  assets/js/rig.js           the printer chrome, driven by scroll
  assets/js/fly.js           the fly-into-the-basket animation
```

---

## 1. Put it on GitHub Pages

1. Create a repository (public, or private on a paid plan).
2. Upload the **contents** of this `joyshine` folder to the repository root —
   `index.html` must sit at the top level, not inside a subfolder.
3. Repository → **Settings → Pages** → Source: *Deploy from a branch* →
   Branch: `main`, folder: `/ (root)` → Save.
4. Wait a minute. Your site is at
   `https://<username>.github.io/<repository>/`.

Two details that matter:

- **`.nojekyll` is already in the folder.** Leave it there. Without it GitHub
  runs Jekyll over your files and can drop anything starting with an
  underscore.
- **Routing is hash-based** (`#/p/lumina-lamp`, `#/c/puja`). That is deliberate:
  GitHub Pages cannot rewrite clean URLs to `index.html`, so a path-based router
  would 404 on refresh. Hash URLs work anywhere, including from a `file://`
  double-click.

### The custom domain

`CNAME` in this folder holds `joyshine.in`. **Do not delete it, and make sure it
is part of every upload.** If you re-upload the site through GitHub's web
interface and leave `CNAME` out, the custom domain switches itself off and the
shop drops back to the github.io address without warning.

DNS at the registrar, for the apex:

    A     @    185.199.108.153
    A     @    185.199.109.153
    A     @    185.199.110.153
    A     @    185.199.111.153
    AAAA  @    2606:50c0:8000::153
    AAAA  @    2606:50c0:8001::153
    AAAA  @    2606:50c0:8002::153
    AAAA  @    2606:50c0:8003::153
    CNAME www  <username>.github.io

Delete any parking-page A or ALIAS record on `@` first. Tick **Enforce HTTPS**
in Settings → Pages once GitHub has issued the certificate, not before.

---

## 2. `config.js` — the only file you need for day-to-day changes

| Setting | What it does |
| --- | --- |
| `brand.*` | Name, tagline, the line in the hero, email, Instagram |
| `whatsapp.number` | Country code + number, digits only. No `+`, no spaces |
| `whatsapp.*Greeting` | First line of the order / custom / bulk messages |
| `razorpay.keyId` | Your Razorpay Key ID (see §4) |
| `shipping.flat` / `freeAbove` | Flat rate, and the free-shipping threshold |
| `bulk.tiers` | Quantity bands and the discount at each one |
| `custom.*` | Materials, colours, sizes and copy on the Custom Print page |
| `festival` | Name, note, and `active: false` to hide the festival rail |
| `defaultTheme` | `retro`, `future` or `clay` |
| `rails` | The homepage rows — reorder, retitle or delete them |

---

## 3. Adding and editing products

Everything lives in `assets/js/products.js`.

```js
{
  id: 'kumkum-barni',            // unique; the cart and URLs use it
  name: 'Kumkum Barni',
  cat: 'puja',                   // one of the eight ids in CATEGORIES
  price: 449,                    // rupees, not paise
  was: 549,                      // optional → strike-through + % off
  art: ART.barni,                // drawn art; recolours with theme and colour
  tags: ['bestseller','festival','gift'],   // drives badges and homepage rails
  blurb: 'One or two sentences.',
  story: 'Optional. The one detail worth knowing.',
  specs: { Material:'PLA', Layer:'0.16 mm', Print:'3 h 10 m', Size:'90 mm' },
  variants: { size: SIZES, material: MATERIALS, colour: COLOURS },
  details: D(materials, dimensions, care, production, shipping),
  bulk: true,                    // shows the bulk table and applies tier pricing
  personalise: { label:'Name to print', max:24, placeholder:'e.g. Aarohi' },
  reviews: [],                   // see §12
}
```

**Tags** that do something: `new`, `bestseller`, `trending`, `limited`,
`personalised`, `madeinindia` become the corner badge (first match wins);
`gift`, `festival`, `quirky` feed the homepage rails.

**Variants.** `SIZES`, `MATERIALS` and `COLOURS` are defined at the top of the
file and shared. Each option carries a `delta` that is added to the base price,
so `449 + 550 (XL) + 220 (ABS) = 1219` and the page updates live. Pass a slice
if a product only offers some of them: `size: SIZES.slice(1)`.

**Colour** is more than a label — picking a swatch recolours the drawn art on
the product page, in the cart and in search results.

**Photos instead of drawings.** Add `photo: 'assets/img/barni.jpg'` to a
product and it replaces the SVG. Square-ish crops look best.

**Made to order / quote only.** Set `price: 0, quote: true` and the buy buttons
become "Get a quote", pointing at the Custom Print page.

---

## 4. Razorpay

Put your Key ID in `config.js` (Dashboard → Account & Settings → API Keys).
Until you do, **Buy now** shows a reminder toast instead of opening checkout —
so you can publish the site before payments are ready.

With just the key, checkout works in *amount-only* mode: UPI, cards, netbanking
and wallets all work, and the customer sees a confirmation screen with the
payment id.

### The caveat you should know about

A purely static site cannot verify a payment. The amount is in JavaScript where
anyone can edit it, and there is no server to check Razorpay's signature. For
real money, pick one:

**A — add one serverless route (recommended).** Set `razorpay.orderEndpoint`
to a URL that creates a Razorpay Order; the site uses it automatically and falls
back to amount-only if it is unreachable. Free on Vercel, Netlify or Cloudflare
Workers — the site itself can stay on GitHub Pages.

```js
// POST /api/order
import Razorpay from 'razorpay';
const rzp = new Razorpay({ key_id: process.env.RZP_KEY, key_secret: process.env.RZP_SECRET });

export default async function handler(req, res) {
  const { items } = req.body;
  const amount = priceFromYourOwnList(items);       // never trust the browser
  const order = await rzp.orders.create({ amount, currency: 'INR', receipt: 'js_' + Date.now() });
  res.json({ id: order.id, amount: order.amount, currency: order.currency });
}
```

Add a second route for the `payment.captured` webhook to record the order.

**B — stay fully static.** Use Razorpay **Payment Pages** or a **Payment
Button** per product from the dashboard, and point Buy now at it. You lose the
cart; you keep zero infrastructure.

---

## 5. The three WhatsApp flows

All three build a message and open `wa.me/<your number>` with it typed out.
Nothing is sent from the website — the customer presses send. That is stated on
screen, because it is what actually happens.

1. **Order** — cart or single product. Collects name, mobile, email, address,
   PIN, landmark and delivery notes, with live validation and a preview of the
   exact message. "I'll collect" hides and skips the address. The address is
   saved on the customer's own device so repeat buyers type it once.
2. **Custom print** — four paths: upload a design, upload an STL, share a
   MakerWorld link, or just describe the idea. Collects quantity, size,
   material, colour, deadline and notes.
3. **Bulk** — the "Need 20+ pieces?" button on any product with `bulk: true`.

**About file uploads.** A static site has nowhere to upload a file to. The
form lets the customer pick a file so its name and size go into the message,
then WhatsApp opens and they attach it there in one tap. The screen says so
plainly. If you later add the serverless route from §4, that is the natural
place to accept real uploads.

---

## 6. The rig — the printer chrome

The site is framed like a machine that is printing the page you are reading.
It is three pieces, all in `rig.css` / `rig.js`:

**Top band.** A 40px scale under the header: 1px ticks, alternating 12px and
10px with a taller marked tick every tenth, hairline along the bottom. It
traverses sideways as you scroll, like the X axis carriage. On the left it
reads out **the material of whichever product is nearest the middle of your
screen** — real data from `products.js`, not decoration — with its extruder
temperature. On a product page it follows the material the customer actually
picked, so choosing ABS changes the readout to `ABS 250 C` as they click. On
the right, the X position across a 250 mm bed.

**Left rail.** The filament feed. The strand moves by exactly how far you
scrolled, in the direction you scrolled, and the spool rotates with it — scroll
up and the filament retracts. It is coloured by material, not by product
colour: a pearl-white product would otherwise leave an invisible strand, and
the material is what the rig is reporting. PLA is brand purple, PGLA teal, ABS
orange, resin ice blue.

**Bottom band.** The print bed. The bar fills as the page is consumed, the
nozzle slides along depositing a trail that fades out behind it, and the
readouts count layers and Z height against a 0.2 mm layer height. On phones it
shrinks to 32px and sits flush on top of the tab bar, whose height is measured
at runtime rather than assumed.

Tuning: `--rig-h` (band height), `--rig-tick` (tick spacing), and the
`--rig-line` / `--rig-ink` / `--rig-ink-2` tokens per theme in `themes.css`.
The whole rig is `aria-hidden` with `pointer-events: none`, and goes completely
still under `prefers-reduced-motion: reduce` while keeping the readouts
accurate.

---

## 7. Add to basket

Adding to the cart flies the product into the cart button. A clone of the
product tile arcs across the screen, shrinking to cart size and clipping away
in the last 5% so it disappears *into* the basket rather than on top of it. The
cart then takes the hit with a real damped spring, a ring ripples out of it,
and the product left behind springs back to full size.

It runs on both the product cards and the product page, and it is wired so the
cart count pops and the toast appears **when the item lands**, not when the
button is pressed.

This is a port of a Motion (React) component to the Web Animations API, because
the site has no build step. The arc is a quadratic bezier whose control point
sits `peak` of the way along the flight and `strength` off to one side, rotated
by `rotate`; the spring and the bounce are generated from the damped-oscillator
equations rather than faked with keyframes by eye.

Everything is in `FLY.config`:

| Knob | Default | What it does |
| --- | --- | --- |
| `strength` | `0.5` | how far the arc bulges off the straight line |
| `peak` | `0.15` | where along the flight the bulge sits |
| `rotate` | `0.9` | rotates the bulge direction, in radians |
| `direction` | `'cw'` | which side it swings, `cw` or `ccw` |
| `duration` | `450` | flight time in ms |
| `ease` | `cubic-bezier(.74,.18,.93,.69)` | slow start, whip finish |
| `basketVelocityFactor` | `0.05` | how hard the cart gets knocked |
| `stiffness` / `damping` | `500` / `12` | the cart's spring |
| `maxKnock` | `14` | px cap, so the cart never flies off |

To watch it in slow motion, open the console and set
`FLY.config.duration = 3000`.

**Failure modes are handled.** A background tab parks the animation clock, so
the flight is skipped entirely when the page is not visible, and the clone,
the ring and the cart's spring each have a timeout fallback — a tab switch
mid-flight can never strand a clone on screen or leave the cart button nudged
off-centre. Under `prefers-reduced-motion: reduce` the item lands instantly
with no flight at all.

---

## 8. The three looks

The swatches in the header switch between **retro**, **future** and **clay**.
Each changes colour, shape, shadow, typeface and background texture — not just
an accent. The choice is remembered per visitor.

To ship only one: set it as `defaultTheme` and delete the `.themer` block from
`index.html`. The other theme blocks in `themes.css` cost nothing if left.

---

## 9. Occasions — the festival calendar

The shop re-skins itself for a window around a festival: theme, banner and a
featured set of products. It is all in `assets/js/occasions.js`, edited from
the control panel, never by hand.

**35 occasions ship ready.** 13 of them — Christmas, New Year, Sankranti,
Valentine's, Republic Day, Independence Day, Mother's Day, Father's Day and so
on — are fixed dates or "second Sunday in May" rules, so they work out their
own date every year and you never touch them again.

**22 follow the moon** — Diwali, Holi, Navratri, Raksha Bandhan, Ganesh
Chaturthi, Eid, Onam, Dussehra, Dhanteras and the rest. Their dates move every
year, so **they ship with no date set on purpose**. A guessed Diwali date would
quietly re-skin your shop on the wrong week, which is worse than not skinning it
at all. They stay switched off until you fill the date in, and the panel's first
screen tells you exactly which ones are waiting.

Each occasion controls:

| Field | Effect |
| --- | --- |
| On / off | whether it can run at all |
| Look | which theme the shop wears while it runs |
| Opens / closes | days before and after the date the window is open |
| Featured tag | which products the banner and rail show |
| Banner | eyebrow, headline and one line of copy |

Overlapping occasions resolve to the **shorter** window, so Dhanteras wins over
a month-long Diwali run-up, then hands back.

A visitor who clicks a theme swatch keeps their choice — but only until the next
occasion starts, so your festival skin still reaches returning customers.

---

## 10. The control panel

Open `admin.html`. It runs from the same folder, needs no login, no server and
no internet, and it never sends anything anywhere.

- **Today** — what is running now, what is coming up, and which festivals are
  still waiting for a date.
- **Occasions** — the full calendar, one row each.
- **Look** — default theme, pin a theme, force an occasion out of season, and
  the engineering line's switch.
- **Shop & contact** — WhatsApp number, email, Instagram, Razorpay key,
  shipping, bulk tiers.
- **Publish** — download, load and reset.

**Preview on site** writes your changes to your own browser only and opens the
shop, so you can see a festival skin before anyone else does. **Save changes**
downloads `site.json`; drop it into `assets/data/` in your repo (Add file →
Upload files → Commit) and GitHub Pages redeploys in about a minute.

The file only records what you changed — everything else keeps following
`config.js`. Delete `site.json` and you are back to defaults.

### Which free tool to use for the rest

The panel deliberately does not do products, orders or stock. Here is the
honest ranking for a shop on GitHub Pages:

| | Cost | What it gives you | Catch |
| --- | --- | --- | --- |
| **This panel** | free | occasions, themes, contact, shipping, bulk | you commit a file by hand |
| **Pages CMS** (pagescms.org) | free | a proper form-based editor for products **in the browser**, commits straight to GitHub | needs a `.pages.yml` schema; edits files, not a database |
| **Decap / Sveltia CMS** | free | same idea, self-hosted | needs a GitHub OAuth relay — one Cloudflare Worker |
| **Supabase** | free to ~$25/mo | a real database: accounts, orders, stock, reviews, uploads | the site stops being purely static |

**My recommendation.** Use this panel for the festival calendar, and add
**Pages CMS** when editing `products.js` by hand starts to annoy you — it is
free, it is a hosted app so there is no OAuth to set up, and it commits to the
same repo GitHub Pages already serves. Nothing about the site changes.

Move to **Supabase** only when you actually need customer accounts, live stock
or an order history — not before. Those are the things a file in a repo cannot
do, and everything else is cheaper and steadier as files.

Whatever you pick, **do not put the admin panel behind a fake password.**
GitHub Pages serves every file publicly; a JavaScript password check is
decoration. `admin.html` is safe as it is because it has no powers — it only
downloads a file. The real gate is your GitHub account, which is where changes
actually land.

---

## 11. Supabase — publishing without committing a file

Optional. Without it the control panel downloads `site.json` and you commit it.
With it, **Publish** writes straight to the live shop and the change is visible
in seconds — from your phone, from anywhere.

You do **not** connect Supabase to GitHub. GitHub keeps serving the code;
Supabase holds the settings; the shop reads them at load. The commit step
simply disappears.

### Setting it up, once

1. Make a free project at supabase.com. Pick the region closest to your
   customers — Mumbai or Singapore.
2. Open **SQL Editor**, paste everything in `supabase/schema.sql`, press **Run**.
   That makes the table and, more importantly, the Row Level Security policies.
3. Go to **Authentication → Providers → Email** and **turn off "Enable
   signups"**. This matters: with signups on, anyone could create an account
   and would then be allowed to change your shop.
4. Go to **Authentication → Users → Add user**, enter your email and a
   password, and tick *auto confirm*. That is your login.
5. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon public** key into the `supabase` block in `config.js`.
6. Commit `config.js` once. That is the last commit you need for settings.

### The anon key is public, and that is fine

It ships inside your JavaScript where anyone can read it. It is an identifier,
not a password — it says *which project*, not *what you may do*. The lock is
Row Level Security: the policies in `schema.sql` let anyone **read** settings
(your shop needs that) and only signed-in users **write** them.

**Never put the `service_role` key in `config.js`.** That one does bypass every
policy. It belongs on a server, and this site does not have one.

### What happens when Supabase is slow or down

The shop waits three seconds, gives up, and falls back to
`assets/data/site.json`, then to the defaults in `config.js`. Tested with a
project that does not exist: the shop still rendered completely. Your customers
never see a database problem.

### Keep committing site.json anyway

**Download site.json** is still there in the Publish tab. Committing it now and
then gives you a version history of your settings in git, and a working fallback
if you ever lose the Supabase project. Belt and braces, and it costs one click.

---

## 12. Engineering & prototyping

A second service line at `#/engineering`, for functional parts rather than
gifts: rapid prototypes, jigs and fixtures, short runs, replacement parts,
enclosures. It is the same studio talking to a different customer, so it wears
the futuristic theme permanently — the theme switcher hides itself there — and
quotes on WhatsApp with its own opening message.

Materials, tolerances, build volume, file formats and lead times live in
`config.js` under `engineering`. Switch the whole line off with one checkbox in
the control panel.

---

## 13. Reviews

The review UI is built, but **there are no fake reviews and no invented star
ratings** — inventing social proof is both misleading and, for Indian
e-commerce, legally risky. Every product ships with `reviews: []` and shows an
honest empty state.

Add real ones as customers send them:

```js
reviews: [
  { name: 'Meera S.', rating: 5, text: 'The lid actually stays shut. Ordered two more.' },
],
```

The homepage "What our customers say" section appears automatically once any
product has a review, and stays hidden until then.

---

## 14. What a static site cannot do

From the brief, these need a backend and are **not** in this build:

- Customer accounts, login, saved addresses across devices
- Order history and live order tracking
- Products, orders, inventory, promotions and homepage editing in an admin
  dashboard (sections 26–38 of `BRIEF.md`). The control panel in `admin.html`
  covers occasions, themes, contact, shipping and bulk pricing; the rest needs
  one of the tools in §10.
- Real file uploads for STL and images
- Stock counts and out-of-stock states
- Discount-code validation
- Collecting reviews through the site

Today the studio manages all of this through WhatsApp and by editing
`config.js` / `products.js`, which is workable at this size. When it stops
being workable, the storefront you have does not get thrown away: adding a
backend means replacing where `products.js` and the order handoff get their
data, not rebuilding the shop.

---

## 15. Accessibility and motion

Labelled fields with inline errors, visible focus rings, `Esc` closes every
panel, `/` opens search, `aria-live` on previews and toasts, a skip link, and a
real tab bar on mobile rather than hidden navigation. Every animation —
including the hero's self-printing unicorn — stops under
`prefers-reduced-motion: reduce`.
