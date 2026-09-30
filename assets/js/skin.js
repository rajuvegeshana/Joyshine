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

/* ---- typefaces, per theme ---------------------------------
   One <style> element, rewritten whenever the settings change. */
function fonts() {
  const map = CFG().fonts || {};
  let css = '';
  for (const [theme, f] of Object.entries(map)) {
    if (!f) continue;
    const family = `joyshine-${theme.replace(/[^a-z0-9]/gi, '')}`;
    if (f.url && isUrl(f.url)) {
      const fmt = /\.otf($|\?)/i.test(f.url) ? 'opentype'
        : /\.ttf($|\?)/i.test(f.url) ? 'truetype'
        : /\.woff($|\?)/i.test(f.url) ? 'woff' : 'woff2';
      css += `@font-face{font-family:'${family}';src:url('${f.url}') format('${fmt}');font-display:swap;font-weight:100 900;}\n`;
    }
    const stack = [];
    if (f.url) stack.push(`'${family}'`);
    if (f.display) stack.push(f.display.includes(',') ? f.display : `'${f.display}'`);
    const bodyStack = [];
    if (f.url && f.useForBody) bodyStack.push(`'${family}'`);
    if (f.body) bodyStack.push(f.body.includes(',') ? f.body : `'${f.body}'`);

    const rules = [];
    if (stack.length) rules.push(`--font-display:${stack.join(',')},serif`);
    if (bodyStack.length) rules.push(`--font-body:${bodyStack.join(',')},system-ui,sans-serif`);
    if (f.weight) rules.push(`--display-weight:${+f.weight || 400}`);
    if (f.tracking) rules.push(`--display-tracking:${f.tracking}`);
    if (rules.length) css += `:root[data-theme="${theme}"]{${rules.join(';')};}\n`;
  }

  let tag = document.getElementById('skinFonts');
  if (!css) { tag?.remove(); return; }
  if (!tag) { tag = document.createElement('style'); tag.id = 'skinFonts'; document.head.appendChild(tag); }
  tag.textContent = css;
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

return { apply, fonts, icon, heroArt, cleanSvg };
})();
