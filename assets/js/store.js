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

/* unit price for a product with a chosen size / material */
function unitPrice(p, v = {}) {
  if (!p) return 0;
  let n = p.price;
  const sz = (p.variants?.size || []).find(o => o.k === v.size);
  const mt = (p.variants?.material || []).find(o => o.k === v.material);
  if (sz) n += sz.delta;
  if (mt) n += mt.delta;
  return Math.max(0, n);
}

/* percent off at a given quantity */
function bulkOff(qty) {
  const t = CFG.bulk.tiers.find(t => qty >= t.min && (t.max === null || qty <= t.max));
  return t ? t.off : 0;
}

/* default variant selection for a product */
function defaults(p) {
  const v = {};
  if (p.variants?.size)     v.size     = (p.variants.size.find(o => o.k === 'M') || p.variants.size[0]).k;
  if (p.variants?.material) v.material = p.variants.material[0].k;
  if (p.variants?.colour)   v.colour   = p.variants.colour[0].k;
  return v;
}

const colourHex = (p, v) => (p.variants?.colour || []).find(o => o.k === v?.colour)?.hex || null;
const variantText = (p, v) => {
  if (!v) return '';
  const out = [];
  const sz = (p.variants?.size || []).find(o => o.k === v.size);
  const mt = (p.variants?.material || []).find(o => o.k === v.material);
  const cl = (p.variants?.colour || []).find(o => o.k === v.colour);
  if (sz) out.push(sz.label);
  if (mt) out.push(mt.label);
  if (cl) out.push(cl.label);
  return out.join(' · ');
};

/* ---- collections ---------------------------------------- */
let cart   = read(K.cart, []).filter(i => byId(i.id));
let wish   = read(K.wish, []).filter(byId);
let later  = read(K.later, []).filter(i => byId(i.id));
let recent = read(K.recent, []).filter(byId);
let seen   = read(K.seen, []);

const key = i => [i.id, i.v?.size || '', i.v?.material || '', i.v?.colour || '', i.note || ''].join('|');
const save = () => { write(K.cart, cart); write(K.wish, wish); write(K.later, later); };

function add(id, v, note, qty = 1) {
  const item = { id, v: v || {}, note: note || '', qty };
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
  const free = sub >= CFG.shipping.freeAbove || sub === 0;
  const ship = free ? 0 : CFG.shipping.flat;
  return { sub, saved, ship, free, grand: sub + ship, count: items.reduce((n, i) => n + i.qty, 0) };
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
    const hay = [p.name, catName(p.cat), p.blurb, (p.tags || []).join(' '),
                 Object.values(p.specs || {}).join(' '),
                 (p.variants?.colour || []).map(c => c.label).join(' ')].join(' ').toLowerCase();
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
  CFG, K, read, write, money, byId, catName, unitPrice, bulkOff, defaults, colourHex, variantText,
  key, add, setQty, removeAt, clearCart, toLater, fromLater, inWish, toggleWish,
  sawProduct, sawSearch, lineTotal, totals, rail, search, has, POPULAR,
  get cart() { return cart; }, get wish() { return wish; }, get later() { return later; },
  get recent() { return recent; }, get seen() { return seen; },
};
})();
