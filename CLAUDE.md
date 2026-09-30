# Working on Joyshine

Read this before touching anything. It is the short version; `HANDOFF.md`
next to it is the long one.

Joyshine is a real shop belonging to a real person, live at **joyshine.in**,
taking real enquiries. It is not a demo. Treat every change as something a
customer will see within ten minutes.

---

## What this is

A **static site**: plain HTML, CSS and vanilla JavaScript, served by GitHub
Pages, with Supabase behind it for anything that has to be stored. It opens
from a `file://` path, from any web server, and from GitHub Pages, unchanged.

**There is no build step.** No npm, no bundler, no framework, no TypeScript,
no package.json. If you find yourself wanting one, you have misunderstood the
project. The owner has to be able to open a file, read it, and change a word.

Routing is **hash based** (`#/p/id`, `#/c/cat`) because GitHub Pages cannot
rewrite clean URLs onto `index.html`. `404.html` catches real paths and hands
them back to the app.

---

## The rules that matter

**Never commit a secret.** The Supabase *publishable* key (`sb_publishable_…`)
is public by design and belongs in `assets/js/config.js`. The **`service_role`
/ `sb_secret_` key must never appear in any file** — it bypasses every access
rule in the database. The **Razorpay Key Secret** must never leave Razorpay's
dashboard. Only the Key ID goes in the panel.

**Never put a password on `admin.html`.** GitHub Pages serves everything
publicly; a JavaScript password check is decoration. The panel is safe because
it has no powers of its own: everything it can do is gated by Supabase's own
row-level security, which needs a real sign-in.

**Never fabricate a business fact.** No invented reviews, ratings, sales
figures, delivery times, prices or festival dates. If a number is not known,
the page says so or the section does not appear. A lunar festival with no date
set stays switched off rather than guessing and re-skinning the shop on the
wrong week. This has come up repeatedly and it is not negotiable.

**Never use the clipboard to move code into a browser.** It has twice been
overwritten mid-operation by the owner copying a password, which then got
pasted somewhere it should not have been. To put SQL into the Supabase editor,
use `monaco.editor.getModels()[0].setValue(...)` in the page.

**Never accept JavaScript as an uploaded "theme" or "icon".** Running someone
else's script on a page where people type their address is how card details get
stolen. Uploaded SVG is stripped of scripts, event handlers and outside
references by `SKIN.cleanSvg` before it is stored *and* again before it is
drawn. Themes are CSS tokens only.

**Preserve `CNAME`.** It holds `joyshine.in`. Delete it in a commit and the
domain detaches from the site.

**Verify security by attempting the thing being prevented**, not by reading the
policy. A `200` with an empty array means the rule worked. A `204` on a delete
means nothing about whether it deleted anything — ask for
`Prefer: return=representation` and look at what comes back.

---

## How to change and deploy

```bash
# 1. edit files
# 2. stamp every local asset URL with a fresh ?v= so returning visitors
#    do not get a ten-minute-stale cached copy
./bump.sh
# 3. commit
git add -A && git commit -m "…"
# 4. push — NOTE the account, see below
```

**Pushing needs the right GitHub account.** Two are signed in on the owner's
machine and `gh auth token` returns the wrong one:

```bash
T=$(gh auth token -u rajuvegeshana) && git \
  -c 'credential.https://github.com.helper=' \
  -c 'credential.https://github.com.helper=!f(){ echo username=rajuvegeshana; echo password='"$T"'; };f' \
  push -q origin main
```

GitHub Pages serves assets with `cache-control: max-age=600`, so a change takes
up to ten minutes to reach a browser that has been there before. `bump.sh`
exists for exactly this. **Always run it before committing a change to
anything under `assets/`.** Then wait for the deploy before testing live —
fetch the file and check for a string you just added rather than guessing.

---

## Conventions

- **Comments explain *why*, never *what*.** Every non-obvious decision in this
  codebase carries the reason it was made. Match that. A comment that restates
  the code is noise; a comment that records why a rule exists saves the next
  person an hour.
- **Prose, not shouting.** Interface copy is written in plain sentences, British
  spelling, no exclamation marks, no marketing voice, no emoji in the shop.
- **Patch scripts assert before they write.** When editing files with a script,
  `assert old in s` first. A `str.replace` that matches nothing writes the file
  back unchanged and silently does nothing — this has caused a whole panel of
  dead buttons once already.
- **Decoration is decoration.** Anything moving is `aria-hidden`,
  `pointer-events: none`, and completely still under
  `prefers-reduced-motion: reduce`.
- **`requestAnimationFrame` never fires in a background tab.** Anything relying
  on it needs a fallback, and several things here have one.
- **CSS custom properties do the theming.** ~60 tokens per theme in
  `themes.css`. Never hard-code a colour in a component.
- **Do not set `position` on something already fixed or sticky.** A blanket
  `position: relative` rule once knocked the whole printer rig into normal flow
  and added 2,000px of empty page. Check before you widen a selector.

---

## Testing

There is no test suite. Testing means:

1. `node --check <file>` after editing any JavaScript.
2. Push, wait for the deploy, then open the live page and actually use it.
3. For anything touching the database, try it as a stranger with the public key
   (`curl` with the `apikey` header) and confirm you get nothing back.
4. Use a **throwaway product, a scratch value or a test row** — never the
   owner's live data. Delete the test row afterwards and say that you did.

The owner's Chrome is often driven directly to test. If you do that, remember
the panel keeps unsaved work in that browser's `localStorage`
(`joyshine.admin.draft`); do not clear it without saying so, and put back
anything you changed.

---

## Where things live

| | |
|---|---|
| Site | https://joyshine.in (GitHub Pages, `rajuvegeshana/Joyshine`, branch `main`) |
| Panel | https://joyshine.in/admin.html |
| Database, storage, auth | Supabase project `fofjkevcrzxlaqbetqhq` |
| Owner | joyshine.3d@gmail.com · WhatsApp +91 73377 73186 |

The Supabase **account** is under a different address than the shop's: the
sign-in is `jaoyshine.3d@gmail.com` (note the extra *a*). This has wasted
hours before.

---

## Read next

- `HANDOFF.md` — the full state: every file, every table, every feature, what is
  finished, what is waiting on the owner, and why each decision was made.
- `MANUAL.md` — the owner's guide to the control panel, in their language.
- `README.md` — setup, hosting, domain, Supabase.
- `CHEATSHEET.md` — one page: where everything is, what it costs, what to avoid.
- `BRIEF.md` — the original 57-section product brief.
