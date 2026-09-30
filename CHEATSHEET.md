# Joyshine — cheat sheet

Everything on one page.

---

## Where things live

| Thing | Where | Who owns it |
| --- | --- | --- |
| The shop | https://joyshine.in | GitHub Pages |
| Control panel | https://joyshine.in/admin.html | same |
| Code | github.com/rajuvegeshana/Joyshine, branch `main` | GitHub account `rajuvegeshana` |
| Domain | joyshine.in | Hostinger (DNS only) |
| Database, logins, images | Supabase project `fofjkevcrzxlaqbetqhq` | Supabase |
| Payments | Razorpay dashboard | Razorpay |
| Orders conversation | WhatsApp +91 73377 73186 | your phone |

**The domain is at Hostinger but the site is not.** Hostinger only points the
name at GitHub. Four A records and four AAAA records on `@`, one CNAME on `www`
pointing at `rajuvegeshana.github.io`.

---

## How it fits together

```
Visitor → joyshine.in (GitHub Pages, static files)
                │
                ├── reads settings + products from Supabase
                │     └── if Supabase is down: uses the built-in copy, shop still works
                │
                ├── Buy now  → Razorpay checkout → order recorded in Supabase
                └── WhatsApp → message pre-filled → order recorded in Supabase

You → joyshine.in/admin.html → sign in → change things → Publish
                                              └── writes to Supabase → live in seconds
```

Nothing needs a server. Nothing needs to be rebuilt or re-uploaded to publish.

---

## Storage used

| What | Where | Size | Limit |
| --- | --- | --- | --- |
| Website code | GitHub repo | ~400 KB | 1 GB soft |
| Site delivery | GitHub Pages | — | 100 GB/month bandwidth |
| Database rows | Supabase Postgres | tiny | 500 MB free |
| Product images | Supabase Storage bucket `product-images` | 0 so far | 1 GB free, 5 MB per file |
| Visitor counts | Supabase, one row per browser per day | ~50 bytes/row | within the 500 MB |
| On this Mac | nothing after cleanup | 0 | — |

At your volume the free tiers are not close to being a constraint. Roughly:
500 MB of database is several hundred thousand orders; 1 GB of images is around
1,000 product photos.

**One thing to watch:** Supabase pauses a free project after **7 days with no
activity**. Your shop reads from it on every visit, so normal traffic keeps it
awake. If the shop goes quiet for a week, open the panel once to wake it.

---

## Things to avoid

**Never put the Razorpay Key Secret, or a Supabase `service_role` /
`sb_secret_` key, in any file.** They bypass every protection. The publishable
key in `config.js` is public by design and safe.

**Never delete `CNAME` from the repository.** The domain detaches silently and
joyshine.in stops working.

**Don't re-upload the whole site through the GitHub web interface.** It skips
hidden files like `CNAME` and `.nojekyll`. Use git, or upload only the files you
changed.

**Don't treat the Orders screen as proof of payment.** It records what was
asked for. Money is confirmed in Razorpay.

**Don't trust discount codes to be tamper-proof.** Expiry and usage limits are
enforced by the database, but the discount is calculated in the browser.

**Don't have a password on your clipboard while using the panel.**

**Don't turn Supabase email signups back on.** Anyone could then create an
account and change your shop.

**Don't accept a JavaScript file as a "theme" from anyone.** A theme should be
colours and shapes only. Running someone else's script on a page that handles
checkout is how card details get stolen.

---

## Fixing the four things that actually go wrong

**Can't sign in.** Check the email character by character first — a typo there
gives the same "Invalid login credentials" as a wrong password. Then use
*Forgot your password?*. If no email arrives, recreate the user in Supabase with
**Auto Confirm User** ticked.

**Changes don't appear.** Two different causes:

*Settings or products* — Publish → **Run the check**. Red on "You can publish"
means your session expired; sign in again.

*Design or layout, on another computer* — that is browser caching. GitHub Pages
tells browsers to hold each file for 10 minutes. Every asset URL now carries a
version stamp so a new deploy is a new URL, but the page itself can still be up
to 10 minutes stale. Wait, or hard refresh: **Cmd+Shift+R** on Mac,
**Ctrl+F5** on Windows.

**Shop shows old products.** The database is unreachable and the shop is using
its built-in copy. Run the check.

**Push to GitHub says permission denied.** You have two GitHub accounts. Use
`gh auth token -u rajuvegeshana`.

---

## The one thing still outstanding

**Every product, price and print time on the live site is a placeholder I
wrote.** Publish → Download products.xlsx → replace with your real catalogue →
upload it back. Until then, joyshine.in is advertising things you may not make.
