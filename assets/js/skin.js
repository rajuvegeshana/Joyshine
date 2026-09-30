/* ===========================================================
   SKIN — the parts of the look the owner can replace without
   touching code: the hero's animation and artwork, individual
   icons, and the typeface each theme uses.

   Everything here comes from the settings the panel publishes.
   Anything shaped like markup is cleaned before it is used: a
   file uploaded as an "icon" must not be able to run a script
   on a page where people type their address.
   =========================================================== */
window.SKIN = (() => {
'use strict';

const CFG = () => window.JOYSHINE;

/* ---- cleaning ---------------------------------------------
   Keeps drawing, drops behaviour: no script, no event handlers,
   no javascript: or data: urls, no foreignObject (which can hold
   arbitrary HTML), no <use href> pointing off-document.        */
function cleanSvg(markup) {
  if (typeof markup !== 'string') return '';
  let doc;
  try { doc = new DOMParser().parseFromString(markup, 'image/svg+xml'); } catch { return ''; }
  const svg = doc.querySelector('svg');
  if (!svg || doc.querySelector('parsererror')) return '';

  svg.querySelectorAll('script, foreignObject, iframe, object, embed, animate, set, handler').forEach(n => n.remove());
  svg.querySelectorAll('*').forEach(el => {
    for (const a of [...el.attributes]) {
      const n = a.name.toLowerCase();
      const v = (a.value || '').trim().toLowerCase();
      if (n.startsWith('on')) el.removeAttribute(a.name);
      else if ((n === 'href' || n === 'xlink:href' || n === 'src') && !v.startsWith('#')) el.removeAttribute(a.name);
      else if (v.includes('javascript:')) el.removeAttribute(a.name);
    }
  });
  if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', '0 0 24 24');
  svg.removeAttribute('width'); svg.removeAttribute('height');
  return svg.outerHTML;
}

const isUrl = s => typeof s === 'string' && /^(https?:\/\/|assets\/|\/)/i.test(s.trim());

/* an icon the owner has replaced, or nothing */
function icon(name) {
  const v = (CFG().icons || {})[name];
  if (!v) return '';
  if (isUrl(v)) return `<img src="${v.replace(/"/g, '&quot;')}" alt="" class="ico-img">`;
  return cleanSvg(v);
}

/* the hero's artwork, if one was uploaded */
function heroArt() {
  const a = (CFG().hero || {}).art;
  if (!a) return '';
  if (isUrl(a)) return `<img src="${a.replace(/"/g, '&quot;')}" alt="" class="printer__img">`;
  return cleanSvg(a);
}

/* ---- typefaces ---------------------------------------------
   One pair of faces for the whole site, or a different pair for
   a theme that wants one. Weights are separate: a heading, a
   sub-heading, body, small print and buttons can each have
   their own, and they apply everywhere unless a theme says
   otherwise. One <style> element holds the lot.               */
const WEIGHTS = [['h1', '--w-h1'], ['h2', '--w-h2'], ['h3', '--w-h3'], ['h4', '--w-h4'],
                 ['lede', '--w-lede'], ['body', '--body-weight'], ['small', '--w-small'],
                 ['btn', '--w-btn'], ['display', '--display-weight']];

function faceRules(f, family) {
  const rules = [];
  const stack = [];
  if (f.url) stack.push(`'${family}'`);
  if (f.display) stack.push(f.display.includes(',') ? f.display : `'${f.display}'`);
  const bodyStack = [];
  if (f.url && f.useForBody) bodyStack.push(`'${family}'`);
  if (f.body) bodyStack.push(f.body.includes(',') ? f.body : `'${f.body}'`);
  if (stack.length) rules.push(`--font-display:${stack.join(',')},serif`);
  if (bodyStack.length) rules.push(`--font-body:${bodyStack.join(',')},system-ui,sans-serif`);
  for (const [k, v] of WEIGHTS) {
    const w = f.weights && f.weights[k];
    if (w) rules.push(`${v}:${+w}`);
  }
  if (f.tracking) rules.push(`--display-tracking:${f.tracking}`);
  return rules;
}

function faceFace(f, family) {
  if (!f.url || !isUrl(f.url)) return '';
  const fmt = /\.otf($|\?)/i.test(f.url) ? 'opentype'
    : /\.ttf($|\?)/i.test(f.url) ? 'truetype'
    : /\.woff($|\?)/i.test(f.url) ? 'woff' : 'woff2';
  return `@font-face{font-family:'${family}';src:url('${f.url}') format('${fmt}');font-display:swap;font-weight:100 900;}\n`;
}

function fonts() {
  const all = CFG().fonts || {};
  let css = '';

  /* the pair that applies everywhere */
  const every = all.all;
  if (every) {
    css += faceFace(every, 'joyshine-all');
    const rules = faceRules(every, 'joyshine-all');
    if (rules.length) css += `:root{${rules.join(';')};}\n`;
  }

  /* and anything a theme overrides */
  for (const [theme, f] of Object.entries(all)) {
    if (!f || theme === 'all') continue;
    const family = `joyshine-${theme.replace(/[^a-z0-9]/gi, '')}`;
    css += faceFace(f, family);
    const rules = faceRules(f, family);
    if (rules.length) css += `:root[data-theme="${theme}"]{${rules.join(';')};}\n`;
  }

  let tag = document.getElementById('skinFonts');
  if (!css) { tag?.remove(); return; }
  if (!tag) { tag = document.createElement('style'); tag.id = 'skinFonts'; document.head.appendChild(tag); }
  tag.textContent = css;
}

/* ---- the mouse, per theme ----------------------------------
   A cursor is set on the body so it covers the whole page, and
   an uploaded one is capped at the size browsers accept (128px)
   by the upload itself, not by us hoping.                      */
function cursors() {
  const map = CFG().cursors || {};
  let css = '';
  const one = (sel, c) => {
    if (!c || c.kind === 'default') return '';
    if (c.kind === 'image' && isUrl(c.url)) return `${sel}, ${sel} * { cursor: url('${c.url}') 6 4, auto; }\n`;
    if (c.kind === 'pointer') return `${sel}, ${sel} * { cursor: pointer; }\n`;
    if (c.kind === 'crosshair') return `${sel} { cursor: crosshair; }\n`;
    if (c.kind === 'grab') return `${sel} { cursor: grab; }\n`;
    return '';
  };
  css += one('body', map.all);
  for (const [theme, c] of Object.entries(map)) {
    if (theme === 'all') continue;
    css += one(`:root[data-theme="${theme}"] body`, c);
  }
  let tag = document.getElementById('skinCursor');
  if (!css) { tag?.remove(); return; }
  if (!tag) { tag = document.createElement('style'); tag.id = 'skinCursor'; document.head.appendChild(tag); }
  tag.textContent = css;
}

/* ---- the logo and the tab icon ----------------------------- */
function brand() {
  const b = CFG().brand || {};
  if (b.logo && isUrl(b.logo)) {
    document.querySelectorAll('.logo__mark').forEach(el => {
      if (el.dataset.own) return;
      const img = document.createElement('img');
      img.src = b.logo; img.alt = ''; img.className = 'logo__mark'; img.dataset.own = '1';
      el.replaceWith(img);
    });
  }
  if (b.favicon && isUrl(b.favicon)) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = b.favicon;
  }
}

/* ---- put it all in place ---------------------------------- */
function apply(root = document) {
  const printer = root.querySelector ? root.querySelector('.printer') : null;
  if (printer) {
    printer.dataset.anim = (CFG().hero || {}).animation || 'print';
    const art = heroArt();
    if (art) {
      const box = printer.querySelector('.printer__art');
      if (box && !box.dataset.own) { box.dataset.own = '1'; box.innerHTML = art; }
    }
  }
  /* any icon the owner replaced */
  const over = CFG().icons || {};
  for (const name of Object.keys(over)) {
    const html = icon(name);
    if (!html) continue;
    (root.querySelectorAll ? root : document).querySelectorAll(`[data-ico="${name}"]`)
      .forEach(el => { el.innerHTML = html; });
  }
}

return { apply, fonts, cursors, brand, icon, heroArt, cleanSvg };
})();
