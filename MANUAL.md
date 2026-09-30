# Joyshine — user manual

Written for you, not for a developer. No code in here.

---

## Getting in

Go to **https://joyshine.in/admin.html**

Sign in with your email and password. If the password box is giving you
trouble, press **Show** to see what you typed. You stay signed in on that
browser.

**Forgotten it?** Type your email, click *Forgot your password?* and check your
inbox and spam. If nothing arrives within ten minutes, the email service is
being unreliable — go to Supabase → Authentication → Users → delete the user →
Add user, with **Auto Confirm User** ticked.

---

## The nine screens

### Today
What the shop looks like right now. Which festival is running, what is coming
up, and which festivals still need a date from you. Check this first.

### Occasions
35 Indian occasions. Switch one on and the shop re-skins itself for a window
around the date — different colours, a banner, and a set of featured products.

Christmas, New Year, Sankranti, Valentine's, Mother's Day and eight others work
out their own date every year. **The ones that follow the moon — Diwali, Holi,
Navratri, Raksha Bandhan, Ganesh Chaturthi, Eid, Dussehra and the rest — need
you to set the date once a year.** They stay switched off until you do, which
is deliberate: a guessed date would re-skin your shop in the wrong week.

For each one you control the look, how many days before it opens, how many days
after it closes, which products it features, and the banner wording.

### Look
The default theme, or pin one and ignore festivals entirely. Also the switch for
the Engineering pages.

### Products
Your catalogue.

**The fastest way to load your real products:** go to Publish → *Download
products.xlsx* → open it in Excel or Google Sheets → replace the rows with your
real products → save → Publish → *Upload a spreadsheet*. Keep the `id` column
as it is and rows update; clear it and you get a new product.

Editing one at a time works too: price, category, badges, the four specs on the
card, personalisation, and the five expandable sections.

**Sizes** are rows you write yourself: a name, what it adds to the price, and
the length, breadth and height in millimetres. Those dimensions show under the
size on the product page, so nobody has to guess what "Large" means. Leave the
list empty and the product is one size.

**Materials** are rows too: a name, what it adds to the price, how many you
have, and a line of explanation. Leave the stock box blank for made to order.
Put a number in and the shop shows "only 3 left" once it drops to five, then
greys the material out at zero so it cannot be ordered.

**The photograph** can come from your computer — the *Upload* button, or drag
the file onto the dotted box — or from anywhere online by pasting the link.
Uploads go into your own Supabase storage, up to 5 MB each.

In the spreadsheet these are two columns. `sizes` holds
`Medium|0|90x90x120 ; Large|250|130x130x170` — name, extra charge, then
L x B x H. `materials` holds `PLA|0|  ; ABS|220|3` — name, extra charge, stock
(blank for made to order). Semicolons separate the rows.

### Content & art

A tab of its own, in folding sections.

**Typography.** Two faces run the whole site: one for headings, one for
everything else. Set them once for every look, or give a single look its own
pair. Eight weights are separate from the faces and apply everywhere — page
heading, section heading, card heading, small heading, opening line, body,
small print and buttons. Leave any empty and it follows the one above it. A
live preview sits underneath.

**Logo, tab icon and share picture.** Upload the mark that sits beside the
word joyshine, the little picture in the browser tab, and the 1200×630 card
WhatsApp shows when somebody sends your link.

**The mouse pointer.** The ordinary arrow, the hand, a crosshair, an open hand,
or your own small picture — for every look or for one.

**Error pages.** This shop is a set of files on a CDN. There is no server to
fall over, so there is no 500, 502 or 503 to write. Four things can actually go
wrong, and each has its own wording, its own optional picture, and a *See it*
link that opens the real page:

- **404 — a page that does not exist.** An old link or a mistyped address.
  `joyshine.in/404.html` catches these and hands them to the shop, which names
  the address that was tried.
- **A product that has gone.** Retired or sold out. Four in stock are shown.
- **A search that found nothing.** The four ways to ask for a custom print are
  shown underneath.
- **The database cannot be reached.** Rare, and not fatal: the shop keeps
  working from the files it was built with, so this only warns that prices and
  stock may be a few minutes behind.

Four ways for the hero unicorn to behave — printing,
floating, turning on a stand, assembling itself — or replace it altogether
with your own SVG or PNG. Twelve icons can be swapped one at a time. Each look
can have its own headings and body face, including a font file you upload
(.woff2 is the one to use). And the wording on every "this is missing" page is
yours to write.

Anything you upload that is markup has its scripts and event handlers stripped
before it is saved, and again before the shop draws it. That is not optional:
an icon that could run code would be running it on the page where customers
type their address.

### The three buttons

**Cancel changes** shows you exactly what it is about to throw away, then puts
the panel back to what the live shop is wearing. The live shop is never touched.

**Save and preview** puts your changes aside and opens the shop in a new tab
wearing them. Walk the whole site.

**Publish** stays closed until you have done that. It lists every change, then
works through five steps on screen: still signed in, sent to the database, read
back, the shop agrees, preview cleared. If one fails it says which and why, and
offers the same settings as a file plus a link straight to the GitHub page that
puts them live the other way — the database is left exactly as it was.

### Undo, redo, cancel

The two arrows in the toolbar step back and forward through everything you have
changed this sitting — Ctrl+Z and Ctrl+Shift+Z work too. **Cancel changes**
throws the whole lot away and puts the panel back to exactly what the live shop
is wearing. None of the three touches the live shop.

### Traffic & SEO

The words Google shows under your link, the picture WhatsApp shows when someone
shares it, your Google Analytics switch and measurement ID, and the shop's own
visitor count: today, yesterday, this week against last week, the last thirty
days, where people landed and where they came from. The shop's count is its
own — once per browser per day, no cookies, nothing personal. Google Analytics
records rather more and lives at analytics.google.com.

### Publishing: look first, then confirm

Press **Publish** — either button, the one in the corner or the one in the
Publish tab — and the shop opens in a new tab wearing your changes, with a
bar along the bottom. Walk the whole site. When you are happy, **Confirm and
publish** lists every change in plain words — what it was, what it becomes —
and only then writes to the live shop. **Discard** throws the lot away and the
live shop never knew.

If your browser blocks the new tab, the same list and the same confirmation
appear inside the panel instead — so allow pop-ups for joyshine.in if you want
to see the shop itself before you commit.

Two things to remember: publish from the browser you have been editing in (the
panel keeps your work in that browser), and the list compares against what is
live right now, so it only ever shows what has actually moved since your last
publish. **Publish without reviewing** is still there in the Publish tab for
small corrections.

### Reviews

Customers write them under any product. They cannot publish their own — the
database itself refuses it — so everything lands in **Reviews** under "waiting
for you". Publish the ones you want, and pin the best to the homepage.

**"12 people have bought this"** is counted from your real orders. It needs
`schema-5-reviews-sales.sql` run once, and it shows nothing at all until
something has genuinely sold. There is no way to type a number in, on purpose.

### The line-up: what shows, and in what order

In Products, the **Line-up** card decides which products the shop leads with.
Add products, move them up and down, and that becomes the order everywhere at
once — the homepage rails, the shop grid, categories and search. Everything you
did not choose follows behind, unless you tick **Show only these products**, in
which case the rest is kept off the listings (a direct link to one still works).

Pick an occasion at the top of the card to give that day or week its own
line-up. Rose Day can lead with roses, Chocolate Day with boxes, and the
everyday order returns the moment the occasion ends. Leave it on *Every day* to
set the order the shop uses the rest of the year.

### Valentine's week

Seven days, seven looks, and an eighth for the fourteenth: Rose, Propose,
Chocolate, Teddy, Promise, Hug, Kiss, and Valentine's. Each day is a one-day
occasion, so it takes over on its own date and hands back to the Valentine's
run-up afterwards. They are switched on by default and each can be turned off
in Occasions like any other.

### What a theme changes

A look is not only a palette. Each one brings its own motif drifting behind the
page — bats for Halloween, flames for Diwali, powder for Holi, snow for
Christmas, dandiya for Navratri, feathers for Krishna, ribbons for the national
days, stars for retro, a scan over a grid for futuristic — and each drifts in
its own way. The hero unicorn dresses for it: a witch hat and a pumpkin, a diya
and a rangoli ring, a santa hat, a dupatta, a modak, a peacock feather, a
tricolour sash. The accent icon in the buttons changes with it, the display
typeface changes, and a small chip beside the hero says what the look is.

All of it is decoration. It sits behind the page, ignores the pointer, and
holds completely still for anyone whose device asks for less motion.

**The engineering page** follows the shop by default. The switch in Look —
*Give the engineering page its own look* — keeps it futuristic instead,
whatever the shop is wearing.

### Orders
Every order placed on the shop, whether paid by Razorpay or sent on WhatsApp.
Items, variants, totals, the delivery address, and a status you move through
*new → printing → packed → shipped → delivered*.

**Important:** this records what the customer asked for. It is not proof that
money arrived. Always check Razorpay for that.

### Requests
Custom print enquiries. Everything they filled in, with the status moving
through *new → reviewing → quoted → approved → printing → completed*. The file
itself arrives on WhatsApp.

### Reviews
Add the words customers actually send you — product, name, stars, text.
Customers can also leave one on the product page, and it sits here hidden until
you publish it. Nothing appears on the shop until you say so.

### Marketing
- **Ribbon** — one line across the very top. Good for a sale or a dispatch
  cut-off.
- **Welcome popup** — shown once to each new visitor, never again on that
  browser. You write the headline, the body, the code and the button.
- **Discount codes** — set the amount or percentage, a minimum spend, an expiry
  date, and a maximum number of uses.
- **Search engines** — the title and description Google shows, and the picture
  that appears when someone shares your link on WhatsApp.
- **Visitors** — how many people opened the shop, counted once per browser per
  day. No names, no cookies, nothing personal.

### Shop & contact
WhatsApp number, email, Instagram, Razorpay key, shipping rates, bulk pricing
tiers.

### Publish
Where the spreadsheet download and upload live, plus the connection checker and
a backup download.

---

## Publishing

Signed in, the top-right button says **Publish**. Press it and the live shop
updates within seconds. No files, no waiting.

**Preview on site** shows your changes in your browser only — nobody else sees
them. Useful for checking a festival skin before committing to it. **Clear
preview** turns it off.

---

## Things to be careful about

**Never share your Razorpay Key Secret.** The Key ID in the panel is fine and
public by design. The Secret stays in the Razorpay dashboard.

**Don't put passwords on your clipboard while using the panel.** Anything that
pastes on your behalf gets whatever is sitting there.

**Deleting a product cannot be undone.** Hiding keeps the record and takes it
off the shop. Prefer hiding.

**Check spelling on personalised products.** You print exactly what the customer
types. A reprint is a new order.

**Set festival dates in advance.** Diwali opens its window 28 days early. Set
the date in September, not November.

---

## When something looks wrong

Publish → **Run the check**. Six lines. All ticks means the shop and the
database are talking properly. If *"You can publish"* is red, your session
expired — sign in again.

If the shop looks like it lost your products, it hasn't: when the database is
unreachable the shop falls back to a built-in copy so customers never see a
broken page. Run the check to confirm.
