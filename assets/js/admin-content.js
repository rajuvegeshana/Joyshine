/* ===========================================================
   CONTENT & ART — the panel's side of assets/js/skin.js.

   The hero's animation and artwork, the icon library, the type
   for each theme, and the wording on the pages people land on
   when something is missing.

   Uploads go to your own Supabase storage. Anything that looks
   like markup is cleaned of scripts before it is stored, and
   again before the shop draws it.
   =========================================================== */
window.ADMINC = (() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
let toast = () => {};

const A = () => window.ADMIN;
const CFG = () => window.JOYSHINE;

/* Everything on this tab has to read through the panel's own buffer,
   not through the published settings: an edit that has not been
   published yet must still show here, or the tab argues with itself. */
const S = (path, fallback) => (A() ? A().getM(path, fallback) : fallback);

/* the icons worth letting someone rebrand, and what they are for */
const ICONS = [
  ['bolt',   'Buy now'],
  ['wa',     'WhatsApp'],
  ['cart',   'Cart'],
  ['share',  'Share'],
  ['heart',  'Wishlist'],
  ['search', 'Search'],
  ['chat',   'Ask / message'],
  ['up',     'Upload'],
  ['file',   'File'],
  ['link',   'Link'],
  ['spark',  'Custom print accent'],
  ['check',  'Done'],
];

/* the four things that can actually go wrong on a site with no server */
const ERRS = [
  ['notFound', '404 — a page that does not exist',
   'Someone follows an old link or mistypes the address. Used by joyshine.in/404.html and by the shop itself.', '#/gone'],
  ['noProduct', 'A product that has gone',
   'The link is fine but the product was retired or sold out. Four that are in stock are shown underneath.', '#/p/does-not-exist'],
  ['noResults', 'A search that found nothing',
   'Their words matched nothing on the shelf. The four ways to ask for a custom print are shown underneath.', '#/search?q=zzzzzz'],
  ['offline', 'The database cannot be reached',
   'Rare. The shop keeps working from the files it was built with; this only warns that prices and stock may be a few minutes behind.', ''],
];

const HERO = [
  ['print',     'Printing',   'It builds up off the bed, layer by layer. The original.'],
  ['float',     'Floating',   'It hangs in the air and breathes, shadow moving underneath.'],
  ['turntable', 'Turntable',  'A slow display-stand turn, left and right.'],
  ['assemble',  'Assembling', 'The parts arrive, settle, and do it again.'],
];

function paint() {
  const box = $('#pane-content');
  if (!box) return;
  const hero = S('hero', {}) || {};
  const errs = S('errors', {}) || {};
  const icons = S('icons', {}) || {};
  const fonts = S('fonts', {}) || {};
  const themes = window.THEME_LIST || [];

  box.innerHTML = `
    <div class="ad-head"><div><h2>Content &amp; art</h2>
      <p>The pictures, the icons, the type and the wording people meet when something is missing.</p></div></div>

    <div class="ad-card">
      <h3>The hero</h3>
      <p class="ad-p">How the unicorn on the homepage behaves.</p>
      <div class="ad-picks">
        ${HERO.map(([k, name, note]) => `
          <button class="ad-pick${(hero.animation || 'print') === k ? ' on' : ''}" data-c="anim" data-v="${k}">
            <b>${name}</b><span>${note}</span></button>`).join('')}
      </div>

      <h4 class="ad-sub">Its artwork</h4>
      <p class="ad-p">Leave this empty for the drawn unicorn, which recolours itself with every theme.
        Upload your own and it is used as it is: <b>SVG</b> keeps its edges at any size, <b>PNG</b> and
        <b>GIF</b> are used as they come, and a <b>.json</b> from After Effects or LottieFiles plays as an
        animation. The player for those is only fetched when something actually uses one.</p>
      <div class="ad-up" data-drop="hero">
        <input type="file" id="heroFile" accept=".svg,.png,.gif,.webp,.json,image/svg+xml,image/png,image/gif,image/webp,application/json" hidden>
        <button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="heropick">Upload SVG or PNG</button>
        <span class="ad-hint" id="heroMsg">or drop one here, or paste a link below</span>
      </div>
      <input class="ad-inline" id="heroArt" value="${esc(hero.art || '')}" placeholder="https://… (empty = the drawn unicorn)">
      ${hero.art ? `<div class="ad-prev">${window.SKIN.pictureHtml(hero.art, '')}
        <button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="heroclear">Use the drawn one again</button></div>` : ''}
    </div>

    <div class="ad-card">
      <h3>Icon library</h3>
      <p class="ad-p">Replace any of these with your own — SVG, PNG, GIF, or a .json animation. SVG is best:
        it takes the colour of whatever it sits in. Scripts inside an uploaded file are stripped before it is
        saved. Every icon already answers a touch or a hover on its own; see below.</p>

      <label class="ad-row--switch" style="margin-bottom:var(--space-4)">
        <input type="checkbox" id="icoMicro"${S('icons.micro', true) !== false ? ' checked' : ''}>
        <span><b>Small movements on the icons</b><i>A cart that tips, a heart that beats, a share that
          lifts, a bolt that flickers — only on hover or a press, and never for anyone who has asked
          their device for less motion.</i></span>
      </label>
      <div class="ad-icons">
        ${ICONS.map(([k, label]) => {
          const own = icons[k];
          const shown = own ? window.SKIN.pictureHtml(own, '') : ((window.ICONS || {})[k] || '');
          return `<div class="ad-icon${own ? ' on' : ''}" data-ik="${k}">
            <span class="ad-icon__art">${shown || ''}</span>
            <b>${esc(label)}</b>
            <button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="iconpick" data-k="${k}">${own ? 'Replace' : 'Upload'}</button>
            ${own ? `<button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="iconclear" data-k="${k}">Reset</button>` : ''}
          </div>`;
        }).join('')}
      </div>
      <input type="file" id="iconFile" accept=".svg,.png,.gif,.json,image/svg+xml,image/png,image/gif,application/json" hidden>
    </div>

    <details class="ad-card ad-fold" open>
      <summary><h3>Typography</h3><span class="ad-fold__n">faces and weights</span></summary>

      <p class="ad-p">Two faces do the whole site: one for headings, one for everything else.
        Set them once here and every look uses them, or give a single look its own pair.
        The weights below are separate from the faces — they apply everywhere.</p>

      <label class="ad-field" style="max-width:24rem"><span>Setting type for</span>
        <select id="fontTheme">
          <option value="all">Every look — the site-wide pair</option>
          ${themes.map(([k, n]) => `<option value="${k}">Only the ${esc(n)} look</option>`).join('')}
        </select>
      </label>
      <div id="fontBox"></div>
      <input type="file" id="fontFile" accept=".woff2,.woff,.ttf,.otf" hidden>
    </details>

    <details class="ad-card ad-fold">
      <summary><h3>Logo, tab icon and share picture</h3><span class="ad-fold__n">how the shop is recognised</span></summary>
      <div class="ad-grid3">
        ${[['logo', 'Logo', 'brand.logo', 'Sits beside the word joyshine, in the header and the footer. A square SVG or PNG.'],
           ['favicon', 'Tab icon', 'brand.favicon', 'The little picture in the browser tab. 32×32 or an SVG.'],
           ['ogImage', 'Share picture', 'seo.ogImage', 'What WhatsApp and Facebook show when the link is shared. 1200×630.']]
          .map(([k, label, path, note]) => {
          const v = S(path, '') || '';
          return `<div class="ad-brandbit">
            <b>${label}</b>
            <div class="ad-brandbit__art">${v ? window.SKIN.pictureHtml(v, '') : '<span class="ad-empty">none yet</span>'}</div>
            <button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="brandpick" data-k="${k}" data-path="${path}">Upload</button>
            ${v ? `<button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="brandclear" data-path="${path}">Remove</button>` : ''}
            <input class="ad-inline" data-cf="${path}" value="${esc(v)}" placeholder="or paste a link">
            <i class="ad-hint">${note}</i>
          </div>`;
        }).join('')}
      </div>
      <input type="file" id="brandFile" accept=".svg,.png,.gif,.webp,.jpg,.jpeg,.json,image/svg+xml,image/png,image/gif,image/webp,image/jpeg,application/json" hidden>
    </details>

    <details class="ad-card ad-fold">
      <summary><h3>The mouse pointer</h3><span class="ad-fold__n">per look, if you want</span></summary>
      <p class="ad-p">Most of the time the ordinary arrow is the right answer — people know what it means.
        If a look calls for something else, set it here.</p>
      <label class="ad-field" style="max-width:24rem"><span>Setting the pointer for</span>
        <select id="curTheme">
          <option value="all">Every look</option>
          ${themes.map(([k, n]) => `<option value="${k}">Only the ${esc(n)} look</option>`).join('')}
        </select>
      </label>
      <div id="curBox"></div>
      <input type="file" id="curFile" accept=".png,.svg,.gif,.json,image/png,image/svg+xml,image/gif,application/json" hidden>
    </details>

    <details class="ad-card ad-fold" id="errCard">
      <summary><h3>Error pages</h3><span class="ad-fold__n">404 and the others</span></summary>
      <p class="ad-p">This shop is a set of files on a CDN — there is no server to fall over, so there is no
        500, 502 or 503 to write. What can actually happen is a dead link, a product that has gone, a search
        that finds nothing, and the database being briefly out of reach. Each of these pages also offers the
        shop, the custom-print form, the FAQ, every category and a WhatsApp message already written.</p>
      ${ERRS.map(([k, label, note, link]) => {
        const e = errs[k] || {};
        return `<div class="ad-err-edit">
          <div class="ad-err-edit__top">
            <h4 class="ad-sub" style="margin:0">${esc(label)}</h4>
            ${link ? `<a class="ad-btn ad-btn--ghost ad-btn--sm" href="index.html${esc(link)}" target="_blank" rel="noopener">See it</a>` : ''}
          </div>
          <p class="ad-p">${esc(note)}</p>
          <label class="ad-field"><span>Headline</span><input data-cf="errors.${k}.title" value="${esc(e.title || '')}"></label>
          <label class="ad-field"><span>Wording</span><textarea data-cf="errors.${k}.body" rows="2">${esc(e.body || '')}</textarea></label>
          <label class="ad-field"><span>Picture (optional)</span><input data-cf="errors.${k}.art" value="${esc(e.art || '')}" placeholder="empty = the drawn unicorn">
            <i class="ad-hint">Paste a link, or upload one above and paste the link it gives you.</i></label>
        </div>`;
      }).join('')}
    </details>`;

  paintFonts();
  paintCursor();
  wireFiles();
  window.SKIN.playAll(box);
}

function paintFonts() {
  const box = $('#fontBox'); if (!box) return;
  const t = $('#fontTheme').value;
  const all = S('fonts', {}) || {};
  const f = all[t] || {};
  const base = t === 'all' ? {} : (all.all || {});
  const w = f.weights || {};
  const bw = base.weights || {};
  const row = (k, label, note) => `
    <label class="ad-field"><span>${label}</span>
      <input type="number" min="100" max="900" step="50" data-fw="${k}" value="${esc(w[k] ?? '')}"
             placeholder="${bw[k] ? bw[k] + ' (from every look)' : 'as the theme has it'}">
      <i class="ad-hint">${note}</i></label>`;

  box.innerHTML = `
    <div class="ad-grid2">
      <label class="ad-field"><span>Headings face</span>
        <input data-ff="display" value="${esc(f.display || '')}" placeholder="${esc(base.display || 'e.g. Fraunces')}">
        <i class="ad-hint">Used by every heading, the logo and the buttons.</i></label>
      <label class="ad-field"><span>Body face</span>
        <input data-ff="body" value="${esc(f.body || '')}" placeholder="${esc(base.body || 'e.g. Nunito')}">
        <i class="ad-hint">Everything else: paragraphs, labels, prices, small print.</i></label>
    </div>

    <div class="ad-up" data-drop="font">
      <button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="fontpick">Upload a font file</button>
      <span class="ad-hint" id="fontMsg">${f.url ? 'Using an uploaded file' : '.woff2 is the one to use — a tenth the weight of a .ttf'}</span>
    </div>
    ${f.url ? `<div class="ad-brandbit__row">
      <label class="ad-chk"><input type="checkbox" data-ff="useForBody"${f.useForBody ? ' checked' : ''}>
        <i>Use the uploaded file for body text too</i></label>
      <button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="fontclear">Remove the file</button>
    </div>` : ''}

    <details class="ad-sub-fold" open>
      <summary>Weights</summary>
      <p class="ad-p">Leave any of these empty and it follows the one above it. 400 is normal,
        500 is a little firmer, 700 is bold, 800 and 900 are heavy.</p>
      <div class="ad-grid3">
        ${row('h1', 'Page heading', 'The big line at the top of a page.')}
        ${row('h2', 'Section heading', 'Above each band of the page.')}
        ${row('h3', 'Card heading', 'Product names, FAQ questions.')}
        ${row('h4', 'Small heading', 'Inside cards and panels.')}
        ${row('lede', 'Opening line', 'The larger sentence under a heading.')}
        ${row('body', 'Body text', 'Paragraphs and labels.')}
        ${row('small', 'Small print', 'Hints, captions, breadcrumbs.')}
        ${row('btn', 'Buttons', 'Buy now, WhatsApp, Add to cart.')}
      </div>
    </details>

    <div class="ad-typeprev" style="${f.url ? `font-family:'joyshine-${esc(t)}'` : ''}">
      <b style="font-weight:${w.h1 || bw.h1 || 700}">Small things. Big joy.</b>
      <p style="font-weight:${w.body || bw.body || 400}">Made to order in India, printed one at a time.</p>
      <span style="font-weight:${w.small || bw.small || 400}">Free shipping over ₹999 · 2–4 days to dispatch</span>
    </div>`;
}

function paintCursor() {
  const box = $('#curBox'); if (!box) return;
  const t = $('#curTheme').value;
  const c = S('cursors.' + t, {}) || {};
  const kinds = [
    ['default',   'The ordinary arrow',   'What every visitor expects. The safe answer.'],
    ['pointer',   'Always the hand',      'Playful, but people may think everything is clickable.'],
    ['crosshair', 'Crosshair',            'Technical. Suits the futuristic look.'],
    ['grab',      'Open hand',            'Suits something soft and toylike.'],
    ['image',     'Your own picture',     'A PNG, an SVG, or a .json animation. See the note below.'],
  ];
  const url = c.url || '';
  const kind = url && /\.json($|\?)/i.test(url) ? 'lottie'
             : url && /\.svg($|\?)/i.test(url) ? 'svg'
             : url ? 'png' : '';

  box.innerHTML = `
    <div class="ad-picks">
      ${kinds.map(([k, name, note]) => `
        <button class="ad-pick${(c.kind || 'default') === k ? ' on' : ''}" data-c="cur" data-v="${k}">
          <b>${name}</b><span>${note}</span></button>`).join('')}
    </div>

    ${c.kind === 'image' ? `
      <div class="ad-up" data-drop="cur" style="margin-top:.9rem">
        <button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="curpick">Upload SVG, PNG, GIF or .json</button>
        <span class="ad-hint" id="curMsg">${url ? 'In use' : 'Small and simple reads best — 32 to 48px'}</span>
        ${url ? `<span class="ad-curprev" style="--s:${+c.size || (kind === 'lottie' ? 48 : 40)}px">${
          window.SKIN.pictureHtml(url, '')}</span>` : ''}
        ${url ? `<button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="curclear">Remove</button>` : ''}
      </div>

      ${url ? `<div class="ad-grid2" style="margin-top:.9rem">
        <label class="ad-field"><span>Size on screen</span>
          <input type="range" min="20" max="96" step="4" data-cz value="${+c.size || (kind === 'lottie' ? 48 : 40)}">
          <i class="ad-hint"><b data-czn>${+c.size || (kind === 'lottie' ? 48 : 40)}</b> px across</i></label>
        ${kind === 'png' ? `<div class="ad-grid2">
          <label class="ad-field"><span>Tip across</span>
            <input type="number" min="0" max="64" data-ch="hotX" value="${c.hotX ?? 6}"></label>
          <label class="ad-field"><span>Tip down</span>
            <input type="number" min="0" max="64" data-ch="hotY" value="${c.hotY ?? 4}"></label>
        </div>` : ''}
      </div>` : ''}

      <p class="ad-note" style="margin-top:.9rem">
        ${kind === 'png'
          ? '<b>A PNG becomes a real cursor.</b> The browser draws it, so it never lags and the tip is wherever you say it is. Keep it under 64px — bigger and some browsers quietly ignore it.'
          : kind === 'svg'
          ? '<b>An SVG cannot be a real cursor.</b> Chrome needs it to carry its own width and height, and Safari refuses altogether — so the arrow is hidden and this follows the pointer instead.'
          : kind === 'lottie'
          ? '<b>An animation can never be a real cursor.</b> The arrow is hidden and this plays on the pointer instead.'
          : 'A PNG becomes a real cursor. An SVG or a .json animation cannot be one, so the arrow is hidden and yours follows the pointer instead.'}
        ${kind === 'svg' || kind === 'lottie'
          ? ' It runs on a mouse only, never on a phone and never for anyone who has asked their device for less motion. The ordinary arrow comes back over anything they type into, and the moment the pointer leaves the window.'
          : ''}
      </p>` : ''}`;
}

/* ---- uploads ---------------------------------------------- */
let pendingIcon = '';
let pendingPath = '';

function wireFiles() {
  const once = (el, fn) => { if (el && !el.dataset.wired) { el.dataset.wired = '1'; el.addEventListener('change', fn); } };
  once($('#heroFile'), async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const url = await put(f, $('#heroMsg'));
    if (url) { A().setS('hero.art', url); paint(); toast('Hero artwork set'); }
  });
  once($('#iconFile'), async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f || !pendingIcon) return;
    if (/svg/i.test(f.type) || /\.svg$/i.test(f.name)) {
      const text = await f.text();
      const clean = window.SKIN.cleanSvg(text);
      if (!clean) { toast('That SVG could not be read'); return; }
      A().setS('icons.' + pendingIcon, clean);
    } else {
      const url = await put(f);
      if (!url) return;
      A().setS('icons.' + pendingIcon, url);
    }
    paint(); toast('Icon replaced');
  });
  once($('#brandFile'), async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f || !pendingPath) return;
    const url = await put(f);
    if (!url) return;
    A().setS(pendingPath, url);
    if (pendingPath === 'brand.favicon' || pendingPath === 'brand.logo') window.SKIN.brand();
    paint(); toast('Uploaded');
  });
  once($('#curFile'), async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (f.size > 512 * 1024) { toast('Keep a pointer under 512 KB — it is drawn on every frame'); return; }
    const url = await put(f, $('#curMsg'));
    if (!url) return;
    const t = $('#curTheme').value;
    A().setS('cursors.' + t + '.kind', 'image');
    A().setS('cursors.' + t + '.url', url);
    if (!S('cursors.' + t + '.size', 0)) A().setS('cursors.' + t + '.size', /\.json($|\?)/i.test(url) ? 48 : 40);
    paint(); $('#curTheme').value = t; paintCursor(); window.SKIN.cursors();
    toast('Pointer set');
  });
  once($('#fontFile'), async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const url = await put(f, $('#fontMsg'));
    if (!url) return;
    const t = $('#fontTheme').value;
    A().setS('fonts.' + t + '.url', url);
    paint(); $('#fontTheme').value = t; paintFonts();
    window.SKIN.fonts();
    toast('Font uploaded');
  });

  $$('[data-drop]').forEach(d => {
    if (d.dataset.wired) return;
    d.dataset.wired = '1';
    ['dragenter', 'dragover'].forEach(n => d.addEventListener(n, e => { e.preventDefault(); d.classList.add('on'); }));
    ['dragleave', 'drop'].forEach(n => d.addEventListener(n, e => { e.preventDefault(); d.classList.remove('on'); }));
    d.addEventListener('drop', async e => {
      const f = e.dataTransfer?.files?.[0]; if (!f) return;
      if (d.dataset.drop === 'hero') {
        const url = await put(f, $('#heroMsg'));
        if (url) { A().setS('hero.art', url); paint(); }
      } else {
        const url = await put(f, $('#fontMsg'));
        if (url) { A().setS('fonts.' + $('#fontTheme').value + '.url', url); paint(); window.SKIN.fonts(); }
      }
    });
  });
}

async function put(file, msg) {
  if (msg) msg.textContent = 'Uploading ' + file.name + '…';
  try {
    const url = await window.CLOUD.uploadImage(file);
    if (msg) msg.textContent = 'Uploaded.';
    return url;
  } catch (e) {
    if (msg) msg.textContent = e.message;
    toast(e.message);
    return '';
  }
}

/* ---- events ------------------------------------------------ */
function wire(t) {
  const el = t.closest('[data-c]');
  const act = el?.dataset.c;
  if (!act) return false;

  if (act === 'anim')      { A().setS('hero.animation', el.dataset.v); paint(); toast('Hero animation set'); return true; }
  if (act === 'heropick')  { $('#heroFile').click(); return true; }
  if (act === 'heroclear') { A().setS('hero.art', ''); paint(); toast('Back to the drawn unicorn'); return true; }
  if (act === 'iconpick')  { pendingIcon = el.dataset.k; $('#iconFile').click(); return true; }
  if (act === 'iconclear') { A().setS('icons.' + el.dataset.k, ''); paint(); toast('Icon reset'); return true; }
  if (act === 'fontpick')  { $('#fontFile').click(); return true; }
  if (act === 'brandpick') { pendingPath = el.dataset.path; $('#brandFile').click(); return true; }
  if (act === 'brandclear') {
    A().setS(el.dataset.path, '');
    paint(); toast('Removed'); return true;
  }
  if (act === 'cur') {
    const t = $('#curTheme').value;
    A().setS('cursors.' + t + '.kind', el.dataset.v);
    paint(); $('#curTheme').value = t; paintCursor(); window.SKIN.cursors();
    return true;
  }
  if (act === 'curpick') { $('#curFile').click(); return true; }
  if (act === 'curclear') {
    const t = $('#curTheme').value;
    A().setS('cursors.' + t + '.url', '');
    A().setS('cursors.' + t + '.kind', 'default');
    paint(); $('#curTheme').value = t; paintCursor(); window.SKIN.cursors();
    return true;
  }
  if (act === 'fontclear') {
    const th = $('#fontTheme').value;
    A().setS('fonts.' + th + '.url', '');
    paint(); $('#fontTheme').value = th; paintFonts(); window.SKIN.fonts();
    return true;
  }
  return false;
}

function wireChange(t) {
  if (t.id === 'icoMicro') { A().setS('icons.micro', t.checked); return true; }
  if (t.id === 'fontTheme') { paintFonts(); return true; }
  if (t.id === 'curTheme') { paintCursor(); return true; }
  if (t.dataset.cz !== undefined) {
    const th = $('#curTheme').value;
    A().setS('cursors.' + th + '.size', +t.value);
    const n = $('[data-czn]'); if (n) n.textContent = t.value;
    const prev = $('.ad-curprev'); if (prev) prev.style.setProperty('--s', t.value + 'px');
    window.SKIN.cursors();
    return true;
  }
  if (t.dataset.ch) {
    const th = $('#curTheme').value;
    A().setS('cursors.' + th + '.' + t.dataset.ch, +t.value);
    window.SKIN.cursors();
    return true;
  }
  if (t.dataset.fw) {
    const th = $('#fontTheme').value;
    A().setS('fonts.' + th + '.weights.' + t.dataset.fw, t.value ? +t.value : '');
    window.SKIN.fonts(); paintFonts();
    return true;
  }
  if (t.id === 'heroArt')   { A().setS('hero.art', t.value.trim()); return true; }
  if (t.dataset.ff) {
    const th = $('#fontTheme').value;
    const v = t.type === 'checkbox' ? t.checked : t.value.trim();
    A().setS('fonts.' + th + '.' + t.dataset.ff, v);
    window.SKIN.fonts();
    return true;
  }
  if (t.dataset.cf) { A().setS(t.dataset.cf, t.value); return true; }
  return false;
}

return { paint, wire, wireChange, setToast: fn => { toast = fn; } };
})();
