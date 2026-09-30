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

/* ---------- loading -------------------------------------- */
async function pull() {
  PRODUCTS = await CLOUD.rows('products?select=id,data,sort,hidden&order=sort.asc') || [];
  CATS     = await CLOUD.rows('categories?select=id,name,note,sort&order=sort.asc') || [];
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

/* ---------- products list -------------------------------- */
function paintProducts(filter = '') {
  const box = $('#pane-products');
  if (!box) return;
  if (!inn()) { box.innerHTML = gate('manage the catalogue'); return; }

  if (editing) { box.innerHTML = productForm(editing); return; }

  const f = filter.trim().toLowerCase();
  const list = PRODUCTS.filter(r => !f || (r.data.name || '').toLowerCase().includes(f) || r.id.includes(f));

  box.innerHTML = `
    <div class="ad-head">
      <div><h2>Products</h2><p>${PRODUCTS.length} in the database. The shop reads these; the files are the fallback.</p></div>
      <div class="ad-btns" style="margin:0">
        <label class="ad-search"><input type="search" id="prodFilter" value="${esc(filter)}" placeholder="Filter…"></label>
        <button class="ad-btn ad-btn--primary" data-x="new">Add a product</button>
      </div>
    </div>
    ${!PRODUCTS.length ? `<div class="ad-card">
      <h3>Start from what you already have</h3>
      <p class="ad-p">The database is empty, so the shop is showing the ${window.PRODUCTS.length} placeholder
        products from the files. Copy them in, then edit them into your real catalogue — it is far quicker
        than typing thirty products from scratch.</p>
      <button class="ad-btn ad-btn--primary" data-x="seed">Copy the file catalogue in</button>
    </div>` : ''}
    <div class="ad-occ">
      ${list.map(r => {
        const p = r.data;
        return `<div class="ad-o${r.hidden ? '' : ' on'}" data-pid="${esc(r.id)}">
          <div class="ad-o__bar">
            <span class="ad-o__name">${esc(p.name || r.id)}</span>
            ${r.hidden ? '<span class="ad-pill ad-pill--need">hidden</span>' : ''}
            <span class="ad-pill ad-pill--clay">${esc(catName(p.cat))}</span>
            <span class="ad-o__when">${p.quote ? 'quoted' : money(p.price)}</span>
            <button class="ad-o__more" data-x="edit">Edit</button>
          </div>
        </div>`;
      }).join('') || '<p class="ad-empty">Nothing matches that.</p>'}
    </div>`;
}

const catName = id => (CATS.find(c => c.id === id) || window.CATEGORIES.find(c => c.id === id) || {}).name || id || '—';

/* ---------- one product ---------------------------------- */
const TAGS = ['new', 'bestseller', 'trending', 'limited', 'personalised', 'madeinindia', 'gift', 'festival', 'quirky'];

function productForm(r) {
  const p = r.data || {};
  const d = p.details || {};
  const sp = p.specs || {};
  const v = p.variants || {};
  const arts = Object.keys(window.ART || {});
  const has = t => (p.tags || []).includes(t);

  return `
  <div class="ad-head">
    <div><h2>${r.isNew ? 'New product' : esc(p.name || r.id)}</h2>
      <p>${r.isNew ? 'It goes live as soon as you save.' : 'Changes reach the shop the moment you save.'}</p></div>
    <div class="ad-btns" style="margin:0">
      <button class="ad-btn ad-btn--ghost" data-x="cancel">Back</button>
      <button class="ad-btn ad-btn--primary" data-x="save">Save</button>
    </div>
  </div>

  <div class="ad-cards">
    <div class="ad-card">
      <h3>The basics</h3>
      <label class="ad-field"><span>Name</span><input id="f_name" value="${esc(p.name)}"></label>
      <label class="ad-field"><span>Category</span><select id="f_cat">
        ${(CATS.length ? CATS : window.CATEGORIES).map(c =>
          `<option value="${esc(c.id)}"${p.cat === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}
      </select></label>
      <div class="ad-grid3">
        <label class="ad-field"><span>Price (₹)</span><input id="f_price" type="number" min="0" value="${p.price ?? 0}"></label>
        <label class="ad-field"><span>Was (optional)</span><input id="f_was" type="number" min="0" value="${p.was ?? ''}"></label>
        <label class="ad-field"><span>Sort order</span><input id="f_sort" type="number" value="${r.sort ?? 0}"></label>
      </div>
      <label class="ad-field"><span>One-line description</span><textarea id="f_blurb" rows="2">${esc(p.blurb)}</textarea></label>
      <label class="ad-field" style="margin-bottom:0"><span>The one detail worth knowing (optional)</span><textarea id="f_story" rows="2">${esc(p.story)}</textarea></label>
    </div>

    <div class="ad-card">
      <h3>How it shows up</h3>
      <label class="ad-field"><span>Picture</span><select id="f_art">
        ${arts.map(k => `<option value="${k}"${p.artKey === k ? ' selected' : ''}>${k}</option>`).join('')}
      </select><i class="ad-hint">Drawn art that recolours with the theme. A photo URL below wins over it.</i></label>
      <div class="ad-field"><span>Photograph</span>
        <div class="ad-up" data-imgdrop>
          <input type="file" id="f_imgfile" accept="image/jpeg,image/png,image/webp,image/avif" hidden>
          <button type="button" class="ad-btn ad-btn--ghost ad-btn--sm" data-x="imgpick">Upload from this computer</button>
          <span class="ad-hint" id="f_imgmsg">or drag one here, or paste a link below</span>
        </div>
        <input id="f_photo" value="${esc(p.photo)}" placeholder="https://… or assets/img/thing.jpg" style="margin-top:.5rem">
        <div id="f_imgprev" ${p.photo ? '' : 'hidden'}>${p.photo ? `<img src="${esc(p.photo)}" alt="">` : ''}</div>
        <i class="ad-hint">A photograph replaces the drawn picture. Uploads go to your own Supabase storage.</i>
      </div>
      <div class="ad-field"><span>Badges and rails</span>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${TAGS.map(t => `<label class="ad-pill" style="cursor:pointer">
            <input type="checkbox" data-tag="${t}"${has(t) ? ' checked' : ''} style="accent-color:var(--c-primary)"> ${t}</label>`).join('')}
        </div>
      </div>
      <div class="ad-grid3">
        <label class="ad-row--switch" style="margin:0"><input type="checkbox" id="f_bulk"${p.bulk ? ' checked' : ''}><span><b>Bulk pricing</b></span></label>
        <label class="ad-row--switch" style="margin:0"><input type="checkbox" id="f_quote"${p.quote ? ' checked' : ''}><span><b>Quote only</b></span></label>
        <label class="ad-row--switch" style="margin:0"><input type="checkbox" id="f_hidden"${r.hidden ? ' checked' : ''}><span><b>Hide</b></span></label>
      </div>
    </div>
  </div>

  <div class="ad-cards">
    <div class="ad-card">
      <h3>Specs on the card</h3>
      <div class="ad-grid3">
        <label class="ad-field"><span>Material</span><input id="s_Material" value="${esc(sp.Material)}"></label>
        <label class="ad-field"><span>Layer</span><input id="s_Layer" value="${esc(sp.Layer)}"></label>
        <label class="ad-field"><span>Print time</span><input id="s_Print" value="${esc(sp.Print)}"></label>
        <label class="ad-field" style="margin-bottom:0"><span>Size</span><input id="s_Size" value="${esc(sp.Size)}"></label>
      </div>
    </div>
    <div class="ad-card">
      <h3>Colours</h3>
      <label class="ad-row--switch" style="margin:0"><input type="checkbox" id="v_colour"${v.colour ? ' checked' : ''}>
        <span><b>Offer the filament colours</b><i>Eight of them. The drawn art recolours to match.</i></span></label>
    </div>
  </div>

  <div class="ad-card">
    <h3>Sizes</h3>
    <p class="ad-p">The dimensions show on the product page, so nobody has to guess what
      "Large" means. Leave this empty and the product is one size.</p>
    <div id="sizeList"></div>
    <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="szadd" style="margin-top:.7rem">+ Add a size</button>
  </div>

  <div class="ad-card">
    <h3>Materials, pricing and stock</h3>
    <p class="ad-p">The extra charge is added to the base price. Leave stock blank for made to
      order; put a number in and the shop shows "only N left", then greys the option out at zero.</p>
    <div id="matList"></div>
    <button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="mtadd" style="margin-top:.7rem">+ Add a material</button>
  </div>

  <div class="ad-card">
    <h3>What the customer fills in</h3>
    <p class="ad-p">Each one becomes a field on the product page. Text for a name or a
      message, a dropdown for a choice you want to limit, a colour picker, or a file
      upload for a logo or artwork. Leave it empty and the product has no options.</p>
    <div id="custList" class="ad-occ"></div>
    <div class="ad-btns" style="margin-top:.9rem">
      ${Object.entries(window.CUSTOM.TYPES).map(([t, n]) =>
        `<button class="ad-btn ad-btn--ghost ad-btn--sm" data-x="cuadd" data-type="${t}">+ ${n}</button>`).join('')}
    </div>
  </div>

  <div class="ad-card">
    <h3>The expandable sections</h3>
    <label class="ad-field"><span>Materials</span><textarea id="d_materials" rows="2">${esc(d.materials)}</textarea></label>
    <label class="ad-field"><span>Dimensions</span><textarea id="d_dimensions" rows="2">${esc(d.dimensions)}</textarea></label>
    <label class="ad-field"><span>Care</span><textarea id="d_care" rows="2">${esc(d.care)}</textarea></label>
    <label class="ad-field"><span>Production</span><textarea id="d_production" rows="2">${esc(d.production)}</textarea></label>
    <label class="ad-field" style="margin-bottom:0"><span>Shipping</span><textarea id="d_shipping" rows="2">${esc(d.shipping)}</textarea></label>
  </div>

  <div class="ad-card">
    <h3>Remove it</h3>
    <p class="ad-p">Hiding keeps the product and takes it off the shop. Deleting cannot be undone.</p>
    <button class="ad-btn ad-btn--warn" data-x="delete"${r.isNew ? ' disabled' : ''}>Delete this product</button>
  </div>`;
}

/* ---------- the size builder ------------------------------ */
let sizeDraft = [];
let matDraft = [];

const num = (x, d = 0) => (x === '' || x === null || x === undefined || isNaN(+x) ? d : +x);

function paintSizes() {
  const box = $('#sizeList'); if (!box) return;
  if (!sizeDraft.length) {
    box.innerHTML = '<p class="ad-empty">One size only. Add sizes if this product comes in more than one.</p>';
    return;
  }
  box.innerHTML = `
    <div class="ad-vgrid ad-vgrid--head">
      <span>Name</span><span>Extra ₹</span><span>L mm</span><span>B mm</span><span>H mm</span><span></span>
    </div>
    ${sizeDraft.map((z, i) => `
      <div class="ad-vgrid" data-szi="${i}">
        <input data-szf="label" value="${esc(z.label)}" placeholder="Medium">
        <input data-szf="delta" type="number" step="10" value="${z.delta ?? 0}">
        <input data-szf="l" type="number" min="0" value="${z.l ?? ''}">
        <input data-szf="b" type="number" min="0" value="${z.b ?? ''}">
        <input data-szf="h" type="number" min="0" value="${z.h ?? ''}">
        <button class="ad-o__more ad-o__more--warn" data-x="szdel" title="Remove">&times;</button>
      </div>`).join('')}`;
}

function paintMats() {
  const box = $('#matList'); if (!box) return;
  if (!matDraft.length) {
    box.innerHTML = '<p class="ad-empty">No choice of material. Printed in whatever the spec says.</p>';
    return;
  }
  box.innerHTML = `
    <div class="ad-vgrid ad-vgrid--mat ad-vgrid--head">
      <span>Name</span><span>Extra ₹</span><span>In stock</span><span>Note for the customer</span><span></span>
    </div>
    ${matDraft.map((m, i) => `
      <div class="ad-vgrid ad-vgrid--mat" data-mti="${i}">
        <input data-mtf="label" value="${esc(m.label)}" placeholder="PLA">
        <input data-mtf="delta" type="number" step="10" value="${m.delta ?? 0}">
        <input data-mtf="stock" type="number" min="0" value="${m.stock ?? ''}" placeholder="made to order">
        <input data-mtf="note" value="${esc(m.note)}" placeholder="Sturdy, matte, everyday">
        <button class="ad-o__more ad-o__more--warn" data-x="mtdel" title="Remove">&times;</button>
      </div>`).join('')}`;
}

/* a key the cart can rely on: stable, short, and never blank */
function vkey(label, i) {
  const k = String(label || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return k || 'V' + (i + 1);
}

function loadVariantDrafts(p) {
  const V = window.VARIANT_OPTIONS || {};
  const v = (p && p.variants) || {};
  const copy = a => JSON.parse(JSON.stringify(a || []));
  sizeDraft = copy(v.size);
  matDraft = copy(v.material);
  return V;
}

/* ---------- the customisation builder --------------------- */
let custDraft = [];

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

function readForm(r) {
  const g = id => $('#' + id)?.value.trim() ?? '';
  const n = id => { const v = $('#' + id)?.value; return v === '' || v == null ? null : +v; };
  const on = id => !!$('#' + id)?.checked;
  const V = window.VARIANT_OPTIONS || {};

  const name = g('f_name');
  const data = {
    name, cat: g('f_cat'),
    price: n('f_price') ?? 0,
    blurb: g('f_blurb'),
    artKey: g('f_art'),
    tags: $$('[data-tag]').filter(c => c.checked).map(c => c.dataset.tag),
    specs: { Material: g('s_Material'), Layer: g('s_Layer'), Print: g('s_Print'), Size: g('s_Size') },
    details: { materials: g('d_materials'), dimensions: g('d_dimensions'), care: g('d_care'),
               production: g('d_production'), shipping: g('d_shipping') },
    bulk: on('f_bulk'),
    reviews: r.data?.reviews || [],
  };
  if (n('f_was')) data.was = n('f_was');
  if (g('f_story')) data.story = g('f_story');
  if (g('f_photo')) data.photo = g('f_photo');
  if (on('f_quote')) { data.quote = true; data.price = 0; }

  const variants = {};
  const sizes = sizeDraft.filter(z => (z.label || '').trim()).map((z, i) => ({
    k: z.k || vkey(z.label, i), label: z.label.trim(), delta: num(z.delta),
    l: num(z.l, null), b: num(z.b, null), h: num(z.h, null),
  }));
  const mats = matDraft.filter(m => (m.label || '').trim()).map((m, i) => ({
    k: m.k || vkey(m.label, i), label: m.label.trim(), delta: num(m.delta),
    stock: m.stock === '' || m.stock === null || m.stock === undefined ? null : num(m.stock),
    note: (m.note || '').trim(),
  }));
  if (sizes.length) variants.size = sizes;
  if (mats.length) variants.material = mats;
  if (on('v_colour') && V.COLOURS) variants.colour = V.COLOURS;
  if (Object.keys(variants).length) data.variants = variants;

  const custom = custDraft.filter(f => (f.label || '').trim());
  if (custom.length) data.custom = custom;

  return { id: r.id || slug(name), data, sort: n('f_sort') ?? 0, hidden: on('f_hidden') };
}

async function saveProduct() {
  const row = readForm(editing);
  if (!row.data.name) { toast('Give it a name first'); return; }
  if (!row.id) { toast('That name does not make a usable id'); return; }
  await CLOUD.upsert('products', row);
  toast(`${row.data.name} saved`);
  editing = null;
  await pull(); paintProducts();
}

async function deleteProduct(id) {
  if (!confirm('Delete this product for good? This cannot be undone.\n\nHiding it instead keeps the record.')) return;
  await CLOUD.remove('products', 'id=eq.' + encodeURIComponent(id));
  toast('Deleted');
  editing = null;
  await pull(); paintProducts();
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

    ${!list.length ? '' : `<div class="ad-occ">${list.map(v => `
      <div class="ad-o${v.published ? ' on' : ''}" data-rid="${v.id}">
        <div class="ad-o__bar">
          <span class="ad-o__name">${'★'.repeat(v.rating)} ${esc(v.name)}</span>
          <span class="ad-o__when">${esc(v.body).slice(0, 80)}</span>
          <span class="ad-pill ${v.published ? 'ad-pill--live' : 'ad-pill--need'}">${v.published ? 'live' : 'hidden'}</span>
          <button class="ad-o__more" data-x="rtoggle">${v.published ? 'Unpublish' : 'Publish'}</button>
          <button class="ad-o__more" data-x="rdelete">Delete</button>
        </div>
      </div>`).join('')}</div>`}`;
}

/* ---------- spreadsheet in and out ------------------------
   One row per product, with the nested bits flattened into
   plain columns so Excel and Google Sheets can both handle it. */
const COLS = ['id','name','category','price','was','tags','blurb','story','photo','picture',
  'spec_material','spec_layer','spec_print','spec_size',
  'sizes','materials','has_colours',
  'personalise_label','personalise_max','personalise_example',
  'bulk','quote','hidden','sort',
  'details_materials','details_dimensions','details_care','details_production','details_shipping'];

function toRow(r) {
  const p = r.data || {}, d = p.details || {}, sp = p.specs || {}, v = p.variants || {};
  return {
    id: r.id, name: p.name || '', category: p.cat || '',
    price: p.price ?? 0, was: p.was ?? '',
    tags: (p.tags || []).join(', '), blurb: p.blurb || '', story: p.story || '',
    photo: p.photo || '', picture: p.artKey || '',
    spec_material: sp.Material || '', spec_layer: sp.Layer || '',
    spec_print: sp.Print || '', spec_size: sp.Size || '',
    sizes: (v.size || []).map(z => [z.label, z.delta || 0, [z.l, z.b, z.h].join('x')].join('|')).join(' ; '),
    materials: (v.material || []).map(m => [m.label, m.delta || 0,
      m.stock === null || m.stock === undefined ? '' : m.stock].join('|')).join(' ; '),
    has_colours: v.colour ? 'yes' : '',
    personalise_label: p.personalise?.label || '', personalise_max: p.personalise?.max || '',
    personalise_example: p.personalise?.placeholder || '',
    bulk: p.bulk ? 'yes' : '', quote: p.quote ? 'yes' : '', hidden: r.hidden ? 'yes' : '',
    sort: r.sort ?? 0,
    details_materials: d.materials || '', details_dimensions: d.dimensions || '',
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
    details: { materials: row.details_materials || '', dimensions: row.details_dimensions || '',
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
  const since = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const rows = await CLOUD.rows(`visits?select=day&day=gte.${since}`) || [];
  const byDay = {};
  rows.forEach(r => { byDay[r.day] = (byDay[r.day] || 0) + 1; });
  const days = Object.keys(byDay).sort();
  const top = Math.max(1, ...Object.values(byDay));
  const today = new Date().toISOString().slice(0, 10);
  const week = days.filter(d => d > new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10))
                   .reduce((n, d) => n + byDay[d], 0);

  box.innerHTML = `
    <h3>Visitors</h3>
    <p class="ad-p">Counted once per browser per day. No cookies, no names, nothing personal —
      just enough to see whether the shop is getting busier.</p>
    <div class="ad-list">
      <div><b>Today</b><span>${byDay[today] || 0}</span></div>
      <div><b>Last 7 days</b><span>${week}</span></div>
      <div><b>Last 30 days</b><span>${rows.length}</span></div>
    </div>
    ${days.length ? `<div style="display:flex;align-items:flex-end;gap:3px;height:80px;margin-top:1rem">
      ${days.map(d => `<div title="${d}: ${byDay[d]}" style="flex:1;min-width:3px;border-radius:3px 3px 0 0;
        background:var(--c-primary);opacity:.75;height:${Math.round(byDay[d] / top * 100)}%"></div>`).join('')}
    </div>` : '<p class="ad-empty" style="margin-top:.8rem">Nothing recorded yet.</p>'}`;
}

/* ---------- the product photograph ------------------------ */
function paintImage() {
  const box = $('#f_imgprev'); const url = $('#f_photo')?.value.trim();
  if (!box) return;
  box.hidden = !url;
  box.innerHTML = url ? `<img src="${esc(url)}" alt="">` : '';

  const drop = $('[data-imgdrop]'), file = $('#f_imgfile');
  if (file && !file.dataset.wired) {
    file.dataset.wired = '1';
    file.addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) putImage(f); });
  }
  if (drop && !drop.dataset.wired) {
    drop.dataset.wired = '1';
    ['dragenter', 'dragover'].forEach(n => drop.addEventListener(n, e => {
      e.preventDefault(); drop.classList.add('on');
    }));
    ['dragleave', 'drop'].forEach(n => drop.addEventListener(n, e => {
      e.preventDefault(); drop.classList.remove('on');
    }));
    drop.addEventListener('drop', e => { const f = e.dataTransfer?.files?.[0]; if (f) putImage(f); });
  }
}

async function putImage(file) {
  const msg = $('#f_imgmsg');
  if (!/^image\//.test(file.type)) { if (msg) msg.textContent = 'That is not an image'; return; }
  if (msg) msg.textContent = 'Uploading ' + file.name + '…';
  try {
    const url = await CLOUD.uploadImage(file);
    $('#f_photo').value = url;
    paintImage();
    if (msg) msg.textContent = 'Uploaded. Save the product to keep it.';
    toast('Photograph uploaded');
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
  if (act === 'new') {
    editing = { id: '', isNew: true, data: { tags: [], specs: {}, details: {} }, sort: PRODUCTS.length };
    custDraft = [];
    const V0 = loadVariantDrafts(null);
    sizeDraft = JSON.parse(JSON.stringify(V0.SIZES || []));
    matDraft = JSON.parse(JSON.stringify(V0.MATERIALS || []));
    paintProducts(); paintCustom(); paintSizes(); paintMats(); paintImage(); return true;
  }
  if (act === 'edit') {
    const id = t.closest('[data-pid]').dataset.pid;
    editing = PRODUCTS.find(r => r.id === id);
    custDraft = JSON.parse(JSON.stringify(window.CUSTOM.fields(editing.data)));
    loadVariantDrafts(editing.data);
    paintProducts(); paintCustom(); paintSizes(); paintMats(); paintImage(); return true;
  }

  if (act === 'szadd') { sizeDraft.push({ label: '', delta: 0, l: '', b: '', h: '' }); paintSizes(); return true; }
  if (act === 'szdel') { sizeDraft.splice(+t.closest('[data-szi]').dataset.szi, 1); paintSizes(); return true; }
  if (act === 'mtadd') { matDraft.push({ label: '', delta: 0, stock: '', note: '' }); paintMats(); return true; }
  if (act === 'mtdel') { matDraft.splice(+t.closest('[data-mti]').dataset.mti, 1); paintMats(); return true; }
  if (act === 'imgpick') { $('#f_imgfile')?.click(); return true; }

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
  if (act === 'cancel') { editing = null; paintProducts(); return true; }
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
  if (t.dataset.szf) {
    const z = sizeDraft[+t.closest('[data-szi]').dataset.szi]; if (!z) return true;
    z[t.dataset.szf] = t.value;
    return true;
  }
  if (t.dataset.mtf) {
    const m = matDraft[+t.closest('[data-mti]').dataset.mti]; if (!m) return true;
    m[t.dataset.mtf] = t.value;
    return true;
  }
  if (t.id === 'f_photo') { paintImage(); return true; }
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
  if (t.id === 'prodFilter') { paintProducts(t.value); return true; }
  if (t.dataset.ostatus) { CLOUD.update('orders', 'id=eq.' + t.dataset.ostatus, { status: t.value }).then(() => toast('Order updated')); return true; }
  if (t.dataset.qstatus) { CLOUD.update('requests', 'id=eq.' + t.dataset.qstatus, { status: t.value }).then(() => toast('Request updated')); return true; }
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
  if (tab === 'marketing') { paintOffers(); paintVisits(); }
  if (tab === 'products') {
    if (inn() && !PRODUCTS.length) await pull();
    paintProducts($('#prodFilter')?.value || '');
    paintCustom(); paintSizes(); paintMats(); paintImage();
  }
  if (tab === 'orders') paintOrders();
  if (tab === 'requests') paintRequests();
  if (tab === 'reviews') { if (inn() && !PRODUCTS.length) await pull(); paintReviews(); }
}

return { paint, wire, wireChange, setToast: fn => { toast = fn; }, pull };
})();
