/* ===========================================================
   THE RIG — printer chrome driven by scroll.

   Top    a ruler traversing like the X axis, plus the material
          of whatever product is nearest the middle of your screen
   Left   filament feeding down; speed and direction follow your scroll
   Bottom the print bed filling in, with the nozzle laying it down

   Purely decorative. Nothing here is interactive, and nothing
   here moves when prefers-reduced-motion is set.
   =========================================================== */
(() => {
'use strict';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* a mouse or a trackpad, not a finger */
const hasPointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = s => document.querySelector(s);
const BUILD_X = 250;      // our bed is 250 mm across
const LAYER_MM = 0.2;
const DEG = String.fromCharCode(176);

/* What the top readout says, per material. The filament is coloured by
   the material rather than by the product's colour: a pearl-white
   product would leave an invisible strand, and the material is the
   thing the rig is actually reporting. */
function profile(spec) {
  const s = (spec || '').toLowerCase();
  if (s.includes('resin')) return { name: 'Resin',    temp: 'UV 405 nm',      ink: '#6fb7ff' };
  if (s.includes('abs'))   return { name: 'ABS',      temp: '250' + DEG + 'C', ink: '#ff8a3d' };
  if (s.includes('pgla') || s.includes('petg'))
                           return { name: 'PGLA',     temp: '235' + DEG + 'C', ink: '#2fb9a3' };
  if (s.includes('silk'))  return { name: 'Silk PLA', temp: '215' + DEG + 'C', ink: 'var(--accent)' };
  if (s.includes('pla+') || s.includes('translucent'))
                           return { name: 'PLA+',     temp: '215' + DEG + 'C', ink: 'var(--accent)' };
  if (s.includes('mixed')) return { name: 'Mixed',    temp: 'varies',          ink: 'var(--brand)' };
  if (s.includes('your'))  return { name: 'Your pick',temp: 'quoted',          ink: 'var(--brand)' };
  return { name: 'PLA', temp: '210' + DEG + 'C', ink: 'var(--brand)' };
}

/* ---------- build the DOM -------------------------------- */
const ticks = n => new Array(n).fill('<i></i>').join('');

const topBand = document.createElement('div');
topBand.className = 'band-scale rig-top';
topBand.setAttribute('aria-hidden', 'true');
topBand.innerHTML =
  '<div class="band-scale__strip" id="rigTopStrip"></div>' +
  '<div class="rig-head" id="rigHead"></div>' +
  '<span class="rig-read rig-read--l"><i class="rig-dot"></i>Printing in <b id="rigMat">PLA</b> <span id="rigTemp">210' + DEG + 'C</span></span>' +
  '<span class="rig-read rig-read--r">X <b id="rigXm">0.0</b> / ' + BUILD_X + ' mm</span>';

const bed = document.createElement('div');
bed.className = 'band-scale rig-bed';
bed.setAttribute('aria-hidden', 'true');
bed.innerHTML =
  '<div class="band-scale__strip" id="rigBedStrip"></div>' +
  '<div class="rig-bed__laid" id="rigLaid"></div>' +
  '<div class="rig-bed__fill" id="rigFill"></div>' +
  '<div class="rig-bed__nozzle" id="rigNozzle"></div>' +
  '<span class="rig-read rig-read--l">Bed &middot; layer <b id="rigLayer">0</b> / <span id="rigLayers">0</span></span>' +
  '<span class="rig-read rig-read--r">Z <b id="rigZ">0.0</b> mm</span>';

const feed = document.createElement('div');
feed.className = 'rig-feed';
feed.setAttribute('aria-hidden', 'true');
feed.innerHTML =
  '<div class="rig-feed__tube"><div class="rig-feed__strand" id="rigStrand"></div></div>' +
  '<div class="rig-feed__spool" id="rigSpool"></div>' +
  '<span class="rig-feed__label">filament feed</span>';

function mount() {
  const bar = $('#topbar');
  if (bar && !$('.rig-top')) bar.appendChild(topBand);
  if (!$('.rig-bed')) document.body.appendChild(bed);
  if (!$('.rig-feed')) document.body.appendChild(feed);
  layTicks();
}

/* the bed sits directly on top of the mobile tab bar, whatever height
   that bar actually turns out to be */
function measureTab() {
  const tab = document.querySelector('.tabbar');
  const h = tab && getComputedStyle(tab).display !== 'none' ? Math.round(tab.offsetHeight) : 0;
  document.documentElement.style.setProperty('--tab-h', h + 'px');
}

function layTicks() {
  const step = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--rig-tick')) || 50;
  const n = Math.ceil(innerWidth / step) + 12;
  $('#rigTopStrip').innerHTML = ticks(n);
  $('#rigBedStrip').innerHTML = ticks(n);
  measureTab();
}

/* ---------- which product are we looking at? ------------- */
let matKey = null;
function readMaterial() {
  const mid = innerHeight / 2;
  let best = null, dist = Infinity;
  document.querySelectorAll('#view [data-id]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const d = Math.abs((r.top + r.bottom) / 2 - mid);
    if (d < dist) { dist = d; best = el.dataset.id; }
  });
  const p = best && window.S ? S.byId(best) : null;
  /* on a product page the readout follows the material they picked */
  const picked = document.querySelector('.pill.on[data-v="material"]');
  const spec = picked ? picked.dataset.val : (p ? p.specs.Material : '');
  if (spec === matKey) return;
  matKey = spec;
  const pr = profile(spec);
  $('#rigMat').textContent = pr.name;
  $('#rigTemp').textContent = pr.temp;
  document.documentElement.style.setProperty('--rig-mat', pr.ink);
}

/* ---------- the scroll loop ------------------------------ */
let last = scrollY, flow = 0, pending = false;

/* The ruler answers the mouse as well as the scroll: a real gantry
   is driven in X, so the head follows you across the page and the
   ruler eases after it. Touch devices never send these events and
   lose nothing — the scroll traverse is the same as it was. */
let aimX = 0.5, haveX = 0.5, nudging = false;

function onPointer(e) {
  aimX = Math.min(1, Math.max(0, e.clientX / innerWidth));
  if (nudging || still) return;
  nudging = true;
  requestAnimationFrame(ease);
}

function ease() {
  /* a damped follow, so the ruler drifts rather than snaps */
  haveX += (aimX - haveX) * 0.12;
  paintX();
  if (Math.abs(aimX - haveX) > 0.0008) requestAnimationFrame(ease);
  else { haveX = aimX; paintX(); nudging = false; }
}

function paintX() {
  const strip = $('#rigTopStrip'); if (!strip) return;
  /* 34px of travel either side of where the scroll has put it */
  strip.style.setProperty('--rig-aim', ((haveX - 0.5) * 68).toFixed(2) + 'px');
  const head = $('#rigHead');
  if (head) head.style.transform = 'translateX(' + (haveX * innerWidth).toFixed(1) + 'px)';
  const read = $('#rigXm');
  if (read) read.textContent = (haveX * BUILD_X).toFixed(1);
}

function frame() {
  pending = false;
  const doc = document.documentElement;
  const max = Math.max(1, doc.scrollHeight - innerHeight);
  const y = scrollY;
  const p = Math.min(1, Math.max(0, y / max));
  const delta = y - last; last = y;

  /* the ruler traverses; a 100px period keeps the loop seamless */
  if (!still) $('#rigTopStrip').style.setProperty('--rig-run', (-((y * 0.3) % 100)) + 'px');

  /* the bed fills as the page is consumed */
  const w = p * innerWidth;
  $('#rigFill').style.width = w + 'px';
  $('#rigLaid').style.width = w + 'px';
  if (still) $('#rigNozzle').style.left = w + 'px';
  else $('#rigNozzle').style.transform = 'translateX(' + w + 'px)';

  const layers = Math.max(1, Math.round(max / 18));
  const layer = Math.round(p * layers);
  $('#rigLayer').textContent = layer;
  $('#rigLayers').textContent = layers;
  $('#rigZ').textContent = (layer * LAYER_MM).toFixed(1);
  /* the readout follows the pointer when there is one, the scroll otherwise */
  if (!hasPointer) { const r = $('#rigXm'); if (r) r.textContent = (p * BUILD_X).toFixed(1); }

  /* the filament moves by how far you scrolled, so it feeds as you read */
  if (!still) {
    flow += delta * 0.6;
    $('#rigStrand').style.transform = 'translateY(' + (flow % 26) + 'px)';
    $('#rigSpool').style.transform = 'translate(0, -50%) rotate(' + (flow * 1.6) + 'deg)';
  }
  readMaterial();
}

function onScroll() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(frame);
}

/* A background tab never runs requestAnimationFrame, so a scroll there
   would leave the rig frozen. Catch up the moment the tab is looked at. */
function wake() {
  if (document.visibilityState !== 'visible') return;
  pending = false;
  last = scrollY;
  frame();
}

function start() {
  mount();
  frame();
  dispatchEvent(new Event('resize'));   // the header just got 40px taller
  addEventListener('scroll', onScroll, { passive: true });
  if (hasPointer) {
    addEventListener('pointermove', onPointer, { passive: true });
    addEventListener('pointerleave', () => { aimX = 0.5; if (!nudging && !still) { nudging = true; requestAnimationFrame(ease); } });
  }
  addEventListener('resize', () => { layTicks(); frame(); paintX(); });
  /* the view swaps without a scroll event, so catch route changes too */
  addEventListener('hashchange', () => setTimeout(() => { matKey = null; frame(); }, 60));
  document.addEventListener('visibilitychange', wake);
  addEventListener('pageshow', wake);
  /* picking a different material should update the readout immediately */
  document.addEventListener('click', e => {
    if (e.target.closest('[data-v="material"]')) setTimeout(() => { matKey = null; frame(); }, 20);
  });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', start)
  : start();
})();
