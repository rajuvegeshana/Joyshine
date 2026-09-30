/* ===========================================================
   CATALOGUE LOADER
   The shop prefers the database and falls back to the files.

   products.js and categories stay in the repo as the seed and
   the safety net: if Supabase is empty, slow or unreachable the
   shop still renders a full catalogue. The database only wins
   when it actually has rows.
   =========================================================== */
window.CATALOGUE = (() => {
'use strict';

const CFG = () => window.JOYSHINE.supabase || {};
const ready = () => !!(CFG().url && CFG().anonKey);
const base = () => CFG().url.replace(/\/+$/, '');
const head = () => ({ apikey: CFG().anonKey, Authorization: `Bearer ${CFG().anonKey}` });

let from = 'files';

async function get(path, ms = 3500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${base()}/rest/v1/${path}`, { headers: head(), cache: 'no-store', signal: ctrl.signal });
    return r.ok ? await r.json() : null;
  } catch { return null; } finally { clearTimeout(t); }
}

/* rebuild a product's drawn art from the shared library */
function hydrate(p) {
  if (p.artKey && window.ART && window.ART[p.artKey]) p.art = window.ART[p.artKey];
  if (!p.art && window.ART) p.art = window.ART.upload;
  return p;
}

async function load() {
  if (!ready()) return { from };

  const [cats, prods] = await Promise.all([
    get('categories?select=id,name,note,sort&order=sort.asc'),
    get('products?select=id,data,sort,hidden&order=sort.asc'),
  ]);

  if (Array.isArray(cats) && cats.length) {
    window.CATEGORIES = cats.map(c => ({ id: c.id, name: c.name, note: c.note || '' }));
  }

  if (Array.isArray(prods) && prods.length) {
    window.PRODUCTS = prods
      .filter(r => !r.hidden)
      .map(r => hydrate({ ...r.data, id: r.id }));
    from = 'supabase';
  }
  return { from, counts: { products: window.PRODUCTS.length, categories: window.CATEGORIES.length } };
}

/* ---- the line-up -------------------------------------------
   The owner can say which products lead the shop, and in what
   order, either for every day or for one occasion. Reordering
   window.PRODUCTS here means every listing follows it — home
   rails, the shop grid, categories and search — with no
   special cases anywhere else.

   A product left out of the list is not removed; it simply
   follows the chosen ones, unless "only these" is set, in
   which case the rest is hidden from the listings. Direct
   links still work either way.                                */
function arrange(occ) {
  const own = window.JOYSHINE.lineup || {};
  const picks = (occ && occ.picks && occ.picks.length) ? occ.picks : (own.picks || []);
  const only  = (occ && occ.picks && occ.picks.length) ? !!occ.picksOnly : !!own.only;
  if (!picks.length) return;

  const rank = new Map(picks.map((id, i) => [id, i]));
  const chosen = [], rest = [];
  for (const p of window.PRODUCTS) (rank.has(p.id) ? chosen : rest).push(p);
  chosen.sort((a, b) => rank.get(a.id) - rank.get(b.id));

  if (only) for (const p of rest) p.hidden = true;
  window.PRODUCTS = chosen.concat(rest);
}

/* ---- writing an order or a request from the shop ----------
   Anyone may insert; nobody may read them back. Failing here
   must never block the customer, so every error is swallowed
   and the WhatsApp or Razorpay flow carries on regardless.    */
const ref = p => p + '-' + Date.now().toString(36).toUpperCase().slice(-6);

async function post(table, row) {
  if (!ready()) return null;
  try {
    const r = await fetch(`${base()}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...head(), 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
    if (!r.ok) return null;
    return (await r.json())[0] || null;
  } catch { return null; }
}

const logOrder = o => post('orders', { ref: ref('JS'), ...o });
const logRequest = q => post('requests', { ref: ref('CP'), ...q });

return { load, arrange, logOrder, logRequest, get source() { return from; } };
})();
