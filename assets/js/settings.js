/* ===========================================================
   SETTINGS — merges whatever the admin panel saved on top of
   the defaults in config.js and occasions.js.

   The panel exports assets/data/site.json. If that file is in
   the repo it wins; if it is missing (or we are opened from a
   file:// path where fetch is blocked) the bundled defaults
   are used and nothing breaks.
   =========================================================== */
window.SETTINGS = (() => {
'use strict';

const PREVIEW = 'joyshine.preview';     // admin panel live preview
let loaded = null;

function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object') return base;
  for (const k of Object.keys(patch)) {
    const v = patch[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') {
      deepMerge(base[k], v);
    } else if (v !== undefined) {
      base[k] = v;
    }
  }
  return base;
}

/* occasions are matched by id — the panel only stores what changed */
function applyOccasions(patches) {
  if (!Array.isArray(patches)) return;
  for (const p of patches) {
    const occ = window.OCCASIONS.find(o => o.id === p.id);
    if (!occ) continue;
    if (p.on !== undefined)    occ.on = !!p.on;
    if (p.theme)               occ.theme = p.theme;
    if (p.tag !== undefined)   occ.tag = p.tag;
    if (p.lead !== undefined)  occ.lead = +p.lead;
    if (p.trail !== undefined) occ.trail = +p.trail;
    if (p.banner)              deepMerge(occ.banner, p.banner);
    if (p.dates && occ.when?.type === 'set') {
      occ.when.dates = { ...(occ.when.dates || {}), ...p.dates };
    }
  }
}

async function load() {
  if (loaded) return loaded;
  let data = null;
  try {
    const r = await fetch('assets/data/site.json', { cache: 'no-store' });
    if (r.ok) data = await r.json();
  } catch { /* file:// or not published yet — defaults are fine */ }

  if (data) {
    if (data.settings)  deepMerge(window.JOYSHINE, data.settings);
    if (data.occasions) applyOccasions(data.occasions);
  }

  /* the admin panel's preview overrides everything, for this browser only */
  let preview = null;
  try { preview = JSON.parse(localStorage.getItem(PREVIEW) || 'null'); } catch {}
  if (preview) {
    if (preview.settings)  deepMerge(window.JOYSHINE, preview.settings);
    if (preview.occasions) applyOccasions(preview.occasions);
  }

  loaded = { data, preview };
  return loaded;
}

/* Which theme should this page wear?
   route lock  >  a visitor who picked during this occasion  >
   admin override  >  today's occasion  >  default            */
function theme(routeLock, occ) {
  if (routeLock) return routeLock;
  const cfg = window.JOYSHINE.occasions || {};
  let pick = null, pickOcc = null;
  try {
    pick = JSON.parse(localStorage.getItem('joyshine.theme') || 'null');
    pickOcc = localStorage.getItem('joyshine.themeOcc');
  } catch {}
  if (pick && pickOcc === (occ ? occ.id : '')) return pick;
  if (cfg.forceTheme) return cfg.forceTheme;
  if (cfg.auto !== false && occ && occ.theme) return occ.theme;
  return window.JOYSHINE.defaultTheme;
}

function current() {
  const cfg = window.JOYSHINE.occasions || {};
  if (cfg.forceOccasion) {
    const o = window.OCCASIONS.find(x => x.id === cfg.forceOccasion);
    if (o) return { ...o, window: window.OCC.windowIn(o, new Date().getFullYear()) };
  }
  if (cfg.auto === false) return null;
  return window.OCC.active();
}

return { load, theme, current, PREVIEW, deepMerge };
})();
