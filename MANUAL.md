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
card, which options customers can pick, personalisation, and the five
expandable sections.

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
