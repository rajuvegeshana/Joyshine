/* ===========================================================
   CONTROL PANEL
   Reads the defaults from config.js and occasions.js, lets you
   change the parts that change often, and writes a site.json
   holding ONLY what differs. Nothing is sent anywhere: preview
   writes to this browser, saving downloads a file you commit.
   =========================================================== */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const CFG = window.JOYSHINE;
const OCCS = window.OCCASIONS;
const YEAR = new Date().getFullYear();
const THEME_LIST = [['clay','Clay'],['retro','Retro'],['future','Futuristic'],
  ['halloween','Halloween'],['diwali','Diwali'],['holi','Holi'],
  ['christmas','Christmas'],['navratri','Navratri'],
  ['ganesh','Ganesh'],['krishna','Krishna'],['tiranga','Tiranga'],
  ['rose','Rose'],['propose','Propose'],['chocolate','Chocolate'],
  ['teddy','Teddy'],['promise','Promise'],['hug','Hug'],
  ['kiss','Kiss'],['valentine',"Valentine's"]];
const PREVIEW = 'joyshine.preview';
const DRAFT = 'joyshine.admin.draft';

/* the edit buffer: only what differs from the defaults */
let patch = { settings: {}, occasions: [] };
try { patch = JSON.parse(localStorage.getItem(DRAFT)) || patch; } catch {}

let dirty = false;

/* ---- undo / redo, for this sitting -------------------------
   Every edit pushes the whole patch onto a stack. It is small
   — it holds only what differs from the defaults — so keeping
   fifty of them costs nothing and makes every step reversible. */
const past = [JSON.stringify(patch)];
let at = 0;               /* where we are in `past` */
let quiet = false;        /* true while undo/redo is rewriting */

function pushHistory() {
  if (quiet) return;
  const now = JSON.stringify(patch);
  if (now === past[at]) return;
  past.splice(at + 1);                 /* a new edit forks the future */
  past.push(now);
  if (past.length > 60) past.shift();
  at = past.length - 1;
  paintHistory();
}

/* "Saved" means: this browser has put the changes aside and shown them
   to you on the site. Publish only opens once that has happened. */
let saved = false;

function paintHistory() {
  const u = $('#btnUndo'), r = $('#btnRedo'), d = $('#btnDiscard');
  if (u) u.disabled = at <= 0;
  if (r) r.disabled = at >= past.length - 1;
  if (d) d.hidden = !dirty;
  const pub = $('#btnSave');
  if (pub) {
    pub.classList.toggle('ad-btn--dim', !(saved && dirty));
    pub.title = !dirty ? 'Nothing has changed since the last publish'
      : !saved ? 'Press Save and preview first' : 'Publish to the live shop';
  }
  const sp = $('#btnSavePrev');
  if (sp) sp.classList.toggle('ad-btn--dim', !dirty);
}

function step(dir) {
  const want = at + dir;
  if (want < 0 || want >= past.length) return;
  at = want;
  quiet = true;
  patch = JSON.parse(past[at]);
  save();
  dirty = at > 0 || Object.keys(patch.settings).length > 0 || patch.occasions.length > 0;
  $('#unsaved').hidden = !dirty;
  paintAll();
  quiet = false;
  paintHistory();
  toast(dir < 0 ? 'Undone' : 'Redone');
}

const mark = () => {
  dirty = true; saved = false;
  $('#unsaved').hidden = false;
  save(); paintJson(); pushHistory(); paintHistory();
};
const save = () => { try { localStorage.setItem(DRAFT, JSON.stringify(patch)); } catch {} };

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'ad-toast'; t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ---- read / write the patch ------------------------------ */
function setS(path, value, fallback) {
  const parts = path.split('.');
  if (value === fallback || value === '' || value === null) {
    // still record it: an explicit blank is a real choice for text fields
  }
  let node = patch.settings;
  for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]] ||= {};
  node[parts.at(-1)] = value;
  mark();
}
function getS(path, fallback) {
  const parts = path.split('.');
  let node = patch.settings;
  for (const p of parts) { if (node == null) break; node = node[p]; }
  if (node !== undefined && node !== null) return node;
  let cfg = CFG;
  for (const p of parts) { if (cfg == null) return fallback; cfg = cfg[p]; }
  return cfg ?? fallback;
}
/* A pinned look beats the default and every occasion, which is easy to
   forget a month later when the default will not budge. Say so. */
function paintPin() {
  const note = $('#pinNote'); if (!note) return;
  const pin = getS('occasions.forceTheme', '') || '';
  const def = getS('defaultTheme', 'clay');
  const name = k => (THEME_LIST.find(t => t[0] === k) || [k, k])[1];
  note.hidden = !pin;
  if (!pin) return;
  note.innerHTML = pin === def
    ? `<b>${name(pin)}</b> is pinned, so occasions will not change the look.
       <button class="ad-btn ad-btn--ghost ad-btn--sm" id="btnUnpin">Unpin it</button>`
    : `The shop is showing <b>${name(pin)}</b>, not ${name(def)} — ${name(pin)} is pinned
       below and a pin beats the default and every occasion.
       <button class="ad-btn ad-btn--ghost ad-btn--sm" id="btnUnpin">Unpin it</button>
       <button class="ad-btn ad-btn--ghost ad-btn--sm" id="btnPinDef">Pin ${name(def)} instead</button>`;
}

/* getS hands back whichever of the two it finds first, which is right
   for a single value and wrong for a whole block: a draft that has
   changed only hero.animation would hide hero.art. This merges them. */
function getM(path, fallback) {
  const dig = (root) => { let n = root; for (const p of path.split('.')) { if (n == null) return undefined; n = n[p]; } return n; };
  const base = dig(CFG), mine = dig(patch.settings);
  const merge = (a, b) => {
    if (b === undefined) return a;
    if (b === null || typeof b !== 'object' || Array.isArray(b)) return b;
    const out = (a && typeof a === 'object' && !Array.isArray(a)) ? { ...a } : {};
    for (const k of Object.keys(b)) out[k] = merge(out[k], b[k]);
    return out;
  };
  const v = merge(base, mine);
  return v === undefined || v === null ? fallback : v;
}

function occPatch(id) {
  let p = patch.occasions.find(o => o.id === id);
  if (!p) { p = { id }; patch.occasions.push(p); }
  return p;
}
/* an occasion as it will actually run, defaults + patch */
function occView(occ) {
  const p = patch.occasions.find(o => o.id === occ.id) || {};
  return {
    ...occ, ...p,
    banner: { ...occ.banner, ...(p.banner || {}) },
    when: occ.when.type === 'set'
      ? { ...occ.when, dates: { ...(occ.when.dates || {}), ...(p.dates || {}) } }
      : occ.when,
  };
}
const merged = () => OCCS.map(occView);

/* ---- today ------------------------------------------------ */
const fmt = d => d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/* the next time this occasion will actually run, or null if it
   cannot run because nobody has given it a date yet */
function nextRun(o, now = new Date()) {
  const y = now.getFullYear();
  for (const yy of [y - 1, y, y + 1, y + 2]) {
    const w = window.OCC.windowIn(o, yy);
    if (w && w.to >= now) return w;
  }
  return null;
}
const stuck = o => o.when.type === 'set' && !nextRun(o);
const themePill = t => `<span class="ad-pill ad-pill--${t}">${t === 'future' ? 'futuristic' : t}</span>`;
window.THEME_LIST = THEME_LIST;

function paintToday() {
  const list = merged();
  const auto = getS('occasions.auto', true);
  const force = getS('occasions.forceOccasion', null);
  const forceT = getS('occasions.forceTheme', null);

  let live = null;
  if (force) live = list.find(o => o.id === force);
  else if (auto) live = window.OCC.active(new Date(), list);

  $('#liveNow').innerHTML = live
    ? `Live now: <b>${live.name}</b>`
    : `Live now: <b>no occasion</b>`;

  $('#nowBox').innerHTML = live
    ? `<div class="ad-list">
         <div><b>Occasion</b><span>${live.name}${force ? ' (forced on)' : ''}</span></div>
         <div><b>Look</b><span>${themePill(forceT || live.theme)}${forceT ? ' pinned' : ''}</span></div>
         <div><b>Banner</b><span>${live.banner.title || ''}</span></div>
         <div><b>Featuring</b><span>products tagged <code>${live.tag}</code></span></div>
         ${live.window ? `<div><b>Runs</b><span>${fmt(live.window.from)} to ${fmt(live.window.to)}</span></div>` : ''}
       </div>`
    : `<p class="ad-empty">No occasion is running, so the shop wears
        ${themePill(forceT || getS('defaultTheme', 'clay'))}${auto ? '' : ' (occasions are switched off)'}.</p>`;

  const next = window.OCC.upcoming(new Date(), 6, list.filter(o => o.on));
  window.ADMINW?.dash();
  $('#nextBox').innerHTML = next.length
    ? `<div class="ad-list">${next.map(n => `<div>
        <b>${n.occ.name}</b><span>${fmt(n.on)} · opens ${fmt(n.from)} ${themePill(n.occ.theme)}</span></div>`).join('')}</div>`
    : `<p class="ad-empty">Nothing scheduled. Switch occasions on, and give the moon-following
        festivals their dates.</p>`;

  const missing = list.filter(o => o.on && stuck(o));
  $('#missingBox').hidden = !missing.length;
  $('#dotToday').hidden = !missing.length;   /* nudge on the sidebar */
  $('#missingBox').innerHTML = missing.length
    ? `<h3>${missing.length} switched-on festival${missing.length > 1 ? 's need' : ' needs'} a date</h3>
       <p class="ad-p">These follow the moon, so the date moves every year. They stay switched off
       until you set one — better than the shop re-skinning itself on the wrong week.
       Open <b>Occasions</b> and fill in the date.</p>
       <div class="ad-list">${missing.map(o => `<div><b>${o.name}</b>
         <span>no date set for ${YEAR} or later</span></div>`).join('')}</div>`
    : '';
}

/* ---- occasions list --------------------------------------- */
function paintOccasions(filter = '') {
  const f = filter.trim().toLowerCase();
  const list = merged().filter(o => !f || o.name.toLowerCase().includes(f));
  const liveNow = window.OCC.active(new Date(), merged());

  $('#occList').innerHTML = list.map(o => {
    const need = stuck(o);
    const isLive = liveNow && liveNow.id === o.id;
    const w = nextRun(o);
    const when = need ? 'no date set yet'
      : o.when.type === 'range' ? `${o.when.from} to ${o.when.to}, every year`
      : o.when.type === 'set' ? `next on ${fmt(w.on)}`
      : w ? `next on ${fmt(w.on)} — works out every year` : '';

    return `<div class="ad-o${o.on ? ' on' : ''}${isLive ? ' live' : ''}" data-id="${o.id}">
      <div class="ad-o__bar">
        <input type="checkbox" data-on ${o.on ? 'checked' : ''} aria-label="Switch ${o.name} on">
        <span class="ad-o__name">${o.name}</span>
        ${isLive ? '<span class="ad-pill ad-pill--live">live now</span>' : ''}
        ${need ? '<span class="ad-pill ad-pill--need">needs a date</span>' : ''}
        ${themePill(o.theme)}
        <span class="ad-o__when">${when}</span>
        <button class="ad-o__more" data-more>Edit</button>
      </div>
      <div class="ad-o__body">
        ${o.when.type === 'set' ? `<div>
          <span class="ad-hint">This one follows the moon, so the date moves. Set it for each year you want it to run.</span>
          <div class="ad-dates" style="margin-top:.4rem">
            ${[YEAR, YEAR + 1, YEAR + 2].map(y => `<label class="ad-field" style="margin:0">
              <span>${y}</span>
              <input type="date" data-date="${y}" value="${(o.when.dates || {})[y] || ''}">
            </label>`).join('')}
          </div></div>` : ''}
        <div class="ad-grid3">
          <label class="ad-field" style="margin:0"><span>Look</span>
            <select data-theme>
              ${THEME_LIST.map(([k, n]) => `<option value="${k}"${o.theme === k ? ' selected' : ''}>${n}</option>`).join('')}
            </select></label>
          <label class="ad-field" style="margin:0"><span>Opens days before</span>
            <input type="number" min="0" max="120" data-lead value="${o.lead ?? 0}"></label>
          <label class="ad-field" style="margin:0"><span>Closes days after</span>
            <input type="number" min="0" max="60" data-trail value="${o.trail ?? 0}"></label>
        </div>
        <label class="ad-field" style="margin:0"><span>Features products tagged</span>
          <input type="text" data-tag value="${o.tag || ''}" placeholder="festival, gift, puja…"></label>
        <div class="ad-grid3">
          <label class="ad-field" style="margin:0"><span>Banner eyebrow</span>
            <input type="text" data-b="eyebrow" value="${(o.banner.eyebrow || '').replace(/"/g, '&quot;')}"></label>
          <label class="ad-field" style="margin:0"><span>Banner headline</span>
            <input type="text" data-b="title" value="${(o.banner.title || '').replace(/"/g, '&quot;')}"></label>
        </div>
        <label class="ad-field" style="margin:0"><span>Banner line</span>
          <textarea rows="2" data-b="note">${o.banner.note || ''}</textarea></label>
      </div>
    </div>`;
  }).join('') || '<p class="ad-empty">Nothing matches that.</p>';
}

/* ---- the other panes -------------------------------------- */
function paintSettings() {
  $('#occAuto').checked       = getS('occasions.auto', true);
  $('#defaultTheme').value    = getS('defaultTheme', 'clay');
  $('#forceTheme').value      = getS('occasions.forceTheme', '') || '';
  paintPin();
  $('#engActive').checked     = getS('engineering.active', true);
  $('#engOwnLook').checked    = getS('engineering.ownLook', false);
  $('#engName').value         = getS('engineering.name', '');
  $('#engBlurb').value        = getS('engineering.blurb', '');
  $('#waNumber').value        = getS('whatsapp.number', '');
  $('#email').value           = getS('brand.email', '');
  $('#instagram').value       = getS('brand.instagram', '');
  $('#origin').value          = getS('brand.origin', '');
  $('#rzpKey').value          = getS('razorpay.keyId', '');
  $('#shipFlat').value        = getS('shipping.flat', 0);
  $('#shipFree').value        = getS('shipping.freeAbove', 0);

  $('#forceOccasion').innerHTML = '<option value="">No — follow the calendar</option>' +
    merged().map(o => `<option value="${o.id}">${o.name}</option>`).join('');
  $('#forceOccasion').value = getS('occasions.forceOccasion', '') || '';

  const M = [['rbOn','marketing.ribbon.on',1],['rbText','marketing.ribbon.text'],
             ['rbCta','marketing.ribbon.cta'],['rbHref','marketing.ribbon.href'],
             ['rbX','marketing.ribbon.dismissible',1],
             ['wcOn','marketing.welcome.on',1],['wcEyebrow','marketing.welcome.eyebrow'],
             ['wcDelay','marketing.welcome.delay'],['wcArt','marketing.welcome.art'],
             ['wcTitle','marketing.welcome.title'],['wcBody','marketing.welcome.body'],
             ['wcCode','marketing.welcome.code'],['wcCta','marketing.welcome.cta'],
             ['wcHref','marketing.welcome.href'],['wcSmall','marketing.welcome.small'],
             ['gaOn','analytics.on',1],['gaId','analytics.ga4'],
             ['lgEntity','legal.entity'],['lgAddress','legal.address'],['lgGst','legal.gst'],
             ['lgEmail','legal.email'],['lgPhone','legal.phone'],['lgJur','legal.jurisdiction'],
             ['lgDispatch','legal.dispatchDays'],['lgDelivery','legal.deliveryDays'],
             ['lgCancel','legal.cancelHours'],['lgReturn','legal.returnDays'],
             ['lgRefund','legal.refundDays'],['lgPublished','legal.published',1],
             ['seoTitle','seo.title'],['seoDesc','seo.description'],
             ['seoKeys','seo.keywords'],['seoOg','seo.ogImage']];
  const art = $('#wcArt');
  if (art && !art.options.length) {
    art.innerHTML = Object.keys(window.ART || {}).map(k => `<option>${k}</option>`).join('');
  }
  M.forEach(([id, path, bool]) => {
    const el = $('#' + id); if (!el) return;
    const v = getS(path, bool ? false : '');
    if (bool) el.checked = !!v; else el.value = v ?? '';
  });
  window.__MARKETING_MAP = M;

  const tiers = getS('bulk.tiers', CFG.bulk.tiers);
  $('#tiers').innerHTML = tiers.map((t, i) => `<div class="ad-tier">
      <label><span>From</span><input type="number" min="1" data-t="${i}" data-k="min" value="${t.min}"></label>
      <label><span>To (blank = no limit)</span><input type="number" min="1" data-t="${i}" data-k="max" value="${t.max ?? ''}"></label>
      <label><span>% off</span><input type="number" min="0" max="90" data-t="${i}" data-k="off" value="${t.off}"></label>
    </div>`).join('');
}

function paintLegal() {
  const box = $('#legalMissing'); if (!box) return;
  /* LEGAL reads window.JOYSHINE, so mirror the unsaved edits into it first */
  const l = window.JOYSHINE.legal || (window.JOYSHINE.legal = {});
  ['entity','address','jurisdiction'].forEach(k => { l[k] = getS('legal.' + k, ''); });
  const gaps = window.LEGAL.missing();
  box.hidden = !gaps.length;
  box.innerHTML = gaps.length
    ? `<h3>${gaps.length} thing${gaps.length > 1 ? 's' : ''} still needed</h3>
       <p class="ad-p">The policy pages exist but stay hidden from customers until you add
       ${gaps.map(g => `<b>${g}</b>`).join(', ')}. Only you know these, so nothing has been
       filled in on your behalf.</p>` : '';
  const dot = $('#dotLegal'); if (dot) dot.hidden = !gaps.length;
}

function paintJson() { $('#jsonOut').textContent = JSON.stringify(build(), null, 2); }

/* ---- output ------------------------------------------------ */
function build() {
  const out = { generated: new Date().toISOString(), settings: {}, occasions: [] };
  out.settings = JSON.parse(JSON.stringify(patch.settings || {}));
  out.occasions = (patch.occasions || []).filter(p => Object.keys(p).length > 1);
  return out;
}

function download() {
  const blob = new Blob([JSON.stringify(build(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'site.json';
  a.click(); URL.revokeObjectURL(a.href);
  dirty = false; $('#unsaved').hidden = true;
  toast('site.json downloaded — commit it to assets/data/');
}

/* ---- wiring ------------------------------------------------ */
function paintAll() { paintToday(); paintOccasions($('#occFilter').value); paintSettings(); paintLegal(); paintJson(); paintCloud(); }

/* ---- Supabase ------------------------------------------- */
const cloudOn = () => window.CLOUD && window.CLOUD.ready();

/* What "publishing" means right now depends on whether the database
   is connected and whether you are signed in. Say the true one. */
function paintHow(cloud, signedIn) {
  const note = $('#unsaved');
  if (note) {
    note.innerHTML = cloud && signedIn
      ? 'You have unsaved changes. Press <b>Publish</b> and they are live on joyshine.in within seconds.'
      : cloud
        ? 'You have unsaved changes. <b>Sign in above</b> to publish them straight to the live shop.'
        : 'You have unsaved changes. <b>Save changes</b> downloads <code>site.json</code> \u2014 put it in ' +
          '<code>assets/data/</code> in your repository and the live site picks it up.';
  }

  const how = $('#publishHow');
  if (!how) return;
  how.innerHTML = cloud && signedIn
    ? `<ol class="ad-steps">
         <li><b>Preview on site</b> shows your changes in this browser only. Nobody else sees them.</li>
         <li><b>Publish</b> writes them to the live shop. No file, no upload, no waiting.</li>
         <li>Refresh joyshine.in to see them. Customers get them on their next visit.</li>
       </ol>
       <p class="ad-p" style="margin:.9rem 0 0">Downloading <code>site.json</code> below is optional now.
         It is worth doing occasionally so your settings have a version history in GitHub, and a working
         copy if you ever lose the database.</p>`
    : cloud
      ? `<p class="ad-p">Sign in at the top and <b>Publish</b> sends changes straight to the live shop.
           Until then you can still download <code>site.json</code> and commit it by hand.</p>`
      : `<ol class="ad-steps">
           <li><b>Preview on site</b> shows your changes in this browser only.</li>
           <li><b>Save changes</b> downloads <code>site.json</code>.</li>
           <li>Drop that file into <code>assets/data/</code> in your GitHub repository
               (Add file \u2192 Upload files \u2192 Commit). GitHub Pages redeploys in about a minute.</li>
         </ol>`;
}

function paintCloud() {
  const badge = $('#cloudBadge'), wrap = $('#signinWrap'), state = $('#cloudState');
  const pub = $('#btnPublish'), out = $('#btnSignout'), main = $('#btnSave');
  const now = $('#btnPublishNow');

  if (!cloudOn()) {
    paintHow(false, false);
    badge.hidden = true; wrap.hidden = true; pub.hidden = true; out.hidden = true;
    if (now) now.hidden = true;
    main.textContent = 'Save changes';
    state.textContent = 'Supabase is not set up, so changes are published by downloading site.json and committing it. Fill in the supabase block in config.js to save straight to the live shop instead.';
    return;
  }

  const inn = window.CLOUD.signedIn();
  paintHow(true, inn);
  badge.hidden = false;
  badge.innerHTML = inn ? `Signed in as <b>${esc(window.CLOUD.user()?.email || '')}</b>` : 'Not signed in';
  wrap.hidden = inn;
  pub.hidden = !inn;
  if (now) now.hidden = !inn;
  out.hidden = !inn;
  main.textContent = inn ? 'Publish' : 'Save changes';
  state.textContent = inn
    ? 'Connected. Publishing writes straight to the live shop — no file to commit.'
    : 'Sign in above to publish. Until then you can still download site.json.';
}

const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/* Publishing is a two-step now: look at the shop wearing the changes,
   then confirm from there. The shop tab reads both of these out of this
   browser's own storage, and does the writing itself. */
const REVIEW = 'joyshine.review';

/* ---- 1. Cancel: show what would be lost, then lose it ------ */
function discardAll() {
  const changes = changeList();
  if (!changes.length && at === 0) { toast('Nothing to cancel'); return; }
  modal({
    title: 'Cancel these changes?',
    lead: 'Everything below goes back to what the live shop is wearing. The live shop itself is not touched, and this cannot be undone.',
    changes,
    go: 'Cancel these changes',
    warn: true,
    onGo: box => {
      box.remove();
      patch = live ? JSON.parse(JSON.stringify({ settings: live.settings || {}, occasions: live.occasions || [] }))
                   : { settings: {}, occasions: [] };
      past.length = 0; past.push(JSON.stringify(patch)); at = 0;
      dirty = false; saved = false;
      try { localStorage.setItem(DRAFT, JSON.stringify(patch)); localStorage.removeItem(PREVIEW); localStorage.removeItem(REVIEW); } catch {}
      $('#unsaved').hidden = true;
      paintAll(); paintHistory();
      toast(live ? 'Back to what is on the live shop' : 'Back to the built-in defaults');
    },
  });
}

/* ---- 2. Save and preview ---------------------------------- */
function saveAndPreview() {
  if (!dirty) { toast('Nothing has changed yet'); return; }
  save();
  try { localStorage.setItem(PREVIEW, JSON.stringify(build())); } catch {
    toast('This browser will not let the panel store a preview'); return;
  }
  saved = true;
  paintHistory();
  const w = window.open('index.html?preview=1', '_blank', 'noopener');
  toast(w ? 'Saved. The shop is open in a new tab wearing your changes.'
          : 'Saved. Allow pop-ups to see the preview — Publish is open either way.');
}

function reviewFirst() {
  const changes = changeList();
  if (!changes.length) { toast('Nothing has changed yet'); return; }
  try {
    localStorage.setItem(PREVIEW, JSON.stringify(build()));
    localStorage.setItem(REVIEW, JSON.stringify({ at: Date.now(), changes, data: build() }));
  } catch { toast('This browser will not let the panel store the preview'); return; }
  const w = window.open('index.html?review=1', '_blank', 'noopener');
  if (!w) { confirmHere(changes); return; }
  toast('Opened the shop with your changes — confirm there');
  paintCloud();
}

/* ---- a dialog, used by cancel and by publish --------------- */
function modal({ title, lead, changes = [], go, warn, onGo, wide }) {
  const rows = changes.map(c => c.occasion
    ? `<li><b>${esc(c.label)}</b><span>${esc(c.to)}</span></li>`
    : `<li><b>${esc(c.label)}</b><span><i>${esc(c.from)}</i> → <em>${esc(c.to)}</em></span></li>`).join('');
  const box = document.createElement('div');
  box.className = 'ad-modal';
  box.innerHTML = `
    <div class="ad-modal__card${wide ? ' ad-modal__card--wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <h3>${esc(title)}</h3>
      <p class="ad-p">${esc(lead)}</p>
      ${rows ? `<ul class="ad-modal__list">${rows}</ul>` : ''}
      <div class="ad-modal__body"></div>
      <div class="ad-btns" style="justify-content:flex-end;margin:0">
        <button class="ad-btn ad-btn--ghost" data-m="close">Not yet</button>
        <button class="ad-btn ${warn ? 'ad-btn--warn' : 'ad-btn--primary'}" data-m="go">${esc(go)}</button>
      </div>
    </div>`;
  document.body.appendChild(box);
  box.addEventListener('click', e => {
    if (e.target === box || e.target.closest('[data-m="close"]')) return box.remove();
    if (e.target.closest('[data-m="go"]')) onGo(box);
  });
  return box;
}

/* ---- 3. Publish, one step at a time ------------------------
   Every step says what it is doing and what happened. If one
   fails, the reason is on screen and the way out — commit the
   same settings through GitHub — is one click away.            */
const STEPS = [
  ['sign',   'Checking you are still signed in'],
  ['send',   'Sending the settings to the database'],
  ['read',   'Reading them back to be sure'],
  ['match',  'Checking the live shop agrees'],
  ['done',   'Clearing the preview'],
];

function publishFlow() {
  const changes = changeList();
  if (!changes.length) { toast('Nothing has changed since the last publish'); return; }
  modal({
    title: 'Publish these changes?',
    lead: 'Everything below goes to the live shop at once. Nothing else is touched.',
    changes, go: 'Publish to the live shop', wide: true,
    onGo: box => runPublish(box),
  });
}

async function runPublish(box) {
  const body = box.querySelector('.ad-modal__body');
  const acts = box.querySelector('.ad-btns');
  acts.hidden = true;
  body.innerHTML = `<ol class="ad-steps">${STEPS.map(([k, t]) =>
    `<li data-s="${k}"><span class="ad-steps__dot"></span><b>${esc(t)}</b><i></i></li>`).join('')}</ol>`;

  const step = (k, state, note) => {
    const li = body.querySelector(`[data-s="${k}"]`);
    if (!li) return;
    li.dataset.state = state;
    if (note !== undefined) li.querySelector('i').textContent = note;
  };
  const fail = (k, msg, detail) => {
    step(k, 'bad', msg);
    body.insertAdjacentHTML('beforeend', `
      <div class="ad-fail">
        <b>That did not go through.</b>
        <p>${esc(detail || msg)}</p>
        <div class="ad-btns" style="margin:0">
          <button class="ad-btn ad-btn--primary" data-f="retry">Try again</button>
          <button class="ad-btn ad-btn--ghost" data-f="file">Download site.json</button>
          <a class="ad-btn ad-btn--ghost" href="https://github.com/rajuvegeshana/Joyshine/upload/main/assets/data"
             target="_blank" rel="noopener">Put it live through GitHub</a>
          <button class="ad-btn ad-btn--ghost" data-f="close">Close</button>
        </div>
        <p class="ad-hint">Through GitHub: download the file, drop it into
          <code>assets/data/</code> on that page, and press Commit changes. The shop reads it within
          about ten minutes, and the database stays as it was.</p>
      </div>`);
    body.addEventListener('click', e => {
      const f = e.target.closest('[data-f]')?.dataset.f;
      if (f === 'retry') { box.remove(); publishFlow(); }
      if (f === 'file') download();
      if (f === 'close') box.remove();
    }, { once: true });
  };

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const data = build();

  /* 1. still signed in? */
  step('sign', 'busy');
  try {
    if (!window.CLOUD.signedIn()) {
      const ok = await window.CLOUD.refresh();
      if (!ok) throw new Error('Your sign-in has expired. Sign in again on the Publish tab and try once more.');
    }
    step('sign', 'ok', window.CLOUD.user()?.email || '');
  } catch (e) { return fail('sign', 'Not signed in', e.message); }
  await wait(120);

  /* 2. write */
  step('send', 'busy');
  try {
    await window.CLOUD.write(data);
    const n = changeList().length;
    step('send', 'ok', n + (n === 1 ? ' change sent' : ' changes sent'));
  } catch (e) {
    return fail('send', 'The database refused it', e.message +
      ' — this is usually the sign-in having expired, or the settings table not being set up yet.');
  }
  await wait(120);

  /* 3. read it back */
  step('read', 'busy');
  let back = null;
  try {
    back = await window.CLOUD.read();
    if (!back || !back.data) throw new Error('The database accepted it but gave nothing back.');
    step('read', 'ok', 'saved ' + new Date(back.updated_at || Date.now()).toLocaleTimeString());
  } catch (e) { return fail('read', 'Could not confirm it saved', e.message); }
  await wait(120);

  /* 4. is it the same thing? */
  step('match', 'busy');
  try {
    if (!same(data.settings || {}, back.data.settings || {}))
      throw new Error('What came back does not match what was sent. Try publishing again.');
    step('match', 'ok', 'every change is live');
  } catch (e) { return fail('match', 'The shop does not agree yet', e.message); }
  await wait(120);

  /* 5. tidy up */
  step('done', 'busy');
  live = data;
  dirty = false; saved = false;
  $('#unsaved').hidden = true;
  try { localStorage.removeItem(PREVIEW); localStorage.removeItem(REVIEW); } catch {}
  past.length = 0; past.push(JSON.stringify(patch)); at = 0;
  paintHistory(); paintCloud();
  step('done', 'ok', 'preview cleared');

  body.insertAdjacentHTML('beforeend', `
    <div class="ad-win">
      <b>Live on joyshine.in.</b>
      <p class="ad-hint">Anyone who had the shop open already will see it next time they load the page.</p>
      <div class="ad-btns" style="margin:0">
        <a class="ad-btn ad-btn--primary" href="index.html" target="_blank" rel="noopener">Open the shop</a>
        <button class="ad-btn ad-btn--ghost" data-f="close">Close</button>
      </div>
    </div>`);
  body.addEventListener('click', e => { if (e.target.closest('[data-f="close"]')) box.remove(); });
  toast('Published — the live shop is updated');
}

/* The same confirmation, inside the panel, for when the browser
   will not open the review tab. */
function confirmHere(changes) {
  const rows = changes.map(c => c.occasion
    ? `<li><b>${esc(c.label)}</b><span>${esc(c.to)}</span></li>`
    : `<li><b>${esc(c.label)}</b><span><i>${esc(c.from)}</i> → <em>${esc(c.to)}</em></span></li>`).join('');
  const box = document.createElement('div');
  box.className = 'ad-modal';
  box.innerHTML = `
    <div class="ad-modal__card" role="dialog" aria-modal="true" aria-label="Changes about to be published">
      <h3>Publish these changes?</h3>
      <p class="ad-p">Your browser would not open the review tab, so here is the list.
        Everything below goes to the live shop at once.</p>
      <ul class="ad-modal__list">${rows}</ul>
      <div class="ad-btns" style="justify-content:flex-end;margin:0">
        <button class="ad-btn ad-btn--ghost" data-m="close">Not yet</button>
        <button class="ad-btn ad-btn--primary" data-m="go">Publish to the live shop</button>
      </div>
    </div>`;
  document.body.appendChild(box);
  box.addEventListener('click', async e => {
    if (e.target === box || e.target.closest('[data-m="close"]')) return box.remove();
    if (!e.target.closest('[data-m="go"]')) return;
    box.remove();
    await publish();
  });
}

/* Spell out what is waiting, in the owner's words rather than in
   JSON, so the confirmation is something a person can actually read. */
const LABELS = {
  'defaultTheme': 'Default look',
  'occasions.forceTheme': 'Pinned look',
  'occasions.forceOccasion': 'Pinned occasion',
  'occasions.auto': 'Let occasions change the look',
  'engineering.active': 'Engineering page on',
  'engineering.ownLook': 'Engineering keeps its own look',
  'engineering.name': 'Engineering name',
  'engineering.blurb': 'Engineering description',
  'whatsapp.number': 'WhatsApp number',
  'brand.email': 'Email address',
  'brand.instagram': 'Instagram',
  'brand.origin': 'Line under the logo',
  'razorpay.keyId': 'Razorpay Key ID',
  'shipping.flat': 'Shipping charge',
  'shipping.freeAbove': 'Free shipping above',
  'marketing.ribbon.on': 'Top ribbon',
  'marketing.ribbon.text': 'Ribbon wording',
  'marketing.welcome.on': 'Welcome popup',
  'lineup.picks': 'Everyday product line-up',
  'lineup.only': 'Show only the chosen products',
  'legal.entity': 'Registered name',
  'legal.address': 'Business address',
  'legal.jurisdiction': 'Jurisdiction',
  'legal.published': 'Policy pages live',
  'legal.refundDays': 'Return window (days)',
  'marketing.welcome.on': 'Welcome popup',
  'marketing.welcome.title': 'Welcome popup headline',
  'marketing.welcome.body': 'Welcome popup wording',
  'marketing.welcome.code': 'Welcome popup code',
  'marketing.welcome.art': 'Welcome popup picture',
  'marketing.ribbon.link': 'Ribbon link',
  'seo.title': 'Page title',
  'seo.description': 'Search description',
  'seo.keywords': 'Search keywords',
  'analytics.on': 'Analytics',
  'errors.notFound.title': 'Missing page headline',
  'errors.notFound.body': 'Missing page wording',
  'errors.noProduct.title': 'Missing product headline',
  'errors.noProduct.body': 'Missing product wording',
  'hero.animation': 'Hero animation',
};

const pretty = v => v === true ? 'on' : v === false ? 'off'
  : v === null || v === undefined || v === '' ? 'not set'
  : Array.isArray(v) ? `${v.length} item${v.length === 1 ? '' : 's'}`
  : typeof v === 'string' && v.length > 60 ? v.slice(0, 57) + '…'
  : String(v);

/* The settings that repeat per theme or per icon cannot be listed one by
   one, so turn the path itself into something readable. */
const WORD = {
  hero: 'Hero', icons: 'Icon', cursors: 'Pointer', fonts: 'Type', weights: 'weight',
  animation: 'animation', art: 'artwork', kind: 'style', url: 'picture', size: 'size',
  micro: 'small movements', display: 'headings face', body: 'body face',
  hotX: 'tip across', hotY: 'tip down', useForBody: 'used for body text',
  all: 'every look', logo: 'Logo', favicon: 'Tab icon', ogImage: 'Share picture',
  picks: 'line-up', only: 'only those products',
};
function humanPath(p) {
  const parts = p.split('.');
  const named = parts.map(x => WORD[x] || (window.THEME_LIST || []).reduce((a, t) => t[0] === x ? t[1] : a, x));
  const head = named.shift();
  return named.length ? `${head} · ${named.join(' · ')}` : head;
}

function changeList() {
  const out = [];
  const walk = (node, path) => {
    for (const k of Object.keys(node || {})) {
      const p = path ? path + '.' + k : k;
      const v = node[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) { walk(v, p); continue; }
      /* compare against the live shop when we know it, the built-in
         defaults when we do not */
      let was = live && live.settings ? live.settings : undefined;
      if (was !== undefined) { for (const seg of p.split('.')) { if (was == null) break; was = was[seg]; } }
      if (was === undefined || was === null) {
        let base = CFG;
        for (const seg of p.split('.')) { if (base == null) break; base = base[seg]; }
        if (was === undefined) was = base;
      }
      const label = LABELS[p] || humanPath(p);
      out.push({ label, from: pretty(was), to: pretty(v), same: pretty(was) === pretty(v) });
    }
  };
  walk(patch.settings, '');

  const liveOcc = (live && live.occasions) || [];
  for (const o of patch.occasions || []) {
    if (Object.keys(o).length < 2) continue;
    /* unchanged since the last publish? then it is not waiting */
    const before = liveOcc.find(x => x.id === o.id);
    if (before && same(before, o)) continue;
    const occ = OCCS.find(x => x.id === o.id);
    const bits = [];
    if (o.on !== undefined) bits.push(o.on ? 'switched on' : 'switched off');
    if (o.theme) bits.push('look: ' + (THEME_LIST.find(t => t[0] === o.theme) || [, o.theme])[1]);
    if (o.picks) bits.push(`${o.picks.length} product${o.picks.length === 1 ? '' : 's'} in its line-up`);
    if (o.picksOnly !== undefined) bits.push(o.picksOnly ? 'only those products' : 'those products first');
    if (o.dates) bits.push('dates set for ' + Object.keys(o.dates).join(', '));
    if (o.banner) bits.push('banner wording');
    if (o.tag !== undefined) bits.push('featured tag');
    if (o.lead !== undefined || o.trail !== undefined) bits.push('how long it runs');
    out.push({ label: (occ ? occ.name : o.id), from: '', to: bits.join(', ') || 'edited', occasion: true });
  }
  return out.filter(c => !c.same);
}

async function publish() {
  try {
    await window.CLOUD.write(build());
    dirty = false; $('#unsaved').hidden = true;
    toast('Published — the live shop is updated');
    paintCloud();
  } catch (e) {
    toast(e.message || 'Could not publish');
    paintCloud();
  }
}

/* pull whatever is live so you are editing the real thing */
/* what the live shop is wearing right now, so "what is waiting"
   means waiting since the last publish — not since the code was written */
let live = null;

/* Postgres stores jsonb with its own key order, so two identical
   settings objects do not stringify the same way. Sort before comparing. */
function stable(v) {
  if (Array.isArray(v)) return v.map(stable);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = stable(v[k]);
    return out;
  }
  return v;
}
const same = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));

async function pullCloud() {
  if (!cloudOn()) return;
  try {
    const row = await window.CLOUD.read();
    if (row?.data) {
      live = row.data;
      /* the panel loads the published settings into its own buffer, which
         used to look like a pile of unsaved changes for ever. If nothing
         differs from the live shop, nothing is waiting. */
      const unchanged = same(patch.settings || {}, live.settings || {})
        && same((patch.occasions || []).filter(o => Object.keys(o).length > 1), live.occasions || []);
      if (unchanged) {
        dirty = false; saved = false;
        $('#unsaved').hidden = true;
        past.length = 0; past.push(JSON.stringify(patch)); at = 0;
        paintHistory();
      }
    }
    const hasLocal = Object.keys(patch.settings).length || patch.occasions.length;
    if (row?.data && !hasLocal) {
      patch = { settings: row.data.settings || {}, occasions: row.data.occasions || [] };
      save(); paintAll();
    }
  } catch { /* offline is fine, the defaults still load */ }
}

document.addEventListener('click', e => {
  /* the catalogue, orders, requests, reviews and offers panes handle
     their own buttons; if one of them took the click we are done */
  if (window.ADMINX?.wire(e.target)) return;
  if (window.ADMINC?.wire(e.target)) return;
  if (window.ADMINW?.wire(e.target)) return;

  const tab = e.target.closest('.ad-tab');
  if (tab) {
    const want = tab.dataset.tab;
    /* the sidebar and the mobile bar hold the same tabs, so match on
       the name rather than the element and both stay in step */
    $$('.ad-tab').forEach(t => t.classList.toggle('on', t.dataset.tab === want));
    $$('.ad-pane').forEach(p => p.classList.toggle('on', p.dataset.pane === want));
    const titles = { today: 'Dashboard', occasions: 'Occasions', look: 'Look', content: 'Content & art', products: 'Products',
                     inventory: 'Filament', billing: 'Billing', expenses: 'Money out',
                     orders: 'Orders', requests: 'Customer requests', reviews: 'Reviews',
                     marketing: 'Marketing', traffic: 'Traffic & SEO', legal: 'Policies',
                     shop: 'Shop & contact', publish: 'Publish' };
    $('#paneTitle').textContent = titles[want] || 'Control panel';
    scrollTo({ top: 0, behavior: 'instant' });
    paintAll();
    window.ADMINX?.paint(want);
    if (want === 'content') window.ADMINC?.paint();
    window.ADMINW?.paint(want);
    return;
  }
  const more = e.target.closest('[data-more]');
  if (more) {
    const row = more.closest('.ad-o');
    row.classList.toggle('open');
    more.textContent = row.classList.contains('open') ? 'Done' : 'Edit';
    return;
  }
  if (e.target.closest('#btnPublish')) return reviewFirst();
  if (e.target.closest('#btnSavePrev')) return saveAndPreview();
  if (e.target.closest('#btnSave')) {
    return (cloudOn() && window.CLOUD.signedIn()) ? publishFlow() : download();
  }
  if (e.target.closest('#btnUndo')) return step(-1);
  if (e.target.closest('#btnRedo')) return step(1);
  if (e.target.closest('#btnDiscard')) return discardAll();
  if (e.target.closest('#btnPublishNow')) return publish();
  if (e.target.closest('#btnSave2')) return download();
  const eye = e.target.closest('[data-eye]');
  if (eye) {
    const f = $('#' + eye.dataset.eye);
    const show = f.type === 'password';
    f.type = show ? 'text' : 'password';
    eye.textContent = show ? 'Hide' : 'Show';
    eye.setAttribute('aria-label', (show ? 'Hide' : 'Show') + ' password');
    f.focus();
    return;
  }

  if (e.target.closest('#btnForgot')) {
    const email = $('#suEmail').value.trim();
    const err = $('#suErr');
    if (!email) {
      err.textContent = 'Type your email above first, then press this.';
      err.hidden = false; $('#suEmail').focus(); return;
    }
    err.hidden = true;
    window.CLOUD.sendRecovery(email, location.href.split('#')[0])
      .then(() => {
        err.className = 'ad-ok'; err.hidden = false;
        err.textContent = 'Sent. Open the link in that email on this device. Check spam — it comes from Supabase.';
      })
      .catch(ex => {
        err.className = 'ad-err'; err.hidden = false;
        err.textContent = ex.message + (/rate|limit/i.test(ex.message)
          ? ' Supabase only allows a couple of these an hour on the free plan.' : '');
      });
    return;
  }

  if (e.target.closest('#btnSql')) {
    const box = $('#sqlOut');
    box.innerHTML = '<p class="ad-p">Looking…</p>';
    const base = (CFG.supabase.url || '').replace(/\/+$/, '');
    const key = CFG.supabase.anonKey;
    const probe = async (label, path, hint) => {
      try {
        const r = await fetch(`${base}/rest/v1/${path}`, { headers: { apikey: key, Authorization: 'Bearer ' + key } });
        /* 200 and 401 both mean the thing exists; 404 means it does not */
        return { label, ok: r.status !== 404, hint };
      } catch { return { label, ok: false, hint }; }
    };
    Promise.all([
      probe('settings', 'settings?select=id&limit=1', 'schema.sql'),
      probe('products', 'products?select=id&limit=1', 'schema-2-catalogue.sql'),
      probe('offers', 'offers?select=code&limit=1', 'schema-3-media-reviews.sql'),
      probe('product_sales', 'product_sales?select=product_id&limit=1', 'schema-5-reviews-sales.sql'),
      probe('reviews.pinned', 'reviews?select=pinned&limit=1', 'schema-5-reviews-sales.sql'),
    ]).then(async rows => {
      /* A bucket cannot be listed by a stranger, and should not be, so
         asking for a file that does not exist is the honest test: a
         missing bucket says so by name, a present one says the file is
         missing instead. */
      let up = false;
      try {
        const r = await fetch(`${base}/storage/v1/object/public/customer-uploads/__does-not-exist__`);
        const t = await r.text();
        up = !/NoSuchBucket|Bucket not found/i.test(t);
      } catch {}
      rows.push({ label: 'customer-uploads bucket', ok: up, hint: 'schema-4-uploads.sql' });
      box.innerHTML = rows.map(r => `<div class="ad-chk${r.ok ? '' : ' danger'}">
        <b>${r.ok ? '✓' : '—'}</b><span>${esc(r.label)}</span>
        <i>${r.ok ? 'in place' : 'run ' + esc(r.hint)}</i></div>`).join('');
    });
    return;
  }
  if (e.target.closest('#btnCheck')) {
    const box = $('#checkOut');
    box.innerHTML = '<p class="ad-p">Checking…</p>';
    window.CLOUD.diagnose().then(rows => {
      box.innerHTML = rows.map(r => {
        const cls = r.ok === true ? 'ok' : r.ok === false ? 'bad' : 'skip';
        const mark = r.ok === true ? '\u2713' : r.ok === false ? '\u2717' : '\u2013';
        return `<div class="ad-chk ${cls}${r.danger ? ' danger' : ''}">
          <b>${mark}</b><span>${esc(r.label)}<i>${esc(r.detail || '')}</i></span></div>`;
      }).join('');
    });
    return;
  }
  if (e.target.closest('#btnSignout')) {
    window.CLOUD.signOut(); paintCloud(); toast('Signed out');
    return;
  }
  if (e.target.closest('#btnUnpin')) {
    setS('occasions.forceTheme', null);
    $('#forceTheme').value = ''; paintPin(); paintToday();
    toast('Unpinned. Publish to put it live.');
    return;
  }
  if (e.target.closest('#btnPinDef')) {
    const def = getS('defaultTheme', 'clay');
    setS('occasions.forceTheme', def);
    $('#forceTheme').value = def; paintPin(); paintToday();
    toast('Pinned. Publish to put it live.');
    return;
  }
  if (e.target.closest('#btnLoad')) return $('#fileIn').click();

  if (e.target.closest('#btnPreview')) {
    try { localStorage.setItem(PREVIEW, JSON.stringify(build())); } catch {}
    toast('Preview on. Open the site in this browser to see it.');
    window.open('index.html', '_blank', 'noopener');
    return;
  }
  if (e.target.closest('#btnClearPreview')) {
    try { localStorage.removeItem(PREVIEW); } catch {}
    toast('Preview cleared. The site shows what is published.');
    return;
  }
  if (e.target.closest('#btnReset')) {
    if (!confirm('Throw away every change in this panel and go back to the built-in defaults?\n\nThis does not touch anything already published.')) return;
    patch = { settings: {}, occasions: [] };
    try { localStorage.removeItem(DRAFT); localStorage.removeItem(PREVIEW); } catch {}
    dirty = false; $('#unsaved').hidden = true;
    paintAll(); toast('Back to defaults');
    return;
  }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (window.ADMINX?.wireChange(t)) return;

  /* occasion rows */
  const row = t.closest('.ad-o');
  if (row) {
    const p = occPatch(row.dataset.id);
    if (t.matches('[data-on]'))     p.on = t.checked;
    if (t.matches('[data-theme]'))  p.theme = t.value;
    if (t.matches('[data-lead]'))   p.lead = +t.value;
    if (t.matches('[data-trail]'))  p.trail = +t.value;
    if (t.matches('[data-tag]'))    p.tag = t.value.trim();
    if (t.matches('[data-b]'))    { p.banner = p.banner || {}; p.banner[t.dataset.b] = t.value; }
    if (t.matches('[data-date]'))  {
      p.dates = p.dates || {};
      if (t.value) p.dates[t.dataset.date] = t.value; else delete p.dates[t.dataset.date];
    }
    mark();
    const wasOpen = row.classList.contains('open');
    paintOccasions($('#occFilter').value);
    if (wasOpen) {
      const again = $(`.ad-o[data-id="${row.dataset.id}"]`);
      again?.classList.add('open');
      const b = again?.querySelector('[data-more]'); if (b) b.textContent = 'Done';
    }
    paintToday();
    return;
  }

  /* bulk tiers */
  if (t.matches('[data-t]')) {
    const tiers = JSON.parse(JSON.stringify(getS('bulk.tiers', CFG.bulk.tiers)));
    const row = tiers[+t.dataset.t];
    const k = t.dataset.k;
    row[k] = k === 'max' ? (t.value === '' ? null : +t.value) : +t.value;
    setS('bulk.tiers', tiers);
    return;
  }

  if (window.ADMINC?.wireChange(t)) return;
  if (window.ADMINW?.wireChange(t)) return;

  const mm = (window.__MARKETING_MAP || []).find(([id]) => id === t.id);
  if (mm) {
    setS(mm[1], mm[2] ? t.checked : (t.type === 'number' ? +t.value : t.value));
    if (mm[1].startsWith('legal.')) paintLegal();   /* the gaps list has to keep up */
    return;
  }

  const map = {
    occAuto:      () => setS('occasions.auto', t.checked),
    defaultTheme: () => { setS('defaultTheme', t.value); paintPin(); },
    forceTheme:   () => { setS('occasions.forceTheme', t.value || null); paintPin(); },
    forceOccasion:() => setS('occasions.forceOccasion', t.value || null),
    engActive:    () => setS('engineering.active', t.checked),
    engOwnLook:   () => setS('engineering.ownLook', t.checked),
    engName:      () => setS('engineering.name', t.value),
    engBlurb:     () => setS('engineering.blurb', t.value),
    waNumber:     () => setS('whatsapp.number', t.value.replace(/\D/g, '')),
    email:        () => setS('brand.email', t.value),
    instagram:    () => setS('brand.instagram', t.value),
    origin:       () => setS('brand.origin', t.value),
    rzpKey:       () => setS('razorpay.keyId', t.value.trim()),
    shipFlat:     () => setS('shipping.flat', +t.value),
    shipFree:     () => setS('shipping.freeAbove', +t.value),
  };
  if (map[t.id]) { map[t.id](); paintToday(); if (t.id === 'waNumber') $('#waNumber').value = t.value.replace(/\D/g, ''); }
});

addEventListener('keydown', e => {
  const mod = e.metaKey || e.ctrlKey;
  if (!mod || e.key.toLowerCase() !== 'z') return;
  const el = document.activeElement;
  /* let a text field have its own undo first */
  if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName) && el.value !== '') return;
  e.preventDefault();
  step(e.shiftKey ? 1 : -1);
});

$('#occFilter').addEventListener('input', e => paintOccasions(e.target.value));

$('#resetForm').addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('#rsErr'); err.className = 'ad-err'; err.hidden = true;
  const a = $('#rsPass').value, b = $('#rsPass2').value;
  if (a.length < 8)  { err.textContent = 'Use at least 8 characters.'; err.hidden = false; return; }
  if (a !== b)       { err.textContent = 'Those two do not match.'; err.hidden = false; return; }
  try {
    await window.CLOUD.setPassword(a);
    $('#resetWrap').hidden = true;
    $('#rsPass').value = $('#rsPass2').value = '';
    paintCloud(); await pullCloud(); paintAll();
    toast('Password changed, and you are signed in');
  } catch (ex) { err.textContent = ex.message; err.hidden = false; }
});

$('#signinForm').addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('#suErr'); err.hidden = true;
  try {
    await window.CLOUD.signIn($('#suEmail').value.trim(), $('#suPass').value);
    $('#suPass').value = '';
    paintCloud(); await pullCloud(); paintAll();
    await window.ADMINX?.pull();
    window.ADMINX?.paint($$('.ad-tab.on')[0]?.dataset.tab);
    toast('Signed in');
  } catch (ex) {
    err.textContent = ex.message; err.hidden = false;
  }
});

$('#fileIn').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    patch = { settings: data.settings || {}, occasions: data.occasions || [] };
    save(); paintAll(); toast('Loaded ' + f.name);
  } catch { toast('That file could not be read as site.json'); }
  e.target.value = '';
});

addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

/* arriving from a password reset email? */
if (cloudOn()) {
  const rec = window.CLOUD.recoveryInUrl();
  if (rec?.ok) {
    $('#resetWrap').hidden = false;
    $('#signinWrap').hidden = true;
    setTimeout(() => $('#rsPass').focus(), 200);
  } else if (rec?.error) {
    const err = $('#suErr');
    err.className = 'ad-err'; err.hidden = false;
    err.textContent = rec.error + ' — send yourself a fresh link.';
  }
}

/* the catalogue tab edits the line-up, which lives in the settings
   patch rather than in the database. Hand it the keys, not the buffer. */
window.ADMIN = {
  getS, setS, getM,
  occPatch, occView,
  mark: () => mark(),
  themeName: k => (THEME_LIST.find(t => t[0] === k) || [k, k])[1],
  occasions: () => OCCS.map(o => ({ id: o.id, name: o.name, theme: occView(o).theme, on: occView(o).on })),
  repaint: paintAll,
};

window.ADMINX?.setToast(toast);
window.ADMINC?.setToast(toast);
window.ADMINW?.setToast(toast);
paintAll();
if (Object.keys(patch.settings).length || patch.occasions.length) { $('#unsaved').hidden = false; dirty = true; }
paintHistory();
if (cloudOn() && window.CLOUD.signedIn()) window.CLOUD.refresh().then(() => { paintCloud(); pullCloud(); });
else pullCloud();
})();
