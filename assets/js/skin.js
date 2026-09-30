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
const isJson = s => isUrl(s) && /\.json($|\?)/i.test(s.trim());

/* ---- moving pictures ---------------------------------------
   A .json here is a Lottie animation, the format After Effects
   and LottieFiles export. The player is 250 KB, so it is only
   fetched if something on the page actually uses one — a shop
   with no animations downloads nothing.                        */
const LOTTIE = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie_light.min.js';
let lottieReady = null;

function lottie() {
  if (lottieReady) return lottieReady;
  lottieReady = new Promise((ok, no) => {
    if (window.lottie) return ok(window.lottie);
    const s2 = document.createElement('script');
    s2.src = LOTTIE; s2.async = true;
    s2.onload = () => ok(window.lottie);
    s2.onerror = () => no(new Error('the animation player did not load'));
    document.head.appendChild(s2);
  });
  return lottieReady;
}

/* a box that plays the animation, or shows nothing if it will not load */
function playJson(box, url, loop = true) {
  if (!box || box.dataset.lottie === url) return;
  box.dataset.lottie = url;
  box.innerHTML = '';
  lottie().then(L => {
    if (box.dataset.lottie !== url) return;
    L.loadAnimation({
      container: box, renderer: 'svg', loop, autoplay: true, path: url,
      rendererSettings: { progressiveLoad: true },
    });
  }).catch(() => { box.dataset.lottie = ''; });
}

/* one picture setting, drawn however it needs to be drawn */
function pictureHtml(v, cls) {
  if (!v) return '';
  if (isJson(v)) return `<span class="lot ${cls}" data-lot="${v.replace(/"/g, '&quot;')}"></span>`;
  if (isUrl(v)) return `<img src="${v.replace(/"/g, '&quot;')}" alt="" class="${cls}">`;
  return cleanSvg(v);
}

/* start any animation that has been dropped into the page */
function playAll(root = document) {
  (root.querySelectorAll ? root : document).querySelectorAll('[data-lot]').forEach(el => {
    playJson(el, el.dataset.lot, el.dataset.loop !== 'no');
  });
}

/* an icon the owner has replaced, or nothing */
function icon(name) {
  if (name === 'micro') return '';
  return pictureHtml((CFG().icons || {})[name], 'ico-img');
}

/* the hero's artwork, if one was uploaded */
function heroArt() {
  return pictureHtml((CFG().hero || {}).art, 'printer__img');
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
   A PNG can be a cursor the ordinary way, through CSS. An SVG
   cannot be relied on to work as one — Chrome needs explicit
   dimensions and Safari refuses outright — and a Lottie
   animation cannot be a CSS cursor at all. So for those two the
   arrow is replaced by a small element that follows the pointer.

   Hiding a real pointer is a thing to do carefully: the follower
   only runs on a device with a mouse, never under a request for
   less motion, the native arrow stays over anything you type
   into, and it comes straight back the moment the pointer leaves
   the window or the tab loses focus.
   =========================================================== */
const isSvgUrl = v => isUrl(v) && /\.svg($|\?)/i.test(v.trim());

function cursorCss(sel, c) {
  if (!c || c.kind === 'default') return '';
  if (c.kind === 'pointer')   return `${sel}, ${sel} * { cursor: pointer; }\n`;
  if (c.kind === 'crosshair') return `${sel} { cursor: crosshair; }\n`;
  if (c.kind === 'grab')      return `${sel} { cursor: grab; }\n`;
  /* a flat bitmap is the cheapest possible custom cursor */
  if (c.kind === 'image' && isUrl(c.url) && !isSvgUrl(c.url) && !isJson(c.url))
    return `${sel}, ${sel} * { cursor: url('${c.url}') ${c.hotX ?? 6} ${c.hotY ?? 4}, auto; }\n`;
  return '';
}

/* which scope, if any, wants the follower */
function followerFor() {
  const map = CFG().cursors || {};
  const theme = document.documentElement.dataset.theme;
  const pick = map[theme] && map[theme].kind && map[theme].kind !== 'default' ? map[theme] : map.all;
  if (!pick || pick.kind !== 'image' || !pick.url) return null;
  if (isJson(pick.url)) return { url: pick.url, kind: 'lottie', size: +pick.size || 48 };
  if (isSvgUrl(pick.url)) return { url: pick.url, kind: 'svg', size: +pick.size || 40 };
  return null;                       /* a PNG goes through CSS instead */
}

let follower = null, curAt = { x: -100, y: -100 }, curTo = { x: -100, y: -100 }, curRun = false;

function stopFollower() {
  follower?.el.remove();
  follower = null;
  document.documentElement.classList.remove('has-cur');
}

function startFollower(spec) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || still) return stopFollower();
  if (follower && follower.url === spec.url && follower.size === spec.size) return;
  stopFollower();

  const el = document.createElement('div');
  el.className = 'cur';
  el.setAttribute('aria-hidden', 'true');
  el.style.setProperty('--cur-size', spec.size + 'px');
  document.body.appendChild(el);
  follower = { ...spec, el };
  document.documentElement.classList.add('has-cur');

  if (spec.kind === 'lottie') playJson(el, spec.url);
  else el.innerHTML = `<img src="${spec.url.replace(/"/g, '&quot;')}" alt="">`;

  if (!curRun) {
    curRun = true;
    addEventListener('pointermove', e => {
      curTo.x = e.clientX; curTo.y = e.clientY;
      if (follower) follower.el.classList.add('on');
    }, { passive: true });
    /* give the arrow back whenever the pointer is not ours to draw */
    addEventListener('pointerleave', () => follower?.el.classList.remove('on'));
    addEventListener('blur', () => follower?.el.classList.remove('on'));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') follower?.el.classList.remove('on');
    });
    const tick = () => {
      if (follower) {
        /* a little lag reads as weight; too much reads as broken */
        curAt.x += (curTo.x - curAt.x) * 0.35;
        curAt.y += (curTo.y - curAt.y) * 0.35;
        follower.el.style.transform = `translate3d(${curAt.x.toFixed(1)}px, ${curAt.y.toFixed(1)}px, 0)`;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

function cursors() {
  const map = CFG().cursors || {};
  let css = cursorCss('body', map.all);
  for (const [theme, c] of Object.entries(map)) {
    if (theme === 'all') continue;
    css += cursorCss(`:root[data-theme="${theme}"] body`, c);
  }
  let tag = document.getElementById('skinCursor');
  if (!css) tag?.remove();
  else {
    if (!tag) { tag = document.createElement('style'); tag.id = 'skinCursor'; document.head.appendChild(tag); }
    tag.textContent = css;
  }

  const spec = followerFor();
  if (spec) startFollower(spec); else stopFollower();
}

/* ---- the logo and the tab icon ----------------------------- */
function brand() {
  const b = CFG().brand || {};
  if (b.logo) {
    document.querySelectorAll('.logo__mark').forEach(el => {
      if (el.dataset.own) return;
      const box = document.createElement('span');
      box.className = 'logo__mark'; box.dataset.own = '1';
      box.innerHTML = pictureHtml(b.logo, 'logo__img');
      if (box.innerHTML) { el.replaceWith(box); playAll(box); }
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
  /* the owner can switch the small icon movements off entirely */
  document.documentElement.dataset.micro = (CFG().icons || {}).micro === false ? 'off' : 'on';
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
    if (name === 'micro') continue;      /* a switch, not an icon */
    const html = icon(name);
    if (!html) continue;
    (root.querySelectorAll ? root : document).querySelectorAll(`[data-ico="${name}"]`)
      .forEach(el => { el.innerHTML = html; });
  }
  playAll(root);
}

return { apply, fonts, cursors, brand, icon, heroArt, cleanSvg, pictureHtml, playAll, isJson };
})();
