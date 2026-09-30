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
const PREVIEW = 'joyshine.preview';
const DRAFT = 'joyshine.admin.draft';

/* the edit buffer: only what differs from the defaults */
let patch = { settings: {}, occasions: [] };
try { patch = JSON.parse(localStorage.getItem(DRAFT)) || patch; } catch {}

let dirty = false;
const mark = () => { dirty = true; $('#unsaved').hidden = false; save(); paintJson(); };
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
              <option value="clay"${o.theme === 'clay' ? ' selected' : ''}>Clay</option>
              <option value="retro"${o.theme === 'retro' ? ' selected' : ''}>Retro</option>
              <option value="future"${o.theme === 'future' ? ' selected' : ''}>Futuristic</option>
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
  $('#engActive').checked     = getS('engineering.active', true);
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
function paintAll() { paintToday(); paintOccasions($('#occFilter').value); paintSettings(); paintJson(); paintCloud(); }

/* ---- Supabase ------------------------------------------- */
const cloudOn = () => window.CLOUD && window.CLOUD.ready();

function paintCloud() {
  const badge = $('#cloudBadge'), wrap = $('#signinWrap'), state = $('#cloudState');
  const pub = $('#btnPublish'), out = $('#btnSignout'), main = $('#btnSave');

  if (!cloudOn()) {
    badge.hidden = true; wrap.hidden = true; pub.hidden = true; out.hidden = true;
    main.textContent = 'Save changes';
    state.textContent = 'Supabase is not set up, so changes are published by downloading site.json and committing it. Fill in the supabase block in config.js to save straight to the live shop instead.';
    return;
  }

  const inn = window.CLOUD.signedIn();
  badge.hidden = false;
  badge.innerHTML = inn ? `Signed in as <b>${esc(window.CLOUD.user()?.email || '')}</b>` : 'Not signed in';
  wrap.hidden = inn;
  pub.hidden = !inn;
  out.hidden = !inn;
  main.textContent = inn ? 'Publish' : 'Save changes';
  state.textContent = inn
    ? 'Connected. Publishing writes straight to the live shop — no file to commit.'
    : 'Sign in above to publish. Until then you can still download site.json.';
}

const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

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
async function pullCloud() {
  if (!cloudOn()) return;
  try {
    const row = await window.CLOUD.read();
    const hasLocal = Object.keys(patch.settings).length || patch.occasions.length;
    if (row?.data && !hasLocal) {
      patch = { settings: row.data.settings || {}, occasions: row.data.occasions || [] };
      save(); paintAll();
    }
  } catch { /* offline is fine, the defaults still load */ }
}

document.addEventListener('click', e => {
  const tab = e.target.closest('.ad-tab');
  if (tab) {
    const want = tab.dataset.tab;
    /* the sidebar and the mobile bar hold the same tabs, so match on
       the name rather than the element and both stay in step */
    $$('.ad-tab').forEach(t => t.classList.toggle('on', t.dataset.tab === want));
    $$('.ad-pane').forEach(p => p.classList.toggle('on', p.dataset.pane === want));
    const titles = { today: 'Today', occasions: 'Occasions', look: 'Look', products: 'Products',
                     orders: 'Orders', requests: 'Customer requests', reviews: 'Reviews',
                     marketing: 'Marketing', shop: 'Shop & contact', publish: 'Publish' };
    $('#paneTitle').textContent = titles[want] || 'Control panel';
    scrollTo({ top: 0, behavior: 'instant' });
    paintAll();
    window.ADMINX?.paint(want);
    return;
  }
  const more = e.target.closest('[data-more]');
  if (more) {
    const row = more.closest('.ad-o');
    row.classList.toggle('open');
    more.textContent = row.classList.contains('open') ? 'Done' : 'Edit';
    return;
  }
  if (e.target.closest('#btnPublish')) return publish();
  if (e.target.closest('#btnSave')) {
    return (cloudOn() && window.CLOUD.signedIn()) ? publish() : download();
  }
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

  const mm = (window.__MARKETING_MAP || []).find(([id]) => id === t.id);
  if (mm) { setS(mm[1], mm[2] ? t.checked : (t.type === 'number' ? +t.value : t.value)); return; }

  const map = {
    occAuto:      () => setS('occasions.auto', t.checked),
    defaultTheme: () => setS('defaultTheme', t.value),
    forceTheme:   () => setS('occasions.forceTheme', t.value || null),
    forceOccasion:() => setS('occasions.forceOccasion', t.value || null),
    engActive:    () => setS('engineering.active', t.checked),
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

window.ADMINX?.setToast(toast);
paintAll();
if (Object.keys(patch.settings).length || patch.occasions.length) { $('#unsaved').hidden = false; dirty = true; }
if (cloudOn() && window.CLOUD.signedIn()) window.CLOUD.refresh().then(() => { paintCloud(); pullCloud(); });
else pullCloud();
})();
