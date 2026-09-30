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

const HERO = [
  ['print',     'Printing',   'It builds up off the bed, layer by layer. The original.'],
  ['float',     'Floating',   'It hangs in the air and breathes, shadow moving underneath.'],
  ['turntable', 'Turntable',  'A slow display-stand turn, left and right.'],
  ['assemble',  'Assembling', 'The parts arrive, settle, and do it again.'],
];

function paint() {
  const box = $('#pane-content');
  if (!box) return;
  const hero = CFG().hero || {};
  const errs = CFG().errors || {};
  const icons = CFG().icons || {};
  const fonts = CFG().fonts || {};
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
        Upload your own and it is used as it is — an SVG keeps its edges at any size.</p>
      <div class="ad-up" data-drop="hero">
        <input type="file" id="heroFile" accept=".svg,image/svg+xml,image/png,image/webp" hidden>
        <button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="heropick">Upload SVG or PNG</button>
        <span class="ad-hint" id="heroMsg">or drop one here, or paste a link below</span>
      </div>
      <input class="ad-inline" id="heroArt" value="${esc(hero.art || '')}" placeholder="https://… (empty = the drawn unicorn)">
      ${hero.art ? `<div class="ad-prev">${/^</.test(hero.art) ? hero.art : `<img src="${esc(hero.art)}" alt="">`}
        <button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="heroclear">Use the drawn one again</button></div>` : ''}
    </div>

    <div class="ad-card">
      <h3>Icon library</h3>
      <p class="ad-p">Replace any of these with your own. SVG is best: it takes the colour of whatever it sits in.
        Scripts inside an uploaded file are stripped before it is saved.</p>
      <div class="ad-icons">
        ${ICONS.map(([k, label]) => {
          const own = icons[k];
          const shown = own ? (/^</.test(own) ? own : `<img src="${esc(own)}" alt="">`) : ((window.ICONS || {})[k] || '');
          return `<div class="ad-icon${own ? ' on' : ''}" data-ik="${k}">
            <span class="ad-icon__art">${shown || ''}</span>
            <b>${esc(label)}</b>
            <button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="iconpick" data-k="${k}">${own ? 'Replace' : 'Upload'}</button>
            ${own ? `<button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="iconclear" data-k="${k}">Reset</button>` : ''}
          </div>`;
        }).join('')}
      </div>
      <input type="file" id="iconFile" accept=".svg,image/svg+xml,image/png" hidden>
    </div>

    <div class="ad-card">
      <h3>Type, theme by theme</h3>
      <p class="ad-p">Each look can have its own faces. Name any font already on the page, or upload a file —
        a .woff2 is a tenth the weight of a .ttf and every browser made since 2014 reads it.</p>
      <label class="ad-field" style="max-width:22rem"><span>Which look</span>
        <select id="fontTheme">${themes.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select>
      </label>
      <div id="fontBox"></div>
      <input type="file" id="fontFile" accept=".woff2,.woff,.ttf,.otf" hidden>
    </div>

    <div class="ad-card">
      <h3>When something is missing</h3>
      <p class="ad-p">What a visitor reads when a link is dead or a product has gone. Every one of these pages
        also offers the shop, the custom-print form, the FAQ, each category and a WhatsApp message.</p>
      ${[['notFound', 'A page that does not exist'], ['noProduct', 'A product that has gone'],
         ['offline', 'The shop cannot reach the database']].map(([k, label]) => {
        const e = errs[k] || {};
        return `<div class="ad-err-edit">
          <h4 class="ad-sub">${esc(label)}</h4>
          <label class="ad-field"><span>Headline</span><input data-cf="errors.${k}.title" value="${esc(e.title || '')}"></label>
          <label class="ad-field"><span>Wording</span><textarea data-cf="errors.${k}.body" rows="2">${esc(e.body || '')}</textarea></label>
          <label class="ad-field"><span>Picture (optional)</span><input data-cf="errors.${k}.art" value="${esc(e.art || '')}" placeholder="empty = the drawn unicorn"></label>
        </div>`;
      }).join('')}
    </div>`;

  paintFonts();
  wireFiles();
}

function paintFonts() {
  const box = $('#fontBox'); if (!box) return;
  const t = $('#fontTheme').value;
  const f = (CFG().fonts || {})[t] || {};
  box.innerHTML = `
    <div class="ad-grid3">
      <label class="ad-field"><span>Headings</span><input data-ff="display" value="${esc(f.display || '')}" placeholder="Fraunces"></label>
      <label class="ad-field"><span>Body</span><input data-ff="body" value="${esc(f.body || '')}" placeholder="Nunito"></label>
      <label class="ad-field"><span>Heading weight</span><input data-ff="weight" type="number" min="100" max="900" step="50" value="${esc(f.weight || '')}" placeholder="700"></label>
    </div>
    <div class="ad-up" data-drop="font">
      <button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="fontpick">Upload a font file</button>
      <span class="ad-hint" id="fontMsg">${f.url ? 'Using an uploaded file' : '.woff2, .woff, .ttf or .otf'}</span>
    </div>
    ${f.url ? `<div class="ad-row--switch" style="margin-top:.6rem">
      <label class="ad-chk"><input type="checkbox" data-ff="useForBody"${f.useForBody ? ' checked' : ''}>
        <i>Use the uploaded font for body text too</i></label>
      <button class="ad-btn ad-btn--ghost ad-btn--sm" data-c="fontclear">Remove it</button>
    </div>
    <p class="ad-hint" style="margin-top:.5rem">Preview: <span style="font-family:'joyshine-${esc(t)}'">Small things. Big joy.</span></p>` : ''}`;
}

/* ---- uploads ---------------------------------------------- */
let pendingIcon = '';

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
  if (act === 'fontclear') {
    const th = $('#fontTheme').value;
    A().setS('fonts.' + th + '.url', '');
    paint(); $('#fontTheme').value = th; paintFonts(); window.SKIN.fonts();
    return true;
  }
  return false;
}

function wireChange(t) {
  if (t.id === 'fontTheme') { paintFonts(); return true; }
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
