/* ===========================================================
   STORE — state, money, persistence. No DOM in this file.
   =========================================================== */
window.S = (() => {
'use strict';

const CFG = window.JOYSHINE;
const K = { cart: 'joyshine.cart.v2', wish: 'joyshine.wish.v1', later: 'joyshine.later.v1',
            recent: 'joyshine.recent.v1', seen: 'joyshine.searches.v1', buyer: 'joyshine.buyer.v1',
            theme: 'joyshine.theme' };

const read = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ---- money ---------------------------------------------- */
const nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = n => CFG.currencySymbol + nf.format(Math.round(n));

const byId = id => window.PRODUCTS.find(p => p.id === id);
const catName = id => (window.CATEGORIES.find(c => c.id === id) || {}).name || id;

/* ---- backward-compat shim ---------------------------------
   Old products store colour/size/material in variants.colour etc.
   New products use variants.options[]. This shim normalises both
   into the new shape so the rest of the code handles one format. */
function normaliseProduct(p) {
  if (!p) return p;
  const v = p.variants || {};
  if (v.options) return p; /* already new format */

  const options = [];
  /* migrate colour → options */
  if (Array.isArray(v.colour) && v.colour.length) {
    const vals = v.colour.map(c => ({
      k: c.k, label: c.label, hex: c.hex || null,
      images: (p.colourPhotos?.[c.k] ? [p.colourPhotos[c.k]] : []),
    }));
    options.push({ name: 'Colour', type: 'colour', values: vals });
  }
  /* migrate size */
  if (Array.isArray(v.size) && v.size.length) {
    const vals = v.size.map(s => ({
      k: s.k, label: s.label,
      delta: s.delta || 0, l: s.l, b: s.b, h: s.h,
    }));
    options.push({ name: 'Size', type: 'text', values: vals });
  }
  /* migrate material */
  if (Array.isArray(v.material) && v.material.length) {
    const vals = v.material.map(m => ({
      k: m.k, label: m.label,
      delta: m.delta || 0, stock: m.stock ?? null, note: m.note || '',
    }));
    options.push({ name: 'Material', type: 'text', values: vals });
  }
  if (options.length) p.variants = { ...v, options };
  /* migrate single photo into productImages */
  if (!p.productImages && p.photo) p.productImages = [p.photo];
  return p;
}

/* unit price for a product with a chosen variant */
function unitPrice(p, v = {}) {
  if (!p) return 0;
  /* variantMatrix wins — check by option keys */
  const e = variantEntry(p, v);
  if (e && e.price != null) return Math.max(0, e.price);
  /* legacy delta system */
  let n = p.price;
  const opts = p.variants?.options || [];
  opts.forEach(opt => {
    const chosen = v[opt.name];
    if (!chosen) return;
    const val = opt.values.find(o => o.k === chosen);
    if (val?.delta) n += val.delta;
  });
  return Math.max(0, n);
}

/* percent off at a given quantity */
function bulkOff(qty) {
  const t = CFG.bulk.tiers.find(t => qty >= t.min && (t.max === null || qty <= t.max));
  return t ? t.off : 0;
}

/* default variant selection — first value per option */
function defaults(p) {
  const v = {};
  const opts = p.variants?.options || [];
  for (const opt of opts) {
    if (opt.values && opt.values.length) v[opt.name] = opt.values[0].k;
  }
  return v;
}

/* hex for the current colour selection */
function colourHex(p, v) {
  const opts = p.variants?.options || [];
  const colOpt = opts.find(o => o.type === 'colour');
  if (!colOpt) return null;
  const chosen = v?.[colOpt.name];
  return colOpt.values.find(o => o.k === chosen)?.hex || null;
}

/* human-readable description of selected options */
function variantText(p, v) {
  if (!v) return '';
  const opts = p.variants?.options || [];
  const parts = [];
  for (const opt of opts) {
    const chosen = v[opt.name];
    if (!chosen) continue;
    const val = opt.values.find(o => o.k === chosen);
    if (val) parts.push(val.label || val.k);
  }
  return parts.join(' · ');
}

/* find the best-matching variantMatrix entry */
function variantEntry(p, v) {
  const matrix = p.variantMatrix;
  if (!matrix || !matrix.length || !v) return null;
  /* score each entry by how many combo keys match */
  let best = null, bestScore = -1;
  for (const e of matrix) {
    const c = e.combo || {};
    const keys = Object.keys(c);
    if (!keys.length) continue;
    const allMatch = keys.every(k => c[k] === (v[k] || ''));
    if (!allMatch) continue;
    if (keys.length > bestScore) { best = e; bestScore = keys.length; }
  }
  return best;
}

/* price/was for current selection */
function variantPrice(p, v) {
  const e = variantEntry(p, v);
  if (e && e.price != null) return { price: e.price, was: e.was ?? null };
  return { price: p.price, was: p.was ?? null };
}

/* status for current variant — e.g. 'out-of-stock', 'made-to-order' */
function variantStatus(p, v) {
  const e = variantEntry(p, v);
  return e?.status || 'available';
}

/* processing time for current variant */
function variantProcessingTime(p, v) {
  const e = variantEntry(p, v);
  return e?.processingTime || null;
}

/* ordered list of images for current selection with fallback hierarchy:
   exact variant images → colour/option value images → productImages → p.photo */
function variantImages(p, v) {
  /* exact variant images */
  const e = variantEntry(p, v);
  if (e?.images?.length) return e.images;

  /* colour option value images */
  const opts = p.variants?.options || [];
  const colOpt = opts.find(o => o.type === 'colour');
  if (colOpt) {
    const chosen = v?.[colOpt.name];
    const val = colOpt.values.find(o => o.k === chosen);
    if (val?.images?.length) return val.images;
  }
  /* any option value images for non-colour options */
  for (const opt of opts) {
    if (opt.type === 'colour') continue;
    const chosen = v?.[opt.name];
    const val = opt.values.find(o => o.k === chosen);
    if (val?.images?.length) return val.images;
  }

  /* product-level images */
  if (p.productImages?.length) return p.productImages;
  if (p.photo) return [p.photo];
  return [];
}

/* first/primary photo (for card art, backwards compat) */
function variantPhoto(p, v) {
  const imgs = variantImages(p, v);
  return imgs[0] || null;
}

/* minimum price across all configured variants, or null if all same */
function fromPrice(p) {
  const matrix = p.variantMatrix;
  if (!matrix || !matrix.length) return null;
  const prices = matrix.map(e => e.price).filter(n => n != null);
  if (!prices.length) return null;
  const min = Math.min(...prices);
  return min < p.price ? min : null;
}

/* ---- collections ---------------------------------------- */
let cart   = read(K.cart, []).filter(i => byId(i.id));
let wish   = read(K.wish, []).filter(byId);
let later  = read(K.later, []).filter(i => byId(i.id));
let recent = read(K.recent, []).filter(byId);
let seen   = read(K.seen, []);

const key = i => [i.id, i.v?.size || '', i.v?.material || '', i.v?.colour || '',
                  i.note || '', JSON.stringify(i.opts || {})].join('|');
const save = () => { write(K.cart, cart); write(K.wish, wish); write(K.later, later); };

function add(id, v, note, qty = 1, opts = null) {
  const item = { id, v: v || {}, note: note || '', qty, opts: opts || undefined };
  const hit = cart.find(i => key(i) === key(item));
  if (hit) hit.qty += qty; else cart.push(item);
  save();
  return hit || item;
}
function setQty(i, n) {
  const it = cart[i]; if (!it) return;
  it.qty = Math.max(0, n);
  if (!it.qty) cart.splice(i, 1);
  save();
}
const removeAt = i => { cart.splice(i, 1); save(); };
const clearCart = () => { cart = []; save(); };

function toLater(i) { const it = cart.splice(i, 1)[0]; if (it) later.push(it); save(); }
function fromLater(i) { const it = later.splice(i, 1)[0]; if (it) { const h = cart.find(c => key(c) === key(it)); h ? h.qty += it.qty : cart.push(it); } save(); }

const inWish = id => wish.includes(id);
function toggleWish(id) {
  const i = wish.indexOf(id);
  if (i > -1) wish.splice(i, 1); else wish.unshift(id);
  save(); return i === -1;
}

function sawProduct(id) {
  recent = [id, ...recent.filter(r => r !== id)].slice(0, 12);
  write(K.recent, recent);
}
function sawSearch(q) {
  q = q.trim(); if (q.length < 2) return;
  seen = [q, ...seen.filter(s => s.toLowerCase() !== q.toLowerCase())].slice(0, 6);
  write(K.seen, seen);
}

/* ---- totals ---------------------------------------------- */
function lineTotal(it) {
  const p = byId(it.id);
  const unit = unitPrice(p, it.v);
  const off = p.bulk ? bulkOff(it.qty) : 0;
  return { unit, off, gross: unit * it.qty, net: Math.round(unit * it.qty * (1 - off / 100)) };
}
function totals(items) {
  let sub = 0, saved = 0;
  items.forEach(it => { const l = lineTotal(it); sub += l.net; saved += l.gross - l.net; });

  /* A code comes off the products only — never the shipping. The
     free-shipping threshold is judged on what they actually spent on
     goods, so a coupon cannot quietly take free delivery away. */
  const d = window.PROMO ? window.PROMO.discount(sub) : { off: 0, why: '' };
  const off = Math.min(d.off, sub);
  const afterCode = sub - off;

  const free = sub >= CFG.shipping.freeAbove || sub === 0;
  const ship = free ? 0 : CFG.shipping.flat;
  return {
    sub, saved, off, offerWhy: d.why,
    code: off ? window.PROMO?.applied?.code : '',
    ship, free, grand: afterCode + ship,
    count: items.reduce((n, i) => n + i.qty, 0),
  };
}

/* ---- queries --------------------------------------------- */
const has = (p, tag) => (p.tags || []).includes(tag);
const inStockList = () => window.PRODUCTS.filter(p => !p.hidden);

function rail(spec) {
  const all = inStockList();
  switch (spec.kind) {
    case 'new':        return all.filter(p => has(p, 'new'));
    case 'trending':   return all.filter(p => has(p, 'trending'));
    case 'bestseller': return all.filter(p => has(p, 'bestseller'));
    case 'gift':       return all.filter(p => has(p, 'gift'));
    case 'festival': { const o = window.OCC_NOW; return o ? all.filter(p => has(p, o.tag)) : []; }
    case 'under':      return all.filter(p => p.price > 0 && p.price <= spec.max).sort((a, b) => a.price - b.price);
    case 'cat':        return all.filter(p => p.cat === spec.cat);
    case 'badge':      return all.filter(p => has(p, spec.badge));
    case 'recent':     return recent.map(byId).filter(Boolean);
    default:           return [];
  }
}

/* search: name, category, blurb, tags, material, colour */
function search(q) {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);
  return inStockList().map(p => {
    const colOpt = (p.variants?.options || []).find(o => o.type === 'colour');
    const hay = [p.name, catName(p.cat), p.blurb, (p.tags || []).join(' '),
                 Object.values(p.specs || {}).join(' '),
                 (colOpt?.values || []).map(c => c.label).join(' ')].join(' ').toLowerCase();
    let score = 0;
    words.forEach(w => {
      if (p.name.toLowerCase().startsWith(w)) score += 6;
      else if (p.name.toLowerCase().includes(w)) score += 4;
      if (catName(p.cat).toLowerCase().includes(w)) score += 2;
      if (hay.includes(w)) score += 1;
    });
    return { p, score };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).map(r => r.p);
}

const POPULAR = ['kumkum barni', 'keychain', 'lamp', 'diya', 'phone stand', 'return gifts', 'tractor'];

return {
  CFG, K, read, write, money, byId, catName,
  normaliseProduct,
  unitPrice, bulkOff, defaults, colourHex, variantText,
  variantEntry, variantPrice, variantStatus, variantProcessingTime,
  variantImages, variantPhoto, fromPrice,
  key, add, setQty, removeAt, clearCart, toLater, fromLater, inWish, toggleWish,
  sawProduct, sawSearch, lineTotal, totals, rail, search, has, POPULAR,
  get cart() { return cart; }, get wish() { return wish; }, get later() { return later; },
  get recent() { return recent; }, get seen() { return seen; },
};
})();
