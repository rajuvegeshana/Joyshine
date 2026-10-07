/* ===========================================================
   CONTROL PANEL — catalogue, orders, requests, reviews.
   Everything here needs you signed in; the panes say so
   politely rather than failing.
   =========================================================== */
window.ADMINX = (() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const money = n => '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n || 0));
const when = d => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const slug = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

let toast = m => console.log(m);
const inn = () => window.CLOUD?.ready() && window.CLOUD.signedIn();
const gate = what => `<div class="ad-card"><p class="ad-empty">Sign in at the top to ${what}.</p></div>`;

/* the working copy, loaded from the database */
let PRODUCTS = [], CATS = [], editing = null;

/* staged product changes — written to Supabase only on Publish */
const productUpserts = new Map();   /* id → row */
const productDeletes = new Set();   /* id */

/* ---------- loading -------------------------------------- */
async function pull() {
  PRODUCTS = await CLOUD.rows('products?select=id,data,sort,hidden&order=sort.asc') || [];
  CATS     = await CLOUD.rows('categories?select=id,name,note,sort&order=sort.asc') || [];
  /* overlay any staged drafts so the pane stays consistent after a reload */
  for (const [id, row] of productUpserts) {
    const i = PRODUCTS.findIndex(r => r.id === id);
    if (i >= 0) PRODUCTS[i] = { ...PRODUCTS[i], ...row };
    else PRODUCTS.push(row);
  }
  PRODUCTS = PRODUCTS.filter(r => !productDeletes.has(r.id));
}

/* copy what is in products.js into the database, once */
async function seed() {
  if (!confirm('Copy the ' + window.PRODUCTS.length + ' products and ' + window.CATEGORIES.length +
               ' categories currently in the site files into the database?\n\n' +
               'Anything already there with the same name is overwritten. The files are not touched.')) return;
  const artKeyOf = p => Object.keys(window.ART || {}).find(k => window.ART[k] === p.art) || '';
  await CLOUD.upsert('categories', window.CATEGORIES.map((c, i) => ({ id: c.id, name: c.name, note: c.note, sort: i })));
  await CLOUD.upsert('products', window.PRODUCTS.map((p, i) => {
    const { art, ...rest } = p;
    return { id: p.id, sort: i, hidden: false, data: { ...rest, artKey: artKeyOf(p) } };
  }));
  toast('Copied into the database');
  await pull(); paintProducts();
}

/* ---------- modal helpers -------------------------------- */
function openModal(html, onSave) {
  closeModal();
  const scrim = document.createElement('div');
  scrim.className = 'ad-modal-scrim';
  scrim.innerHTML = `<div class="ad-modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(scrim);
  document.body.classList.add('modal-open');
  scrim.addEventListener('click', e => { if (e.target === scrim) closeModal(); });
  scrim.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  if (onSave) scrim._onSave = onSave;
  scrim.addEventListener('click', e => {
    const act = e.target.closest('[data-x]')?.dataset.x;
    if (act === 'modal-save') { if (scrim._onSave) scrim._onSave(); }
    if (act === 'modal-cancel') closeModal();
  });
}

function closeModal() {
  const s = document.querySelector('.ad-modal-scrim');
  if (s) s.remove();
  document.body.classList.remove('modal-open');
}

/* ---------- products list -------------------------------- */
function paintProducts(filter = '') {
  const box = $('#pane-products');
  if (!box) return;
  if (!inn()) { box.innerHTML = gate('manage the catalogue'); return; }

  const f = filter.trim().toLowerCase();

  /* build category -> products map */
  const catMap = {};
  const allCats = CATS.length ? CATS : (window.CATEGORIES || []);
  allCats.forEach(c => { catMap[c.id] = []; });
  PRODUCTS.forEach(r => {
    const cid = r.data.cat || '';
    if (!catMap[cid]) catMap[cid] = [];
    catMap[cid].push(r);
  });

  const thumbHtml = r => {
    const p = r.data;
    if (p.photo) return `<img src="${esc(p.photo)}" alt="">`;
    const art = p.artKey && window.ART && window.ART[p.artKey];
    if (art) return art;
    return '<span style="opacity:.3">—</span>';
  };

  const prodRows = catId => {
    let rows = catMap[catId] || [];
    if (f) rows = rows.filter(r => (r.data.name || '').toLowerCase().includes(f) || r.id.includes(f));
    if (!rows.length) return '<tr><td colspan="5" class="ad-empty" style="padding:.6rem .8rem">No products in this category.</td></tr>';
    return rows.map(r => {
      const p = r.data;
      return `<tr draggable="true" data-pid="${esc(r.id)}" data-cat="${esc(catId)}">
        <td class="ad-drag-handle" title="Drag to reorder">⠇</td>
        <td><div class="ad-prodthumb-wrap"><div class="ad-prodthumb">${thumbHtml(r)}</div></div></td>
        <td>${esc(p.name || r.id)}</td>
        <td>${p.quote ? '<span class="ad-pill ad-pill--clay">quoted</span>' : esc(p.price ? '₹' + p.price : '—')}</td>
        <td style="white-space:nowrap">
          ${r.hidden ? '<span class="ad-pill ad-pill--need" style="margin-right:.3rem">hidden</span>' : ''}
          ${productUpserts.has(r.id) ? '<span class="ad-pill ad-pill--staged" style="margin-right:.3rem">not published</span>' : ''}
          ${productDeletes.has(r.id) ? '<span class="ad-pill ad-pill--need" style="margin-right:.3rem">deleting</span>' : ''}
          <button class="ad-o__more" data-x="prodedit" data-pid="${esc(r.id)}">Edit</button>
        </td>
      </tr>`;
    }).join('');
  };

  const catRows = allCats.map((c, ci) => {
    const icon = A() ? A().getS('catIcons.' + c.id, '') : '';
    const count = (catMap[c.id] || []).length;
    return `<div class="ad-catrow" data-cid="${esc(c.id)}">
      <div class="ad-catrow__head">
        <span class="ad-catrow__icon" aria-hidden="true">${icon || '<span style="opacity:.25">□</span>'}</span>
        <span class="ad-catrow__name">${esc(c.name)}</span>
        <span class="ad-catrow__count">${count} product${count === 1 ? '' : 's'}</span>
        <span class="ad-catrow__btns">
          <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="catup" data-cid="${esc(c.id)}"${ci === 0 ? ' disabled' : ''}>↑</button>
          <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="catdown" data-cid="${esc(c.id)}"${ci === allCats.length - 1 ? ' disabled' : ''}>↓</button>
          <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="catedit" data-cid="${esc(c.id)}">Edit</button>
          <button class="ad-btn ad-btn--primary ad-btn--sm" data-x="prodnew" data-cat="${esc(c.id)}">+ Product</button>
        </span>
      </div>
      <div class="ad-catrow__body">
        <table class="ad-prodtable">
          <thead><tr>
            <th style="width:2rem"></th>
            <th style="width:4rem">Photo</th>
            <th>Name</th>
            <th>Price</th>
            <th></th>
          </tr></thead>
          <tbody data-cattbody="${esc(c.id)}">${prodRows(c.id)}</tbody>
        </table>
      </div>
    </div>`;
  }).join('');

  /* products without a matching category */
  const orphanCids = Object.keys(catMap).filter(cid => !allCats.find(c => c.id === cid) && (catMap[cid] || []).length);
  const orphanRows = orphanCids.flatMap(cid => catMap[cid]).filter(r => !f ||
    (r.data.name || '').toLowerCase().includes(f) || r.id.includes(f));
  const orphanSection = orphanRows.length ? `
    <div class="ad-catrow" data-cid="__orphan__">
      <div class="ad-catrow__head">
        <span class="ad-catrow__icon" aria-hidden="true"><span style="opacity:.25">?</span></span>
        <span class="ad-catrow__name">Uncategorised</span>
        <span class="ad-catrow__count">${orphanRows.length}</span>
        <span class="ad-catrow__btns"></span>
      </div>
      <div class="ad-catrow__body">
        <table class="ad-prodtable"><thead><tr>
          <th style="width:2rem"></th><th style="width:4rem">Photo</th>
          <th>Name</th><th>Price</th><th></th>
        </tr></thead>
        <tbody>${orphanRows.map(r => {
          const p = r.data;
          return `<tr data-pid="${esc(r.id)}" data-cat="">
            <td class="ad-drag-handle">⠇</td>
            <td><div class="ad-prodthumb-wrap"><div class="ad-prodthumb">${thumbHtml(r)}</div></div></td>
            <td>${esc(p.name || r.id)}</td>
            <td>${p.quote ? '<span class="ad-pill ad-pill--clay">quoted</span>' : esc(p.price ? '₹' + p.price : '—')}</td>
            <td>
              ${productUpserts.has(r.id) ? '<span class="ad-pill ad-pill--staged" style="margin-right:.3rem">not published</span>' : ''}
              <button class="ad-o__more" data-x="prodedit" data-pid="${esc(r.id)}">Edit</button>
            </td>
          </tr>`;
        }).join('')}</tbody>
        </table>
      </div>
    </div>` : '';

  box.innerHTML = `
    <div class="ad-head">
      <div><h2>Products</h2><p>${PRODUCTS.length} in the database. The shop reads these; the files are the fallback.</p></div>
      <div class="ad-btns" style="margin:0">
        <label class="ad-search"><input type="search" id="prodFilter" value="${esc(filter)}" placeholder="Filter…"></label>
        <button class="ad-btn ad-btn--ghost" data-x="catadd">+ Category</button>
        <button class="ad-btn ad-btn--ghost" data-x="xlsxout">↓ Export</button>
        <button class="ad-btn ad-btn--ghost" data-x="xlsxinprod">↑ Import</button>
        <input type="file" id="xlsxFileProd" accept=".xlsx,.xls,.csv" hidden>
        <button class="ad-btn ad-btn--primary" data-x="prodnew" data-cat="">+ Product</button>
      </div>
    </div>

    <div class="ad-card">
      <h3>Line-up</h3>
      <p class="ad-p">The order the shop leads with. Chosen products come first, in this order,
        everywhere — the homepage rails, the shop grid, categories and search. Everything else
        follows behind unless you tick <i>only these</i>. Pick an occasion to give that week its
        own line-up; the everyday one takes over again when it ends.</p>
      <div id="lineupBox"></div>
    </div>

    ${!PRODUCTS.length ? `<div class="ad-card">
      <h3>Start from what you already have</h3>
      <p class="ad-p">The database is empty, so the shop is showing the ${(window.PRODUCTS || []).length} placeholder
        products from the files. Copy them in, then edit them into your real catalogue — it is far quicker
        than typing thirty products from scratch.</p>
      <button class="ad-btn ad-btn--primary" data-x="seed">Copy the file catalogue in</button>
    </div>` : ''}

    <div id="catRowsWrap">
      ${catRows}
      ${orphanSection}
      ${!allCats.length && !orphanRows.length ? '<div class="ad-card"><p class="ad-empty">No categories yet. Add one to organise your products.</p></div>' : ''}
    </div>`;

  wireProducts();
}

/* wire drag-to-reorder on product rows */
function wireProducts() {
  let dragSrc = null;

  $$('[data-cattbody]').forEach(tbody => {
    tbody.addEventListener('dragstart', e => {
      const row = e.target.closest('tr[data-pid]');
      if (!row) return;
      dragSrc = row;
      row.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
    });
    tbody.addEventListener('dragend', e => {
      const row = e.target.closest('tr[data-pid]');
      if (row) row.style.opacity = '';
      dragSrc = null;
    });
    tbody.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const row = e.target.closest('tr[data-pid]');
      if (row && dragSrc && row !== dragSrc) {
        const rect = row.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) tbody.insertBefore(dragSrc, row);
        else tbody.insertBefore(dragSrc, row.nextSibling);
      }
    });
    tbody.addEventListener('drop', async e => {
      e.preventDefault();
      if (!dragSrc) return;
      const rows = [...tbody.querySelectorAll('tr[data-pid]')];
      const updates = rows.map((tr, i) => ({ id: tr.dataset.pid, sort: i }));
      updates.forEach(u => {
        const r = PRODUCTS.find(p => p.id === u.id);
        if (r) r.sort = u.sort;
      });
      try {
        await CLOUD.upsert('products', updates.map(u => ({ id: u.id, sort: u.sort })));
        toast('Order saved');
      } catch (err) {
        toast('Could not save order: ' + err.message);
      }
      dragSrc.style.opacity = '';
      dragSrc = null;
    });
  });

  /* wire the in-pane xlsx file input */
  const fp = $('#xlsxFileProd');
  if (fp && !fp.dataset.wired) {
    fp.dataset.wired = '1';
    fp.addEventListener('change', e => {
      const f = e.target.files[0]; e.target.value = '';
      if (f) importSheet(f);
    });
  }
}

const catName = id => (CATS.find(c => c.id === id) || (window.CATEGORIES || []).find(c => c.id === id) || {}).name || id || '—';

/* ---------- the line-up ----------------------------------
   Which products lead the shop, and in what order — for every
   day, or for one occasion. Stored in the settings patch, so
   it reaches the shop with Publish like any other setting.    */
let lineFor = '';           /* '' = every day, otherwise an occasion id */

const A = () => window.ADMIN;

function lineRead() {
  if (!A()) return { picks: [], only: false };
  if (!lineFor) return { picks: A().getS('lineup.picks', []) || [], only: !!A().getS('lineup.only', false) };
  const p = A().occPatch(lineFor);
  const base = window.OCCASIONS.find(o => o.id === lineFor) || {};
  return { picks: (p.picks || base.picks || []).slice(), only: p.picksOnly !== undefined ? !!p.picksOnly : !!base.picksOnly };
}

function lineWrite(picks, only) {
  if (!A()) return;
  if (!lineFor) { A().setS('lineup.picks', picks); A().setS('lineup.only', only); }
  else {
    const p = A().occPatch(lineFor);
    p.picks = picks; p.picksOnly = only;
    A().mark();
  }
  paintLineup();
}

/* every product the shop knows about, database first */
function everyProduct() {
  if (PRODUCTS.length) return PRODUCTS.map(r => ({ id: r.id, name: r.data.name || r.id }));
  return (window.PRODUCTS || []).map(p => ({ id: p.id, name: p.name }));
}

function paintLineup() {
  const box = $('#lineupBox');
  if (!box || !A()) return;
  const all = everyProduct();
  const { picks, only } = lineRead();
  const name = id => (all.find(p => p.id === id) || {}).name || id + ' (gone)';
  const occs = A().occasions();
  const left = all.filter(p => !picks.includes(p.id));

  box.innerHTML = `
    <div class="ad-lineup__bar">
      <label class="ad-field" style="margin:0;min-width:15rem">
        <span>Arranging for</span>
        <select id="lineFor">
          <option value=""${lineFor ? '' : ' selected'}>Every day — when no occasion is running</option>
          ${occs.map(o => `<option value="${esc(o.id)}"${lineFor === o.id ? ' selected' : ''}>
            ${esc(o.name)} — ${esc(A().themeName(o.theme))} look${o.on ? '' : ' (switched off)'}</option>`).join('')}
        </select>
      </label>
      <label class="ad-chk"><input type="checkbox" id="lineOnly"${only ? ' checked' : ''}>
        <i>Show only these products</i></label>
    </div>

    ${picks.length ? `<ol class="ad-lineup">
      ${picks.map((id, i) => `<li data-li="${i}">
        <b>${i + 1}</b><span>${esc(name(id))}</span>
        <button class="ad-o__more" data-x="lnup"${i ? '' : ' disabled'} title="Up">&uarr;</button>
        <button class="ad-o__more" data-x="lndown"${i === picks.length - 1 ? ' disabled' : ''} title="Down">&darr;</button>
        <button class="ad-o__more ad-o__more--warn" data-x="lndel" title="Remove">&times;</button>
      </li>`).join('')}
    </ol>` : `<p class="ad-empty">Nothing chosen${lineFor ? ' for this one' : ''} — the shop shows everything in its usual order.</p>`}

    ${left.length ? `<div class="ad-lineup__add">
      <select id="lineAdd"><option value="">Add a product…</option>
        ${left.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select>
      <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="lnadd">Add</button>
      ${picks.length ? `<button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="lnclear">Clear the list</button>` : ''}
    </div>` : ''}`;
}

/* ---------- one product ---------------------------------- */
const TAGS = ['new', 'bestseller', 'trending', 'limited', 'personalised', 'madeinindia', 'gift', 'festival', 'quirky'];
const VARIANT_STATUSES = ['available', 'out-of-stock', 'made-to-order', 'coming-soon', 'hidden'];

function productForm(r) {
  const p = r.data || {};
  const d = p.details || {};
  const sp = p.specs || {};
  const arts = Object.keys(window.ART || {});
  const has = t => (p.tags || []).includes(t);
  const bo = p.bulkOptions || {};

  return `
  <div class="ad-pe-split">
  <div class="ad-pe-form">
  <div class="ad-cards">
    <div class="ad-card">
      <h3>The basics</h3>
      <label class="ad-field"><span>Name</span><input id="f_name" value="${esc(p.name)}"></label>
      <label class="ad-field"><span>Category</span><select id="f_cat">
        ${(CATS.length ? CATS : window.CATEGORIES).map(c =>
          `<option value="${esc(c.id)}"${p.cat === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}
      </select></label>
      <div class="ad-grid3">
        <label class="ad-field"><span>Base price (₹)</span><input id="f_price" type="number" min="0" value="${p.price ?? 0}"></label>
        <label class="ad-field"><span>Was (optional)</span><input id="f_was" type="number" min="0" value="${p.was ?? ''}"></label>
        <label class="ad-field"><span>Sort order</span><input id="f_sort" type="number" value="${r.sort ?? 0}"></label>
      </div>
      <label class="ad-field"><span>One-line description</span><textarea id="f_blurb" rows="2">${esc(p.blurb)}</textarea></label>
      <label class="ad-field" style="margin-bottom:0"><span>Story (optional)</span><textarea id="f_story" rows="2">${esc(p.story)}</textarea></label>
    </div>

    <div class="ad-card">
      <h3>How it shows up</h3>
      <label class="ad-field"><span>Drawn art</span><select id="f_art">
        ${arts.map(k => `<option value="${k}"${p.artKey === k ? ' selected' : ''}>${k}</option>`).join('')}
      </select><i class="ad-hint">Used when there are no photos.</i></label>
      <div class="ad-field"><span>Badges and rails</span>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${TAGS.map(t => `<label class="ad-pill" style="cursor:pointer">
            <input type="checkbox" data-tag="${t}"${has(t) ? ' checked' : ''}> ${t}</label>`).join('')}
        </div>
      </div>
      <div class="ad-grid3">
        <label class="ad-row--switch" style="margin:0"><input type="checkbox" id="f_bulk"${p.bulk ? ' checked' : ''}><span><b>Bulk pricing</b></span></label>
        <label class="ad-row--switch" style="margin:0"><input type="checkbox" id="f_quote"${p.quote ? ' checked' : ''}><span><b>Quote only</b></span></label>
        <label class="ad-row--switch" style="margin:0"><input type="checkbox" id="f_hidden"${r.hidden ? ' checked' : ''}><span><b>Hide</b></span></label>
      </div>
    </div>
  </div>

  <div class="ad-card">
    <h3>Product images</h3>
    <p class="ad-p">Upload multiple photos — they show in the gallery. First image is the primary. Adding images per option/variant below overrides these on a per-colour basis.</p>
    <div id="prodGallery" class="ad-gallery"></div>
    <div class="ad-up" data-gallerydrop="product">
      <input type="file" id="f_galfile" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden>
      <button type="button" class="ad-btn ad-btn--ghost ad-btn--sm" data-x="galpick" data-gal="product">+ Add Images</button>
      <span class="ad-hint" id="f_galmsg">or drag images here</span>
    </div>
  </div>

  <div class="ad-cards">
    <div class="ad-card">
      <h3>Specs on the card</h3>
      <div class="ad-grid3">
        <label class="ad-field"><span>Material</span><input id="s_Material" value="${esc(sp.Material)}"></label>
        <label class="ad-field"><span>Layer</span><input id="s_Layer" value="${esc(sp.Layer)}"></label>
        <label class="ad-field" style="margin-bottom:0"><span>Print time</span><input id="s_Print" value="${esc(sp.Print)}"></label>
      </div>
    </div>
    <div class="ad-card">
      <h3>3D model</h3>
      <p class="ad-p">Product-level model. You can also add variant-specific models in the matrix below.</p>
      <label class="ad-field"><span>File URL or Supabase path</span><input id="f_model3d" value="${esc(p.model3d?.url || '')}" placeholder="https://… or storage path"></label>
      <div class="ad-grid3">
        <label class="ad-field"><span>File name</span><input id="f_modelname" value="${esc(p.model3d?.name || '')}"></label>
        <label class="ad-field"><span>Type</span><input id="f_modeltype" value="${esc(p.model3d?.type || '')}" placeholder="3MF, STL, OBJ"></label>
        <label class="ad-field" style="margin-bottom:0"><span>Size (MB)</span><input id="f_modelsize" type="number" min="0" step="0.1" value="${p.model3d?.size || ''}"></label>
      </div>
    </div>
  </div>

  <div class="ad-card">
    <h3>Variants &amp; pricing</h3>
    <p class="ad-p" style="margin-bottom:.8rem">Add options like Colour or Size. The price table builds itself.</p>
    <div id="optionsList"></div>
    <div class="ad-var-addrow">
      <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="optadd" data-preset="Colour" data-ptype="colour">+ Colour</button>
      <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="optadd" data-preset="Size" data-ptype="text">+ Size</button>
      <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="optadd" data-preset="Material" data-ptype="text">+ Material</button>
      <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="optadd" data-preset="" data-ptype="text">+ Custom</button>
    </div>
    <div id="varMatrixList" style="margin-top:1rem"></div>

    <details class="ad-pe-details" style="margin-top:1.2rem" open>
      <summary>Dimensions</summary>
      <div class="ad-pe-details__body">
        <p class="ad-p" style="margin-bottom:.7rem">Add one row per size or variant. Label is optional (e.g. "Small", "Box only").</p>
        <div id="dimsList"></div>
        <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="dimadd" style="margin-top:.6rem">+ Add dimension</button>
      </div>
    </details>

    <details class="ad-pe-details">
      <summary>Purchase options</summary>
      <div class="ad-pe-details__body">
        <div class="ad-grid3" style="margin-bottom:.9rem">
          <label class="ad-row--switch" style="margin:0"><input type="checkbox" id="bo_individual"${bo.individual !== false ? ' checked' : ''}><span><b>Individual</b><i>Single-unit buying</i></span></label>
          <label class="ad-row--switch" style="margin:0"><input type="checkbox" id="bo_bulk"${bo.bulk ? ' checked' : ''}><span><b>Bulk</b><i>Qty-based pricing</i></span></label>
          <label class="ad-row--switch" style="margin:0"><input type="checkbox" id="bo_enquiry"${bo.enquiry ? ' checked' : ''}><span><b>Bulk enquiry</b><i>Large order form</i></span></label>
        </div>
        <div id="bulkPricingBlock"${bo.bulk ? '' : ' hidden'}>
          <div class="ad-grid3">
            <label class="ad-field"><span>Min bulk qty</span><input id="bo_min" type="number" min="1" value="${bo.bulkMin || 10}"></label>
            <label class="ad-row--switch" style="margin:0;align-self:end"><input type="checkbox" id="bo_combined"${bo.bulkCombined ? ' checked' : ''}><span><b>Combined qty</b><i>All variants count together</i></span></label>
          </div>
          <div id="bulkTierList"></div>
          <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="btadd" style="margin-top:.7rem">+ Add tier</button>
        </div>
      </div>
    </details>

    <details class="ad-pe-details">
      <summary>What the customer fills in</summary>
      <div class="ad-pe-details__body">
        <p class="ad-p">Text, dropdowns, colour picker or file upload.</p>
        <div id="custList" class="ad-occ"></div>
        <div class="ad-btns" style="margin-top:.9rem">
          ${Object.entries(window.CUSTOM.TYPES).map(([t, n]) =>
            `<button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="cuadd" data-type="${t}">+ ${n}</button>`).join('')}
        </div>
      </div>
    </details>

    <details class="ad-pe-details">
      <summary>Product details (shown on page)</summary>
      <div class="ad-pe-details__body">
        <label class="ad-field"><span>Materials</span><textarea id="d_materials" rows="2">${esc(d.materials)}</textarea></label>
        <label class="ad-field"><span>Care</span><textarea id="d_care" rows="2">${esc(d.care)}</textarea></label>
        <label class="ad-field"><span>Production</span><textarea id="d_production" rows="2">${esc(d.production)}</textarea></label>
        <label class="ad-field" style="margin-bottom:0"><span>Shipping</span><textarea id="d_shipping" rows="2">${esc(d.shipping)}</textarea></label>
      </div>
    </details>
  </div>

  </div><!-- /ad-pe-form -->
  <div class="ad-pe-preview" id="ad-pe-preview">
    <div class="ad-pe-preview__label">Live preview</div>
    <div id="prod-preview"></div>
  </div>
  </div><!-- /ad-pe-split -->`;
}

/* ---------- new draft state variables --------------------- */
let optionsDraft = [];       /* [{name, type, values:[{k,label,hex?,images:[]}]}] */
let matrixDraft  = [];       /* [{combo:{}, price, was, sku, stock, status, processingTime, images:[]}] */
let productImagesDraft = []; /* [url, ...] */
let model3dDraft = {};       /* {url, name, type, size} */
let bulkTiersDraft = [];     /* [{min, max, off}] */
let custDraft = [];
let dimsDraft = [];          /* [{label, L, B, H, sizePreset}] */

const num = (x, d = 0) => (x === '' || x === null || x === undefined || isNaN(+x) ? d : +x);

function paintProductGallery() {
  const box = $('#prodGallery'); if (!box) return;
  if (!productImagesDraft.length) {
    box.innerHTML = '<p class="ad-empty">No images yet. Use the button below to add some.</p>';
    return;
  }
  box.innerHTML = productImagesDraft.map((url, i) => `
    <div class="ad-gallery__item" data-pgi="${i}">
      <img src="${esc(url)}" alt="">
      ${i === 0 ? '<span class="ad-gallery__primary">Primary</span>' : ''}
      <div class="ad-gallery__actions">
        ${i > 0 ? `<button type="button" class="ad-gallery__btn" data-x="pgmovefirst" data-i="${i}" title="Set as primary">★</button>` : ''}
        <button type="button" class="ad-gallery__btn ad-gallery__btn--del" data-x="pgdel" data-i="${i}" title="Remove">&times;</button>
      </div>
    </div>`).join('');
}

/* a stable key: uppercase, no punctuation, 6 chars max */
function vkey(label, i) {
  const k = String(label || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return k || 'V' + (i + 1);
}

function paintOptions() {
  const box = $('#optionsList'); if (!box) return;
  if (!optionsDraft.length) { box.innerHTML = ''; return; }
  box.innerHTML = optionsDraft.map((opt, oi) => `
    <div class="ad-varopt" data-oi="${oi}">
      <div class="ad-varopt__head">
        <input class="ad-varopt__name" data-opf="name" data-oi="${oi}" value="${esc(opt.name)}" placeholder="Option name">
        <select class="ad-varopt__type" data-opf="type" data-oi="${oi}">
          <option value="colour"${opt.type === 'colour' ? ' selected' : ''}>Colour</option>
          <option value="text"${opt.type === 'text' ? ' selected' : ''}>Text</option>
        </select>
        <button type="button" class="ad-varopt__del" data-x="optdel" data-oi="${oi}" title="Remove option">&times;</button>
      </div>
      <div class="ad-varopt__chips">
        ${(opt.values || []).map((val, vi) => `
          <span class="ad-vchip" data-oi="${oi}" data-vi="${vi}">
            ${opt.type === 'colour' ? `<input type="color" class="ad-vchip__swatch" data-valf="hex" data-oi="${oi}" data-vi="${vi}" value="${esc(val.hex || '#cccccc')}" title="${esc(val.label)}">` : ''}
            <span class="ad-vchip__label">${esc(val.label)}</span>
            <button type="button" class="ad-vchip__del" data-x="valdel" data-oi="${oi}" data-vi="${vi}" title="Remove">&times;</button>
          </span>`).join('')}
        <input class="ad-vchip__input" data-oi="${oi}" placeholder="Type and press Enter" data-x="valinput">
      </div>
    </div>`).join('');

  /* wire Enter/comma on the chip inputs */
  box.querySelectorAll('.ad-vchip__input').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ',') return;
      e.preventDefault();
      const label = inp.value.replace(',', '').trim();
      if (!label) return;
      const oi = +inp.dataset.oi;
      const opt = optionsDraft[oi]; if (!opt) return;
      const vi = (opt.values || []).length;
      opt.values = opt.values || [];
      opt.values.push({ k: vkey(label, vi), label,
        ...(opt.type === 'colour' ? { hex: '#cccccc' } : {}) });
      inp.value = '';
      paintOptions();
      rebuildMatrixFromOptions();
      paintVariantMatrix();
      paintPreview();
    });
  });
}

function loadVariantDrafts(p) {
  const copy = a => JSON.parse(JSON.stringify(a || []));
  const v = (p && p.variants) || {};
  optionsDraft = copy(v.options || []);
  matrixDraft = copy(p && p.variantMatrix || []);
  productImagesDraft = copy(p && p.productImages || (p && p.photo ? [p.photo] : []));
  model3dDraft = JSON.parse(JSON.stringify(p && p.model3d || {}));
  bulkTiersDraft = copy(p && p.bulkOptions?.tiers || []);
  custDraft = copy(p && p.custom || []);
  const d = (p && p.details) || {};
  if (d.dims && d.dims.length) {
    dimsDraft = copy(d.dims);
  } else if (d.dimL != null || d.dimB != null || d.dimH != null || d.sizePreset) {
    /* migrate old single-row format */
    dimsDraft = [{ label: d.sizePreset || '', L: d.dimL ?? '', B: d.dimB ?? '', H: d.dimH ?? '' }];
  } else {
    dimsDraft = [];
  }
}

function rebuildMatrixFromOptions() {
  /* generate the cartesian product of option values */
  const opts = optionsDraft.filter(o => (o.values || []).length);
  if (!opts.length) { matrixDraft = []; return; }
  let combos = [{}];
  for (const opt of opts) {
    const next = [];
    for (const combo of combos) {
      for (const val of opt.values) {
        next.push({ ...combo, [opt.name]: val.k || vkey(val.label, 0) });
      }
    }
    combos = next;
  }
  /* preserve existing data for matching combos */
  const existing = new Map(matrixDraft.map(e => [JSON.stringify(e.combo), e]));
  matrixDraft = combos.map(combo => {
    const old = existing.get(JSON.stringify(combo)) || {};
    return { combo, price: old.price ?? '', was: old.was ?? '',
             sku: old.sku || '', stock: old.stock ?? '',
             status: old.status || 'available',
             processingTime: old.processingTime || '',
             images: old.images || [] };
  });
}

function paintVariantMatrix() {
  const box = $('#varMatrixList'); if (!box) return;
  if (!matrixDraft.length) { box.innerHTML = ''; return; }
  const opts = optionsDraft.filter(o => (o.values || []).length);
  const comboLabel = combo => {
    return opts.map(o => {
      const k = combo[o.name];
      const val = (o.values || []).find(v => (v.k || vkey(v.label, 0)) === k);
      return val ? val.label : k;
    }).join(' / ');
  };
  box.innerHTML = `
    <table class="ad-vmx-table">
      <thead><tr>
        <th>Variant</th><th>Price ₹</th><th>Was ₹</th><th>Stock</th><th>Status</th>
      </tr></thead>
      <tbody>
        ${matrixDraft.map((row, i) => `
          <tr data-mxi="${i}">
            <td class="ad-vmx-table__label">${esc(comboLabel(row.combo))}</td>
            <td><input data-mxf="price" type="number" min="0" step="10" value="${row.price !== '' ? row.price : ''}" placeholder="₹0"></td>
            <td><input data-mxf="was" type="number" min="0" step="10" value="${row.was !== '' ? row.was : ''}" placeholder="—"></td>
            <td><input data-mxf="stock" type="number" min="0" value="${row.stock !== '' ? row.stock : ''}" placeholder="∞"></td>
            <td><select data-mxf="status">
              ${VARIANT_STATUSES.map(s => `<option value="${s}"${row.status === s ? ' selected' : ''}>${s}</option>`).join('')}
            </select></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function paintDims() {
  const box = $('#dimsList'); if (!box) return;
  if (!dimsDraft.length) { box.innerHTML = ''; return; }
  const SIZE_PRESETS = ['', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'One size'];
  box.innerHTML = `
    <table class="ad-dims-table">
      <thead><tr>
        <th>Label / size</th><th>L (mm)</th><th>B (mm)</th><th>H (mm)</th><th></th>
      </tr></thead>
      <tbody>
        ${dimsDraft.map((row, i) => `
          <tr data-di="${i}">
            <td><input data-dmf="label" type="text" value="${esc(row.label ?? '')}" placeholder="e.g. Small"></td>
            <td><input data-dmf="L" type="number" min="0" step="0.1" value="${row.L ?? ''}"></td>
            <td><input data-dmf="B" type="number" min="0" step="0.1" value="${row.B ?? ''}"></td>
            <td><input data-dmf="H" type="number" min="0" step="0.1" value="${row.H ?? ''}"></td>
            <td><button type="button" class="ad-varopt__del" data-x="dimdel" data-di="${i}" title="Remove">&times;</button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function paintBulkTiers() {
  const box = $('#bulkTierList'); if (!box) return;
  if (!bulkTiersDraft.length) {
    box.innerHTML = '<p class="ad-empty">No tiers. Add a tier to set a discount at a quantity break.</p>';
    return;
  }
  box.innerHTML = `
    <div class="ad-vgrid ad-vgrid--bt ad-vgrid--head">
      <span>Min qty</span><span>Max qty</span><span>Discount %</span><span></span>
    </div>
    ${bulkTiersDraft.map((t, i) => `
      <div class="ad-vgrid ad-vgrid--bt" data-bti="${i}">
        <input data-btf="min" type="number" min="1" value="${t.min ?? ''}">
        <input data-btf="max" type="number" min="1" value="${t.max ?? ''}" placeholder="no limit">
        <input data-btf="off" type="number" min="0" max="100" step="1" value="${t.off ?? ''}">
        <button class="ad-o__more ad-o__more--warn" data-x="btdel" data-i="${i}">&times;</button>
      </div>`).join('')}`;
}

function paintCustom() {
  const box = $('#custList'); if (!box) return;
  if (!custDraft.length) {
    box.innerHTML = '<p class="ad-empty">No options yet. This product is sold as it is shown.</p>';
    return;
  }
  box.innerHTML = custDraft.map((f, i) => `
    <div class="ad-o on" data-cui="${i}">
      <div class="ad-o__bar">
        <span class="ad-pill ad-pill--clay">${esc(window.CUSTOM.TYPES[f.type] || f.type)}</span>
        <span class="ad-o__name">${esc(f.label || 'Untitled option')}</span>
        ${f.required ? '<span class="ad-pill ad-pill--need">required</span>' : ''}
        <button class="ad-o__more" data-x="cuup" ${i === 0 ? 'disabled' : ''}>&uarr;</button>
        <button class="ad-o__more" data-x="cudown" ${i === custDraft.length - 1 ? 'disabled' : ''}>&darr;</button>
        <button class="ad-o__more" data-x="cudel">Remove</button>
      </div>
      <div class="ad-o__body" style="display:grid">
        <div class="ad-grid3">
          <label class="ad-field" style="margin:0"><span>What you ask for</span>
            <input data-cuf="label" data-i="${i}" value="${esc(f.label)}" placeholder="Name to print"></label>
          ${f.type === 'text' || f.type === 'textarea' ? `
            <label class="ad-field" style="margin:0"><span>Character limit</span>
              <input type="number" min="1" data-cuf="max" data-i="${i}" value="${f.max || 24}"></label>
            <label class="ad-field" style="margin:0"><span>Example to show</span>
              <input data-cuf="placeholder" data-i="${i}" value="${esc(f.placeholder)}" placeholder="e.g. Aarohi"></label>` : ''}
          ${f.type === 'select' ? `
            <label class="ad-field" style="margin:0;grid-column:span 2"><span>Choices, separated by commas</span>
              <input data-cuf="options" data-i="${i}" value="${esc((f.options || []).join(', '))}"
                     placeholder="Serif, Rounded, Block"></label>` : ''}
          ${f.type === 'colour' ? `
            <label class="ad-field" style="margin:0"><span>Starting colour</span>
              <input type="color" data-cuf="value" data-i="${i}" value="${esc(f.value || '#ff9fc4')}"></label>` : ''}
        </div>
        <label class="ad-field" style="margin:0"><span>Helper note under the field</span>
          <input data-cuf="hint" data-i="${i}" value="${esc(f.hint)}"
                 placeholder="${f.type === 'image' ? 'PNG or SVG. A plain background prints best.' : 'Optional'}"></label>
        <label class="ad-row--switch" style="margin:0">
          <input type="checkbox" data-cuf="required" data-i="${i}" ${f.required ? 'checked' : ''}>
          <span><b>They must fill this in</b><i>Adding to the basket is blocked until they do.</i></span></label>
      </div>
    </div>`).join('');
}

function paintPreview() {
  const box = $('#prod-preview'); if (!box || !editing) return;
  const data = readForm(editing);
  /* mini product object that looks like a shop product */
  const p = {
    id: editing.id || 'preview',
    ...data,
    /* fromPrice scans variantMatrix for cheapest; provide a shim */
    variantMatrix: data.variantMatrix || [],
    variants: data.variants || {},
  };
  /* card preview */
  const cardHtml = typeof window.V?.card === 'function' ? window.V.card(p) :
    `<div class="ad-preview-card">
      <div class="ad-preview-card__art">${
        productImagesDraft.length
          ? `<img src="${esc(productImagesDraft[0])}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`
          : `<div style="width:100%;height:100%;background:var(--c-surface);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--c-muted);font-size:.8rem">No image</div>`
      }</div>
      <div class="ad-preview-card__body">
        <span class="ad-preview-card__cat">${esc((CATS.find(c => c.id === data.cat) || {}).name || '')}</span>
        <b class="ad-preview-card__name">${esc(data.name || 'Product name')}</b>
        <p class="ad-preview-card__blurb">${esc(data.blurb || '')}</p>
        ${(() => {
          const opts = (data.variants?.options || []);
          const col = opts.find(o => o.type === 'colour');
          if (!col) return '';
          return `<div class="ad-preview-swatches">${
            (col.values || []).slice(0, 5).map(v =>
              `<i style="background:${esc(v.hex || '#ccc')};width:14px;height:14px;border-radius:50%;display:inline-block;border:1px solid #ccc"></i>`
            ).join('')}${(col.values||[]).length > 5 ? `<span style="font-size:.75rem;color:var(--c-muted)">+${col.values.length-5}</span>` : ''}
          </div>`;
        })()}
        <div class="ad-preview-card__price">
          ${(() => {
            /* show from-price if variants have different prices */
            const prices = (data.variantMatrix || []).map(r => r.price).filter(x => x != null && x !== '');
            const base = data.price || 0;
            const min = prices.length ? Math.min(...prices.map(Number)) : base;
            const show = prices.length && min < base ? min : base;
            const prefix = prices.length && min < base ? 'From ' : '';
            const was = !prices.length && data.was;
            return `<b>₹${show}${prefix !== '' ? '' : ''}</b>${prefix ? `<small>${prefix}₹${show}</small>`.replace('<b>','') : ''}${was ? `<s style="color:var(--c-muted);font-size:.8rem;margin-left:.3rem">₹${was}</s>` : ''}`;
          })()}
        </div>
      </div>
    </div>`;

  /* accordion sections as they appear on the product page */
  const d = data.details || {};
  const dimsArr = d.dims && d.dims.length ? d.dims : [];
  const dimStr = dimsArr.map(row => {
    const parts = [row.L && `L ${row.L} mm`, row.B && `B ${row.B} mm`, row.H && `H ${row.H} mm`].filter(Boolean);
    return (row.label ? row.label + ': ' : '') + parts.join(' × ');
  }).filter(Boolean).join('\n');
  const rows = [
    ['Description', [data.blurb, data.story].filter(Boolean).join(' ')],
    ['Materials', d.materials],
    ['Dimensions', dimStr],
    ['Care', d.care],
    ['Production', d.production],
    ['Shipping & returns', d.shipping],
  ].filter(([, v]) => (v || '').toString().trim());

  const specsHtml = (() => {
    const sp = data.specs || {};
    const bits = [sp.Material, sp.Layer, sp.Print].filter(Boolean);
    if (!bits.length) return '';
    return `<div class="ad-preview-specs">${bits.join(' &nbsp;·&nbsp; ')}</div>`;
  })();

  box.innerHTML = `
    <div class="ad-preview-wrap">
      ${cardHtml}
      ${specsHtml}
      ${rows.length ? `<div class="ad-preview-acc">${rows.map(([t, b], i) =>
        `<details${i === 0 ? ' open' : ''}><summary>${esc(t)}</summary><div>${esc(b)}</div></details>`).join('')}
      </div>` : ''}
    </div>`;
}

function readForm(r) {
  const g = id => $('#' + id)?.value.trim() ?? '';
  const n = id => { const v = $('#' + id)?.value; return v === '' || v == null ? null : +v; };
  const on = id => !!$('#' + id)?.checked;

  const name = g('f_name');
  const data = {
    name, cat: g('f_cat'),
    price: n('f_price') ?? 0,
    blurb: g('f_blurb'),
    artKey: g('f_art'),
    tags: $$('[data-tag]').filter(c => c.checked).map(c => c.dataset.tag),
    specs: { Material: g('s_Material'), Layer: g('s_Layer'), Print: g('s_Print') },
    details: { materials: g('d_materials'),
               dims: dimsDraft.filter(row => row.L || row.B || row.H || row.label),
               care: g('d_care'),
               production: g('d_production'), shipping: g('d_shipping') },
    bulk: on('f_bulk'),
    reviews: r.data?.reviews || [],
  };
  if (n('f_was')) data.was = n('f_was');
  if (g('f_story')) data.story = g('f_story');
  if (on('f_quote')) { data.quote = true; data.price = 0; }

  /* options */
  const options = optionsDraft
    .filter(o => (o.name || '').trim() && (o.values || []).length)
    .map(o => ({
      name: o.name.trim(), type: o.type || 'text',
      values: (o.values || []).filter(v => (v.label || '').trim()).map((v, i) => {
        const val = { k: v.k || vkey(v.label, i), label: v.label.trim() };
        if (o.type === 'colour' && v.hex) val.hex = v.hex;
        if ((v.images || []).length) val.images = v.images;
        return val;
      }),
    }));
  if (options.length) data.variants = { options };

  /* variant matrix */
  const matrix = matrixDraft.map(row => {
    const e = { combo: row.combo };
    if (row.price !== '' && row.price != null) e.price = +row.price;
    if (row.was !== '' && row.was != null) e.was = +row.was;
    if (row.sku) e.sku = row.sku;
    if (row.stock !== '' && row.stock != null) e.stock = +row.stock;
    if (row.status && row.status !== 'available') e.status = row.status;
    if (row.processingTime) e.processingTime = row.processingTime;
    if ((row.images || []).length) e.images = row.images;
    return e;
  });
  if (matrix.length) data.variantMatrix = matrix;

  /* product images */
  if (productImagesDraft.length) {
    data.productImages = productImagesDraft;
    data.photo = productImagesDraft[0]; /* keep p.photo for compat */
  }

  /* 3D model */
  const m3url = g('f_model3d');
  if (m3url) {
    data.model3d = { url: m3url, name: g('f_modelname'),
                     type: g('f_modeltype'), size: n('f_modelsize') || null };
  }

  /* bulk options */
  data.bulkOptions = {
    individual: on('bo_individual'),
    bulk: on('bo_bulk'),
    enquiry: on('bo_enquiry'),
    bulkMin: n('bo_min') || 10,
    bulkCombined: on('bo_combined'),
    tiers: bulkTiersDraft.map(t => ({
      min: num(t.min, 0), max: t.max !== '' && t.max != null ? num(t.max) : null, off: num(t.off, 0),
    })),
  };

  const custom = custDraft.filter(f => (f.label || '').trim());
  if (custom.length) data.custom = custom;

  return { id: r.id || slug(name), data, sort: n('f_sort') ?? 0, hidden: on('f_hidden') };
}

/* open the product editor as a full-page panel inside #pane-products */
function openProductModal() {
  if (!editing) return;
  const box = $('#pane-products');
  if (!box) return;
  box.innerHTML = `
    <div class="ad-prodeditor">
      <div class="ad-prodeditor__topbar">
        <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="cancel">← Back</button>
        <h2 style="margin:0;font-size:1.05rem;flex:1">${editing.isNew ? 'New product' : esc((editing.data || {}).name || editing.id)}</h2>
        ${!editing.isNew ? `<button class="ad-btn ad-btn--warn ad-btn--sm" data-x="delete">Delete</button>` : ''}
        <button class="ad-btn ad-btn--primary ad-btn--sm" data-x="save">Save draft</button>
      </div>
      <div class="ad-prodeditor__body">
        ${productForm(editing)}
      </div>
    </div>`;
  setTimeout(() => {
    paintProductGallery();
    wireGalleryInput();
    paintOptions();
    paintVariantMatrix();
    paintBulkTiers();
    paintDims();
    paintCustom();
    paintPreview();
  }, 0);
}

async function saveProduct() {
  const row = readForm(editing);
  if (!row.data.name) { toast('Give it a name first'); return; }
  if (!row.id) { toast('That name does not make a usable id'); return; }

  /* stage the change — written to Supabase on Publish, not immediately */
  productUpserts.set(row.id, row);
  productDeletes.delete(row.id);   /* un-delete if previously staged for deletion */

  /* update local working copy so the pane reflects the draft */
  const existing = PRODUCTS.findIndex(r => r.id === row.id);
  if (existing >= 0) PRODUCTS[existing] = { ...PRODUCTS[existing], ...row };
  else PRODUCTS.push(row);

  editing = null;
  closeModal();
  paintProducts(); paintLineup();
  A().mark();
  toast(`${row.data.name} staged — press Publish to take it live`);
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? It will be removed from the live shop when you Publish.\n\nHiding it instead keeps the record.')) return;

  productDeletes.add(id);
  productUpserts.delete(id);

  PRODUCTS = PRODUCTS.filter(r => r.id !== id);

  editing = null;
  closeModal();
  paintProducts();
  A().mark();
  toast('Deletion staged — press Publish to take it live');
}

/* ---------- orders --------------------------------------- */
const STATUSES = ['new', 'printing', 'packed', 'shipped', 'delivered', 'cancelled'];

async function paintOrders() {
  const box = $('#pane-orders');
  if (!box) return;
  if (!inn()) { box.innerHTML = gate('see orders'); return; }
  box.innerHTML = '<div class="ad-card"><p class="ad-empty">Loading…</p></div>';
  const list = await CLOUD.rows('orders?select=*&order=created_at.desc&limit=200') || [];

  box.innerHTML = `
    <div class="ad-head"><div><h2>Orders</h2>
      <p>${list.length} recorded. Written by the shop when a payment succeeds or a WhatsApp order is sent —
         a record of what was asked for, not proof of payment.</p></div></div>
    ${!list.length ? `<div class="ad-card"><p class="ad-empty">Nothing yet. The next order placed on the
      shop will appear here.</p></div>` : `<div class="ad-occ">${list.map(o => `
      <div class="ad-o on" data-oid="${o.id}">
        <div class="ad-o__bar">
          <span class="ad-o__name">${esc(o.customer?.name || 'No name')}
            <span class="ad-o__when"> · ${esc(o.ref || '')}</span></span>
          <span class="ad-pill ${o.channel === 'razorpay' ? 'ad-pill--live' : 'ad-pill--clay'}">${esc(o.channel)}</span>
          <span class="ad-o__when">${esc(o.totals?.count || 0)} items · ${money(o.totals?.grand)}</span>
          <span class="ad-o__when">${when(o.created_at)}</span>
          <select data-ostatus="${o.id}" class="ad-o__more" style="padding:6px 10px">
            ${STATUSES.map(s => `<option${o.status === s ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="ad-o__more" data-x="oexpand">Details</button>
        </div>
        <div class="ad-o__body">
          <div class="ad-list">
            ${(o.items || []).map(i => `<div><b>${esc(i.name)} × ${i.qty}</b><span>${esc(i.variant || '')}
              ${i.note ? '· ' + esc(i.note) : ''} · ${money(i.total)}</span></div>`).join('')}
            <div><b>Phone</b><span>${esc(o.customer?.phone)}</span></div>
            ${o.customer?.email ? `<div><b>Email</b><span>${esc(o.customer.email)}</span></div>` : ''}
            ${o.customer?.address ? `<div><b>Address</b><span>${esc(o.customer.address)},
              ${esc(o.customer.city)} ${esc(o.customer.pin)}, ${esc(o.customer.state)}</span></div>` : ''}
            ${o.customer?.notes ? `<div><b>Notes</b><span>${esc(o.customer.notes)}</span></div>` : ''}
            ${o.payment_id ? `<div><b>Payment id</b><span><code>${esc(o.payment_id)}</code></span></div>` : ''}
          </div>
        </div>
      </div>`).join('')}</div>`}`;
}

/* ---------- custom print requests ------------------------ */
async function paintRequests() {
  const box = $('#pane-requests');
  if (!box) return;
  if (!inn()) { box.innerHTML = gate('see customer requests'); return; }
  box.innerHTML = '<div class="ad-card"><p class="ad-empty">Loading…</p></div>';
  const list = await CLOUD.rows('requests?select=*&order=created_at.desc&limit=200') || [];
  const KINDS = { image: 'Design upload', stl: '3D file', link: 'MakerWorld', idea: 'An idea' };
  const RS = ['new', 'reviewing', 'quoted', 'approved', 'printing', 'completed', 'rejected'];

  box.innerHTML = `
    <div class="ad-head"><div><h2>Customer requests</h2>
      <p>${list.length} from the Custom Print page. The file itself arrives on WhatsApp — this is everything
         that came with it.</p></div></div>
    ${!list.length ? `<div class="ad-card"><p class="ad-empty">Nothing yet.</p></div>`
    : `<div class="ad-occ">${list.map(q => `
      <div class="ad-o on" data-qid="${q.id}">
        <div class="ad-o__bar">
          <span class="ad-o__name">${esc(q.customer?.name || 'No name')}
            <span class="ad-o__when"> · ${esc(q.ref || '')}</span></span>
          <span class="ad-pill ad-pill--clay">${esc(KINDS[q.kind] || q.kind)}</span>
          <span class="ad-o__when">${when(q.created_at)}</span>
          <select data-qstatus="${q.id}" class="ad-o__more" style="padding:6px 10px">
            ${RS.map(s => `<option${q.status === s ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="ad-o__more" data-x="qexpand">Details</button>
        </div>
        <div class="ad-o__body"><div class="ad-list">
          ${Object.entries(q.detail || {}).filter(([, v]) => v)
            .map(([k, v]) => `<div><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}
          <div><b>Phone</b><span>${esc(q.customer?.phone)}</span></div>
          ${q.customer?.email ? `<div><b>Email</b><span>${esc(q.customer.email)}</span></div>` : ''}
        </div></div>
      </div>`).join('')}</div>`}`;
}

/* ---------- reviews -------------------------------------- */
async function paintReviews() {
  const box = $('#pane-reviews');
  if (!box) return;
  if (!inn()) { box.innerHTML = gate('manage reviews'); return; }
  box.innerHTML = '<div class="ad-card"><p class="ad-empty">Loading…</p></div>';
  const list = await CLOUD.rows('reviews?select=*&order=created_at.desc&limit=200') || [];

  box.innerHTML = `
    <div class="ad-head"><div><h2>Reviews</h2>
      <p>Add the words customers actually send you. Nothing is invented and nothing shows on the shop
         until you publish it.</p></div></div>

    <div class="ad-card">
      <h3>Add one</h3>
      <div class="ad-grid3">
        <label class="ad-field"><span>Product</span><select id="r_pid">
          ${(PRODUCTS.length ? PRODUCTS.map(r => ({ id: r.id, name: r.data.name }))
             : window.PRODUCTS.map(p => ({ id: p.id, name: p.name })))
            .map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}
        </select></label>
        <label class="ad-field"><span>Their name</span><input id="r_name" placeholder="Meera S."></label>
        <label class="ad-field"><span>Stars</span><select id="r_rating">
          ${[5,4,3,2,1].map(n => `<option value="${n}">${'★'.repeat(n)}</option>`).join('')}
        </select></label>
      </div>
      <label class="ad-field"><span>What they said</span><textarea id="r_body" rows="2"></textarea></label>
      <button class="ad-btn ad-btn--primary" data-x="addreview">Add review</button>
    </div>

    ${(() => {
      const waiting = list.filter(v => !v.published);
      const live = list.filter(v => v.published);
      const pname = id => (PRODUCTS.find(r => r.id === id) || { data: {} }).data.name
        || (window.PRODUCTS.find(p => p.id === id) || {}).name || id || '—';
      const row = v => `
        <div class="ad-o${v.published ? ' on' : ''}" data-rid="${v.id}">
          <div class="ad-o__bar">
            <span class="ad-o__name">${'★'.repeat(v.rating)} ${esc(v.name)}</span>
            <span class="ad-o__when">${esc(pname(v.product_id))} · ${esc(v.body).slice(0, 70)}</span>
            ${v.pinned ? '<span class="ad-pill ad-pill--clay">on the homepage</span>' : ''}
            <span class="ad-pill ${v.published ? 'ad-pill--live' : 'ad-pill--need'}">${v.published ? 'live' : 'waiting'}</span>
            ${v.published ? `<button class="ad-o__more" data-x="rpin">${v.pinned ? 'Unpin' : 'Pin to homepage'}</button>` : ''}
            <button class="ad-o__more" data-x="rtoggle">${v.published ? 'Unpublish' : 'Publish'}</button>
            <button class="ad-o__more ad-o__more--warn" data-x="rdelete">Delete</button>
          </div>
        </div>`;
      return `
        ${waiting.length ? `<div class="ad-card">
          <h3>Waiting for you <span class="ad-pill ad-pill--need">${waiting.length}</span></h3>
          <p class="ad-p">Written by customers on the shop. Nothing here is visible to anyone else until you publish it.</p>
          <div class="ad-occ">${waiting.map(row).join('')}</div>
        </div>` : ''}
        ${live.length ? `<div class="ad-card">
          <h3>Live on the shop</h3>
          <p class="ad-p">Pinned ones also appear together on the homepage.</p>
          <div class="ad-occ">${live.map(row).join('')}</div>
        </div>` : ''}
        ${list.length ? '' : '<div class="ad-card"><p class="ad-empty">No reviews yet.</p></div>'}`;
    })()}`;
}

/* ---------- spreadsheet in and out ------------------------
   One row per product, with the nested bits flattened into
   plain columns so Excel and Google Sheets can both handle it. */
const COLS = ['id','name','category','price','was','tags','blurb','story','photo','picture',
  'spec_material','spec_layer','spec_print','spec_size',
  'sizes','materials','has_colours',
  'personalise_label','personalise_max','personalise_example',
  'bulk','quote','hidden','sort',
  'details_materials','details_dimL','details_dimB','details_dimH','details_sizePreset','details_care','details_production','details_shipping'];

function toRow(r) {
  const p = r.data || {}, d = p.details || {}, sp = p.specs || {}, v = p.variants || {};
  return {
    id: r.id, name: p.name || '', category: p.cat || '',
    price: p.price ?? 0, was: p.was ?? '',
    tags: (p.tags || []).join(', '), blurb: p.blurb || '', story: p.story || '',
    photo: p.photo || '', picture: p.artKey || '',
    spec_material: sp.Material || '', spec_layer: sp.Layer || '',
    spec_print: sp.Print || '', spec_size: sp.Size || '',  /* spec_size kept for backward compat, not shown in editor */
    sizes: (v.size || []).map(z => [z.label, z.delta || 0, [z.l, z.b, z.h].join('x')].join('|')).join(' ; '),
    materials: (v.material || []).map(m => [m.label, m.delta || 0,
      m.stock === null || m.stock === undefined ? '' : m.stock].join('|')).join(' ; '),
    has_colours: v.colour ? 'yes' : '',
    personalise_label: p.personalise?.label || '', personalise_max: p.personalise?.max || '',
    personalise_example: p.personalise?.placeholder || '',
    bulk: p.bulk ? 'yes' : '', quote: p.quote ? 'yes' : '', hidden: r.hidden ? 'yes' : '',
    sort: r.sort ?? 0,
    details_materials: d.materials || '',
    details_dimL: d.dimL ?? '', details_dimB: d.dimB ?? '', details_dimH: d.dimH ?? '',
    details_sizePreset: d.sizePreset || '',
    details_care: d.care || '', details_production: d.production || '', details_shipping: d.shipping || '',
  };
}

function fromRow(row) {
  const yes = v => /^(yes|y|true|1)$/i.test(String(v || '').trim());
  const V = window.VARIANT_OPTIONS || {};
  const name = String(row.name || '').trim();
  if (!name) return null;

  const data = {
    name, cat: String(row.category || '').trim(),
    price: Number(row.price) || 0,
    blurb: String(row.blurb || '').trim(),
    artKey: String(row.picture || '').trim(),
    tags: String(row.tags || '').split(/[,;]/).map(t => t.trim()).filter(Boolean),
    specs: { Material: row.spec_material || '', Layer: row.spec_layer || '',
             Print: row.spec_print || '', Size: row.spec_size || '' },
    details: { materials: row.details_materials || '',
               dimL: row.details_dimL !== '' && row.details_dimL != null ? +row.details_dimL : null,
               dimB: row.details_dimB !== '' && row.details_dimB != null ? +row.details_dimB : null,
               dimH: row.details_dimH !== '' && row.details_dimH != null ? +row.details_dimH : null,
               sizePreset: row.details_sizePreset || '',
               care: row.details_care || '', production: row.details_production || '',
               shipping: row.details_shipping || '' },
    bulk: yes(row.bulk), reviews: [],
  };
  if (Number(row.was)) data.was = Number(row.was);
  if (row.story) data.story = String(row.story);
  if (row.photo) data.photo = String(row.photo);
  if (yes(row.quote)) { data.quote = true; data.price = 0; }

  const cells = s => String(s || '').split(';').map(x => x.trim()).filter(Boolean);
  const variants = {};

  const sizes = cells(row.sizes).map((cell, i) => {
    const [label, delta, dim] = cell.split('|').map(x => (x || '').trim());
    const [l, b, h] = String(dim || '').toLowerCase().split(/[x×*]/).map(x => Number(x) || null);
    return { k: vkey(label, i), label, delta: Number(delta) || 0, l, b, h };
  }).filter(z => z.label);
  const mats = cells(row.materials).map((cell, i) => {
    const [label, delta, stock] = cell.split('|').map(x => (x || '').trim());
    return { k: vkey(label, i), label, delta: Number(delta) || 0,
             stock: stock === '' ? null : Number(stock) || 0, note: '' };
  }).filter(m => m.label);

  if (sizes.length) variants.size = sizes;
  else if (yes(row.has_sizes) && V.SIZES) variants.size = V.SIZES;
  if (mats.length) variants.material = mats;
  else if (yes(row.has_materials) && V.MATERIALS) variants.material = V.MATERIALS;
  if (yes(row.has_colours) && V.COLOURS) variants.colour = V.COLOURS;
  if (Object.keys(variants).length) data.variants = variants;

  if (row.personalise_label) {
    data.personalise = { label: String(row.personalise_label),
                         max: Number(row.personalise_max) || 20,
                         placeholder: String(row.personalise_example || '') };
  }
  return { id: String(row.id || '').trim() || slug(name), data,
           sort: Number(row.sort) || 0, hidden: yes(row.hidden) };
}

function exportSheet() {
  if (typeof XLSX === 'undefined') { toast('The spreadsheet library did not load'); return; }
  const src = PRODUCTS.length ? PRODUCTS
    : window.PRODUCTS.map((p, i) => ({ id: p.id, data: p, sort: i, hidden: false }));
  const rows = src.map(toRow);
  const ws = XLSX.utils.json_to_sheet(rows, { header: COLS });
  ws['!cols'] = COLS.map(c => ({ wch: Math.max(10, Math.min(40, c.length + 6)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  XLSX.writeFile(wb, `joyshine-products-${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast(`${rows.length} products downloaded`);
}

async function importSheet(file) {
  const out = $('#xlsxOut');
  out.innerHTML = '<p class="ad-p">Reading…</p>';
  try {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    const rows = raw.map(fromRow).filter(Boolean);
    if (!rows.length) { out.innerHTML = '<p class="ad-err">No usable rows. Every product needs a name.</p>'; return; }

    const known = new Set(PRODUCTS.map(r => r.id));
    const added = rows.filter(r => !known.has(r.id)).length;
    out.innerHTML = `<div class="ad-list" style="margin-top:.9rem">
      <div><b>Rows read</b><span>${raw.length}</span></div>
      <div><b>Usable</b><span>${rows.length}</span></div>
      <div><b>New products</b><span>${added}</span></div>
      <div><b>Updated</b><span>${rows.length - added}</span></div></div>
      <div class="ad-btns"><button class="ad-btn ad-btn--primary" data-x="xlsxgo">Apply these ${rows.length} rows</button>
      <button class="ad-btn ad-btn--ghost" data-x="xlsxcancel">Cancel</button></div>`;
    pending = rows;
  } catch (e) {
    out.innerHTML = `<p class="ad-err">Could not read that file: ${esc(e.message)}</p>`;
  }
}
let pending = null;

async function applySheet() {
  if (!pending) return;
  await CLOUD.upsert('products', pending);
  toast(`${pending.length} products saved`);
  pending = null;
  $('#xlsxOut').innerHTML = '';
  await pull(); paintProducts();
}

/* ---------- offers --------------------------------------- */
async function paintOffers() {
  const box = $('#offersCard');
  if (!box) return;
  if (!inn()) { box.innerHTML = '<h3>Discount codes</h3><p class="ad-empty">Sign in to manage codes.</p>'; return; }
  const list = await CLOUD.rows('offers?select=*&order=created_at.desc') || [];
  box.innerHTML = `
    <h3>Discount codes</h3>
    <p class="ad-p">The shop checks expiry and usage limits against the database before applying a code.
      Worth knowing: the discount itself is worked out in the browser, so treat codes as a marketing tool
      rather than something airtight until checkout runs on a server.</p>
    <div class="ad-grid3">
      <label class="ad-field"><span>Code</span><input id="ofCode" placeholder="HELLO10" style="text-transform:uppercase"></label>
      <label class="ad-field"><span>Type</span><select id="ofKind">
        <option value="percent">% off</option><option value="amount">₹ off</option></select></label>
      <label class="ad-field"><span>Value</span><input id="ofValue" type="number" min="0" value="10"></label>
    </div>
    <div class="ad-grid3">
      <label class="ad-field"><span>Minimum spend (₹)</span><input id="ofMin" type="number" min="0" value="0"></label>
      <label class="ad-field"><span>Max uses (blank = unlimited)</span><input id="ofMax" type="number" min="1"></label>
      <label class="ad-field"><span>Expires</span><input id="ofEnds" type="date"></label>
    </div>
    <button class="ad-btn ad-btn--primary" data-x="offeradd">Create code</button>
    ${!list.length ? '' : `<div class="ad-occ" style="margin-top:1rem">${list.map(o => `
      <div class="ad-o${o.active ? ' on' : ''}" data-ofc="${esc(o.code)}">
        <div class="ad-o__bar">
          <span class="ad-o__name"><code>${esc(o.code)}</code></span>
          <span class="ad-pill ad-pill--clay">${o.kind === 'amount' ? money(o.value) : o.value + '%'} off</span>
          ${o.min_spend > 0 ? `<span class="ad-o__when">over ${money(o.min_spend)}</span>` : ''}
          <span class="ad-o__when">${o.uses}${o.max_uses ? ' / ' + o.max_uses : ''} used</span>
          ${o.ends_at ? `<span class="ad-o__when">until ${new Date(o.ends_at).toLocaleDateString('en-IN')}</span>` : ''}
          <button class="ad-o__more" data-x="offertoggle">${o.active ? 'Pause' : 'Resume'}</button>
          <button class="ad-o__more" data-x="offerdel">Delete</button>
        </div>
      </div>`).join('')}</div>`}`;
}

/* ---------- visits --------------------------------------- */
async function paintVisits() {
  const box = $('#visitsCard');
  if (!box) return;
  if (!inn()) { box.innerHTML = '<h3>Visitors</h3><p class="ad-empty">Sign in to see visitor numbers.</p>'; return; }
  box.innerHTML = '<h3>Visitors</h3><p class="ad-empty">Counting…</p>';

  const since = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const rows = await CLOUD.rows(`visits?select=day,path,ref&day=gte.${since}&limit=5000`) || [];

  const byDay = {}, byPath = {}, byRef = {};
  for (const r of rows) {
    byDay[r.day] = (byDay[r.day] || 0) + 1;
    const p = (r.path || '/').replace(/^#\//, '') || 'home';
    byPath[p] = (byPath[p] || 0) + 1;
    let ref = (r.ref || '').trim();
    if (!ref) ref = 'typed the address or a bookmark';
    else { try { ref = new URL(ref).hostname.replace(/^www\./, ''); } catch {} }
    byRef[ref] = (byRef[ref] || 0) + 1;
  }
  const days = Object.keys(byDay).sort();
  const top = Math.max(1, ...Object.values(byDay));
  const today = new Date().toISOString().slice(0, 10);
  const yday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const weekFrom = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const week = days.filter(d => d > weekFrom).reduce((n, d) => n + byDay[d], 0);
  const prevWeek = days.filter(d => d > new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10) && d <= weekFrom)
                       .reduce((n, d) => n + byDay[d], 0);
  const trend = prevWeek ? Math.round((week - prevWeek) / prevWeek * 100) : null;

  const rank = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const ga = (window.JOYSHINE.analytics || {});

  box.innerHTML = `
    <h3>Visitors</h3>
    <p class="ad-p">Counted once per browser per day, by the shop itself. No cookies, no names, nothing personal.
      ${ga.on && ga.ga4 ? `Google Analytics (<code>${esc(ga.ga4)}</code>) records rather more, and lives at
      <a href="https://analytics.google.com/" target="_blank" rel="noopener">analytics.google.com</a>.`
      : 'Google Analytics is switched off above, so this is the only count you have.'}</p>

    <div class="ad-stats">
      <div><b>${byDay[today] || 0}</b><span>today</span></div>
      <div><b>${byDay[yday] || 0}</b><span>yesterday</span></div>
      <div><b>${week}</b><span>last 7 days${trend === null ? '' :
        ` <i class="${trend >= 0 ? 'up' : 'down'}">${trend >= 0 ? '+' : ''}${trend}%</i>`}</span></div>
      <div><b>${rows.length}</b><span>last 30 days</span></div>
    </div>

    ${days.length ? `<div class="ad-spark">
      ${days.map(d => `<i title="${d}: ${byDay[d]}" style="height:${Math.round(byDay[d] / top * 100)}%"></i>`).join('')}
    </div>` : '<p class="ad-empty" style="margin-top:.8rem">Nothing recorded yet.</p>'}

    ${rows.length ? `<div class="ad-grid2" style="margin-top:var(--space-5)">
      <div>
        <h4 class="ad-sub">Where they landed</h4>
        <div class="ad-list">${rank(byPath).map(([k, n]) =>
          `<div><b>${esc(k)}</b><span>${n}</span></div>`).join('')}</div>
      </div>
      <div>
        <h4 class="ad-sub">How they got here</h4>
        <div class="ad-list">${rank(byRef).map(([k, n]) =>
          `<div><b>${esc(k)}</b><span>${n}</span></div>`).join('')}</div>
      </div>
    </div>` : ''}`;
}

/* ---------- the product photograph ------------------------ */
function wireGalleryInput() {
  const file = $('#f_galfile');
  const drop = $('[data-gallerydrop="product"]');
  if (file && !file.dataset.wired) {
    file.dataset.wired = '1';
    file.addEventListener('change', e => {
      const files = [...e.target.files]; e.target.value = '';
      files.forEach(f => putGalleryImage(f));
    });
  }
  if (drop && !drop.dataset.wired) {
    drop.dataset.wired = '1';
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
      e.preventDefault(); drop.classList.add('on');
    }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
      e.preventDefault(); drop.classList.remove('on');
    }));
    drop.addEventListener('drop', e => {
      const files = [...(e.dataTransfer?.files || [])];
      files.forEach(f => putGalleryImage(f));
    });
  }
}

async function putGalleryImage(file) {
  const msg = $('#f_galmsg');
  if (!/^image\//.test(file.type)) { if (msg) msg.textContent = 'That is not an image file'; return; }
  if (msg) msg.textContent = 'Uploading ' + file.name + '…';
  try {
    const url = await CLOUD.uploadImage(file);
    productImagesDraft.push(url);
    paintProductGallery();
    wireGalleryInput();
    paintPreview();
    if (msg) msg.textContent = 'Added. Save the product to keep it.';
    toast('Image uploaded');
  } catch (e) {
    if (msg) msg.textContent = e.message;
    toast(e.message);
  }
}

/* ---------- events --------------------------------------- */
function wire(t) {
  const act = t.closest('[data-x]')?.dataset.x;

  if (act === 'seed') return seed();
  if (act === 'xlsxout') return exportSheet();
  if (act === 'xlsxin') { $('#xlsxFile').click(); return true; }
  if (act === 'xlsxgo') return applySheet();
  if (act === 'xlsxcancel') { pending = null; $('#xlsxOut').innerHTML = ''; return true; }

  if (act === 'offeradd') {
    const code = $('#ofCode').value.trim().toUpperCase();
    if (!code) { toast('Give the code a name'); return true; }
    const ends = $('#ofEnds').value;
    CLOUD.upsert('offers', {
      code, kind: $('#ofKind').value, value: +$('#ofValue').value || 0,
      min_spend: +$('#ofMin').value || 0,
      max_uses: $('#ofMax').value ? +$('#ofMax').value : null,
      ends_at: ends ? new Date(ends + 'T23:59:59').toISOString() : null,
      active: true,
    }).then(() => { toast(code + ' created'); paintOffers(); })
      .catch(e => toast(e.message));
    return true;
  }
  if (act === 'offertoggle') {
    const code = t.closest('[data-ofc]').dataset.ofc;
    const pause = t.textContent.trim() === 'Pause';
    CLOUD.update('offers', 'code=eq.' + encodeURIComponent(code), { active: !pause }).then(paintOffers);
    return true;
  }
  if (act === 'offerdel') {
    const code = t.closest('[data-ofc]').dataset.ofc;
    if (confirm('Delete the code ' + code + '?')) CLOUD.remove('offers', 'code=eq.' + encodeURIComponent(code)).then(paintOffers);
    return true;
  }
  /* --- category management --- */
  if (act === 'catadd') {
    openModal(`
      <div class="ad-modal__head"><h3>Add a category</h3></div>
      <div class="ad-modal__body">
        <label class="ad-field"><span>Name</span><input id="mc_name" placeholder="e.g. Keychains"></label>
        <label class="ad-field"><span>Note (shown in the shop, optional)</span><textarea id="mc_note" rows="2"></textarea></label>
        <div class="ad-field">
          <span>Icon (SVG or Lottie JSON)</span>
          <div class="ad-iconup" id="mc_iconup">
            <input type="file" id="mc_iconfile" accept=".svg,.json" hidden>
            <button type="button" class="ad-btn ad-btn--ghost ad-btn--sm" data-x="caticon">Upload icon</button>
            <div class="ad-iconup__preview" id="mc_iconprev"></div>
          </div>
        </div>
      </div>
      <div class="ad-modal__foot">
        <button class="ad-btn ad-btn--ghost" data-x="modal-cancel">Cancel</button>
        <button class="ad-btn ad-btn--primary" data-x="modal-save">Add category</button>
      </div>`, async () => {
      const name = document.querySelector('#mc_name')?.value.trim();
      if (!name) { toast('Give the category a name'); return; }
      const note = document.querySelector('#mc_note')?.value.trim() || '';
      const id = slug(name);
      const sort = (CATS.length ? Math.max(...CATS.map(c => c.sort || 0)) + 1 : 0);
      const iconRaw = document.querySelector('#mc_iconprev')?.dataset.iconRaw || '';
      try {
        await CLOUD.upsert('categories', { id, name, note, sort });
        if (iconRaw && A()) A().setS('catIcons.' + id, iconRaw);
        toast(name + ' added');
        closeModal();
        await pull(); paintProducts();
      } catch (e) { toast(e.message); }
    });
    /* wire the icon upload button inside the newly-opened modal */
    setTimeout(() => {
      const btn = document.querySelector('#mc_iconup [data-x="caticon"]');
      const inp = document.querySelector('#mc_iconfile');
      if (btn && inp) btn.addEventListener('click', () => inp.click());
      if (inp) inp.addEventListener('change', async e => {
        const f = e.target.files[0]; e.target.value = '';
        if (!f) return;
        const txt = await f.text();
        const clean = f.name.endsWith('.svg') ? SKIN.cleanSvg(txt) : txt;
        const prev = document.querySelector('#mc_iconprev');
        if (prev) { prev.innerHTML = clean; prev.dataset.iconRaw = clean; }
      });
    }, 0);
    return true;
  }

  if (act === 'catedit') {
    const cid = t.closest('[data-cid]')?.dataset.cid || t.dataset.cid;
    const cat = CATS.find(c => c.id === cid) || (window.CATEGORIES || []).find(c => c.id === cid);
    if (!cat) return true;
    const existingIcon = A() ? A().getS('catIcons.' + cid, '') : '';
    openModal(`
      <div class="ad-modal__head"><h3>Edit category</h3></div>
      <div class="ad-modal__body">
        <label class="ad-field"><span>Name</span><input id="mc_name" value="${esc(cat.name)}"></label>
        <label class="ad-field"><span>Note (optional)</span><textarea id="mc_note" rows="2">${esc(cat.note || '')}</textarea></label>
        <div class="ad-field">
          <span>Icon (SVG or Lottie JSON)</span>
          <div class="ad-iconup" id="mc_iconup">
            <input type="file" id="mc_iconfile" accept=".svg,.json" hidden>
            <button type="button" class="ad-btn ad-btn--ghost ad-btn--sm" data-x="caticon">Upload icon</button>
            <div class="ad-iconup__preview" id="mc_iconprev" data-icon-raw="${esc(existingIcon)}">${existingIcon}</div>
          </div>
        </div>
      </div>
      <div class="ad-modal__foot">
        <button class="ad-btn ad-btn--ghost" data-x="modal-cancel">Cancel</button>
        <button class="ad-btn ad-btn--primary" data-x="modal-save">Save</button>
      </div>`, async () => {
      const name = document.querySelector('#mc_name')?.value.trim();
      if (!name) { toast('Give the category a name'); return; }
      const note = document.querySelector('#mc_note')?.value.trim() || '';
      const iconRaw = document.querySelector('#mc_iconprev')?.dataset.iconRaw || '';
      try {
        await CLOUD.upsert('categories', { id: cid, name, note, sort: cat.sort ?? 0 });
        if (A()) A().setS('catIcons.' + cid, iconRaw);
        toast(name + ' saved');
        closeModal();
        await pull(); paintProducts();
      } catch (e) { toast(e.message); }
    });
    setTimeout(() => {
      const btn = document.querySelector('#mc_iconup [data-x="caticon"]');
      const inp = document.querySelector('#mc_iconfile');
      if (btn && inp) btn.addEventListener('click', () => inp.click());
      if (inp) inp.addEventListener('change', async e => {
        const f = e.target.files[0]; e.target.value = '';
        if (!f) return;
        const txt = await f.text();
        const clean = f.name.endsWith('.svg') ? SKIN.cleanSvg(txt) : txt;
        const prev = document.querySelector('#mc_iconprev');
        if (prev) { prev.innerHTML = clean; prev.dataset.iconRaw = clean; }
      });
    }, 0);
    return true;
  }

  if (act === 'catup' || act === 'catdown') {
    const cid = t.dataset.cid;
    const i = CATS.findIndex(c => c.id === cid);
    if (i < 0) return true;
    const j = act === 'catup' ? i - 1 : i + 1;
    if (j < 0 || j >= CATS.length) return true;
    [CATS[i], CATS[j]] = [CATS[j], CATS[i]];
    /* reassign sort values and persist */
    const updates = CATS.map((c, idx) => ({ id: c.id, name: c.name, note: c.note || '', sort: idx }));
    CATS.forEach((c, idx) => { c.sort = idx; });
    CLOUD.upsert('categories', updates).then(() => toast('Order saved')).catch(e => toast(e.message));
    paintProducts($('#prodFilter')?.value || '');
    paintLineup();
    return true;
  }

  /* --- product add/edit via modal --- */
  if (act === 'prodnew') {
    const defaultCat = t.dataset.cat || '';
    editing = { id: '', isNew: true, data: { cat: defaultCat, tags: [], specs: {}, details: {} }, sort: PRODUCTS.length };
    loadVariantDrafts(null);
    openProductModal();
    return true;
  }

  if (act === 'prodedit') {
    const pid = t.dataset.pid || t.closest('[data-pid]')?.dataset.pid;
    editing = PRODUCTS.find(r => r.id === pid);
    if (!editing) return true;
    loadVariantDrafts(editing.data);
    openProductModal();
    return true;
  }

  if (act === 'xlsxinprod') { $('#xlsxFileProd')?.click(); return true; }

  if (act === 'new') {
    editing = { id: '', isNew: true, data: { tags: [], specs: {}, details: {} }, sort: PRODUCTS.length };
    loadVariantDrafts(null);
    openProductModal(); return true;
  }
  if (act === 'edit') {
    const id = t.closest('[data-pid]').dataset.pid;
    editing = PRODUCTS.find(r => r.id === id);
    loadVariantDrafts(editing.data);
    openProductModal(); return true;
  }

  if (act === 'lnadd') {
    const id = $('#lineAdd').value; if (!id) return true;
    const { picks, only } = lineRead();
    if (!picks.includes(id)) picks.push(id);
    lineWrite(picks, only); return true;
  }
  if (act === 'lndel') {
    const i = +t.closest('[data-li]').dataset.li;
    const { picks, only } = lineRead();
    picks.splice(i, 1); lineWrite(picks, only); return true;
  }
  if (act === 'lnup' || act === 'lndown') {
    const i = +t.closest('[data-li]').dataset.li;
    const j = act === 'lnup' ? i - 1 : i + 1;
    const { picks, only } = lineRead();
    if (j < 0 || j >= picks.length) return true;
    [picks[i], picks[j]] = [picks[j], picks[i]];
    lineWrite(picks, only); return true;
  }
  if (act === 'lnclear') {
    if (!confirm('Clear this line-up? The shop goes back to its usual order.')) return true;
    lineWrite([], lineRead().only); return true;
  }

  /* --- options builder --- */
  if (act === 'optadd') {
    const name = t.dataset.preset || '';
    const type = t.dataset.ptype || 'text';
    optionsDraft.push({ name, type, values: [] });
    paintOptions(); paintPreview(); return true;
  }
  if (act === 'optdel') {
    optionsDraft.splice(+t.closest('[data-oi]').dataset.oi, 1);
    paintOptions(); rebuildMatrixFromOptions(); paintVariantMatrix(); paintPreview(); return true;
  }
  if (act === 'valdel') {
    const oi = +t.closest('[data-oi]').dataset.oi;
    const vi = +t.closest('[data-vi]').dataset.vi;
    optionsDraft[oi].values.splice(vi, 1);
    paintOptions(); rebuildMatrixFromOptions(); paintVariantMatrix(); paintPreview(); return true;
  }

  /* --- product image gallery --- */
  if (act === 'galpick') {
    const inp = $('#f_galfile'); if (inp) inp.click(); return true;
  }
  if (act === 'pgdel') {
    productImagesDraft.splice(+t.dataset.i, 1);
    paintProductGallery(); paintPreview(); return true;
  }
  if (act === 'pgmovefirst') {
    const i = +t.dataset.i;
    if (i > 0) { productImagesDraft.unshift(productImagesDraft.splice(i, 1)[0]); paintProductGallery(); paintPreview(); }
    return true;
  }

  /* --- bulk tiers --- */
  if (act === 'btadd') {
    bulkTiersDraft.push({ min: '', max: '', off: '' });
    paintBulkTiers(); return true;
  }
  if (act === 'btdel') {
    bulkTiersDraft.splice(+t.dataset.i, 1);
    paintBulkTiers(); return true;
  }
  if (act === 'dimadd') {
    dimsDraft.push({ label: '', L: '', B: '', H: '' });
    paintDims(); return true;
  }
  if (act === 'dimdel') {
    dimsDraft.splice(+t.dataset.di, 1);
    paintDims(); paintPreview(); return true;
  }

  /* --- per-option-value image gallery (opens a sub-modal) --- */
  if (act === 'valimgs') {
    const oi = +t.dataset.oi, vi = +t.dataset.vi;
    const val = optionsDraft[oi]?.values?.[vi]; if (!val) return true;
    const imgs = val.images || (val.images = []);
    openModal(`
      <div class="ad-modal__head"><h3>Images for "${esc(val.label || 'this value')}"</h3></div>
      <div class="ad-modal__body">
        <p class="ad-p">These images show when a customer picks this option. They override the product images.</p>
        <div id="valGallery" class="ad-gallery">${imgs.map((u, i) => `
          <div class="ad-gallery__item">
            <img src="${esc(u)}" alt="">
            <div class="ad-gallery__actions">
              <button class="ad-gallery__btn ad-gallery__btn--del" data-x="vgdel" data-i="${i}">&times;</button>
            </div>
          </div>`).join('')}</div>
        <input type="file" id="vg_file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden>
        <button type="button" class="ad-btn ad-btn--ghost ad-btn--sm" id="vg_pick" style="margin-top:.7rem">+ Add Images</button>
      </div>
      <div class="ad-modal__foot">
        <button class="ad-btn ad-btn--primary" data-x="modal-save">Done</button>
      </div>`, () => { paintOptions(); });
    setTimeout(() => {
      const pick = document.querySelector('#vg_pick');
      const inp = document.querySelector('#vg_file');
      if (pick && inp) pick.addEventListener('click', () => inp.click());
      if (inp) inp.addEventListener('change', async e => {
        const files = [...e.target.files]; e.target.value = '';
        for (const f of files) {
          const url = await CATALOGUE.uploadFile(f).catch(() => null);
          if (url) { imgs.push(url); }
        }
        const gal = document.querySelector('#valGallery');
        if (gal) gal.innerHTML = imgs.map((u, i) => `
          <div class="ad-gallery__item">
            <img src="${esc(u)}" alt="">
            <div class="ad-gallery__actions">
              <button class="ad-gallery__btn ad-gallery__btn--del" data-x="vgdel" data-i="${i}">&times;</button>
            </div>
          </div>`).join('');
      });
      document.querySelector('#valGallery')?.addEventListener('click', e => {
        const btn = e.target.closest('[data-x="vgdel"]');
        if (!btn) return;
        imgs.splice(+btn.dataset.i, 1);
        const gal = document.querySelector('#valGallery');
        if (gal) gal.innerHTML = imgs.map((u, i) => `
          <div class="ad-gallery__item"><img src="${esc(u)}" alt="">
            <div class="ad-gallery__actions">
              <button class="ad-gallery__btn ad-gallery__btn--del" data-x="vgdel" data-i="${i}">&times;</button>
            </div>
          </div>`).join('');
      });
    }, 0);
    return true;
  }

  if (act === 'cuadd') {
    const type = t.closest('[data-type]').dataset.type;
    custDraft.push({ type, label: '', required: false,
      ...(type === 'text' || type === 'textarea' ? { max: 24 } : {}),
      ...(type === 'select' ? { options: [] } : {}) });
    paintCustom(); return true;
  }
  if (act === 'cudel') { custDraft.splice(+t.closest('[data-cui]').dataset.cui, 1); paintCustom(); return true; }
  if (act === 'cuup' || act === 'cudown') {
    const i = +t.closest('[data-cui]').dataset.cui;
    const j = act === 'cuup' ? i - 1 : i + 1;
    if (j >= 0 && j < custDraft.length) { [custDraft[i], custDraft[j]] = [custDraft[j], custDraft[i]]; paintCustom(); }
    return true;
  }
  if (act === 'cancel') { editing = null; closeModal(); paintProducts(); return true; }
  if (act === 'save') return saveProduct();
  if (act === 'delete') return deleteProduct(editing.id);

  if (act === 'oexpand' || act === 'qexpand') { t.closest('.ad-o').classList.toggle('open'); return true; }

  if (act === 'addreview') {
    const body = $('#r_body').value.trim(), name = $('#r_name').value.trim();
    if (!name || !body) { toast('Name and words, please'); return true; }
    CLOUD.upsert('reviews', { product_id: $('#r_pid').value, name, rating: +$('#r_rating').value, body, published: true })
      .then(() => { toast('Review added and published'); paintReviews(); });
    return true;
  }
  if (act === 'rpin') {
    const id = t.closest('[data-rid]').dataset.rid;
    const on = t.textContent.trim() !== 'Unpin';
    CLOUD.update('reviews', 'id=eq.' + id, { pinned: on })
      .then(() => { toast(on ? 'Pinned to the homepage' : 'Unpinned'); paintReviews(); })
      .catch(e => toast(e.message));
    return true;
  }
  if (act === 'rtoggle') {
    const id = t.closest('[data-rid]').dataset.rid;
    const live = t.textContent.trim() === 'Unpublish';
    CLOUD.update('reviews', 'id=eq.' + id, { published: !live }).then(() => paintReviews());
    return true;
  }
  if (act === 'rdelete') {
    const id = t.closest('[data-rid]').dataset.rid;
    if (confirm('Delete this review?')) CLOUD.remove('reviews', 'id=eq.' + id).then(() => paintReviews());
    return true;
  }
  return false;
}

function wireChange(t) {
  if (t.id === 'lineFor') { lineFor = t.value; paintLineup(); return true; }
  if (t.id === 'lineOnly') { lineWrite(lineRead().picks, t.checked); return true; }

  /* options builder — option-level fields */
  if (t.dataset.opf) {
    const oi = +t.closest('[data-oi]')?.dataset.oi;
    const opt = optionsDraft[oi]; if (!opt) return true;
    opt[t.dataset.opf] = t.value;
    if (t.dataset.opf === 'type') paintOptions(); /* swatch vs text chips change */
    if (t.dataset.opf === 'name') rebuildMatrixFromOptions(), paintVariantMatrix();
    return true;
  }
  /* options builder — value-level colour swatch */
  if (t.dataset.valf) {
    const oi = +t.closest('[data-oi]')?.dataset.oi;
    const vi = +t.closest('[data-vi]')?.dataset.vi;
    const val = optionsDraft[oi]?.values?.[vi]; if (!val) return true;
    val[t.dataset.valf] = t.value;
    return true;
  }
  /* variant matrix row fields */
  if (t.dataset.mxf) {
    const row = matrixDraft[+t.closest('[data-mxi]')?.dataset.mxi]; if (!row) return true;
    row[t.dataset.mxf] = t.value;
    return true;
  }
  /* bulk tier fields */
  if (t.dataset.btf) {
    const tier = bulkTiersDraft[+t.closest('[data-bti]')?.dataset.bti]; if (!tier) return true;
    tier[t.dataset.btf] = t.value;
    return true;
  }
  if (t.dataset.dmf) {
    const row = dimsDraft[+t.closest('[data-di]')?.dataset.di]; if (!row) return true;
    row[t.dataset.dmf] = t.value;
    paintPreview(); return true;
  }
  /* customisation fields */
  if (t.dataset.cuf) {
    const f = custDraft[+t.dataset.i]; if (!f) return true;
    const k = t.dataset.cuf;
    if (k === 'required') f.required = t.checked;
    else if (k === 'options') f.options = t.value.split(',').map(s => s.trim()).filter(Boolean);
    else if (k === 'max') f.max = +t.value || 24;
    else f[k] = t.value;
    if (k === 'label' || k === 'required') paintCustom();
    return true;
  }
  /* bulk pricing block toggle */
  if (t.id === 'bo_bulk') {
    const blk = $('#bulkPricingBlock');
    if (blk) blk.hidden = !t.checked;
    paintPreview(); return true;
  }
  if (t.id === 'prodFilter') { paintProducts(t.value); return true; }
  if (t.dataset.ostatus) { CLOUD.update('orders', 'id=eq.' + t.dataset.ostatus, { status: t.value }).then(() => toast('Order updated')); return true; }
  if (t.dataset.qstatus) { CLOUD.update('requests', 'id=eq.' + t.dataset.qstatus, { status: t.value }).then(() => toast('Request updated')); return true; }
  /* refresh preview on any form field change inside the editor */
  if (t.closest('.ad-pe-form')) { paintPreview(); }
  return false;
}

function wireFile() {
  const f = $('#xlsxFile');
  if (f && !f.dataset.wired) {
    f.dataset.wired = '1';
    f.addEventListener('change', e => { if (e.target.files[0]) importSheet(e.target.files[0]); e.target.value = ''; });
  }
}

async function paint(tab) {
  wireFile();
  if (tab === 'marketing') paintOffers();
  if (tab === 'traffic') paintVisits();
  if (tab === 'products') {
    if (inn() && !PRODUCTS.length) await pull();
    paintProducts($('#prodFilter')?.value || '');
    paintLineup();
  }
  if (tab === 'orders') paintOrders();
  if (tab === 'requests') paintRequests();
  if (tab === 'reviews') { if (inn() && !PRODUCTS.length) await pull(); paintReviews(); }
}

return { paint, wire, wireChange, setToast: fn => { toast = fn; }, pull,
         list: () => everyProduct().map(p => ({ ...p, price: (PRODUCTS.find(r => r.id === p.id)?.data.price)
           ?? (window.PRODUCTS.find(x => x.id === p.id)?.price) ?? 0 })),
         pendingProducts: () => ({ upserts: [...productUpserts.values()], deletes: [...productDeletes] }),
         clearProductDrafts: () => { productUpserts.clear(); productDeletes.clear(); },
         discardProductDrafts: () => {
           productUpserts.clear(); productDeletes.clear();
           pull().then(() => { paintProducts(); paintLineup(); });
         } };
})();
