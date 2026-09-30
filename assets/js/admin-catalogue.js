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
      <label class="ad-field"><span>Photo URL (optional)</span><input id="f_photo" value="${esc(p.photo)}" placeholder="assets/img/thing.jpg"></label>
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
      <h3>Options the customer picks</h3>
      <label class="ad-row--switch"><input type="checkbox" id="v_size"${v.size ? ' checked' : ''}>
        <span><b>Sizes</b><i>Small to X-Large, with the price steps built in.</i></span></label>
      <label class="ad-row--switch"><input type="checkbox" id="v_material"${v.material ? ' checked' : ''}>
        <span><b>Materials</b><i>PLA, PGLA and ABS, priced accordingly.</i></span></label>
      <label class="ad-row--switch" style="margin:0"><input type="checkbox" id="v_colour"${v.colour ? ' checked' : ''}>
        <span><b>Colours</b><i>Eight filament colours. The drawn art recolours to match.</i></span></label>
    </div>
  </div>

  <div class="ad-card">
    <h3>Personalisation</h3>
    <div class="ad-grid3">
      <label class="ad-field"><span>What you ask for (blank = none)</span><input id="p_label" value="${esc(p.personalise?.label)}" placeholder="Name to print"></label>
      <label class="ad-field"><span>Character limit</span><input id="p_max" type="number" min="1" value="${p.personalise?.max ?? 20}"></label>
      <label class="ad-field" style="margin-bottom:0"><span>Example</span><input id="p_ph" value="${esc(p.personalise?.placeholder)}" placeholder="e.g. Aarohi"></label>
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
  if (on('v_size') && V.SIZES) variants.size = V.SIZES;
  if (on('v_material') && V.MATERIALS) variants.material = V.MATERIALS;
  if (on('v_colour') && V.COLOURS) variants.colour = V.COLOURS;
  if (Object.keys(variants).length) data.variants = variants;

  if (g('p_label')) data.personalise = { label: g('p_label'), max: n('p_max') || 20, placeholder: g('p_ph') };

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

/* ---------- events --------------------------------------- */
function wire(t) {
  const act = t.closest('[data-x]')?.dataset.x;

  if (act === 'seed') return seed();
  if (act === 'new') { editing = { id: '', isNew: true, data: { tags: [], specs: {}, details: {} }, sort: PRODUCTS.length }; paintProducts(); return true; }
  if (act === 'edit') {
    const id = t.closest('[data-pid]').dataset.pid;
    editing = PRODUCTS.find(r => r.id === id); paintProducts(); return true;
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
  if (t.id === 'prodFilter') { paintProducts(t.value); return true; }
  if (t.dataset.ostatus) { CLOUD.update('orders', 'id=eq.' + t.dataset.ostatus, { status: t.value }).then(() => toast('Order updated')); return true; }
  if (t.dataset.qstatus) { CLOUD.update('requests', 'id=eq.' + t.dataset.qstatus, { status: t.value }).then(() => toast('Request updated')); return true; }
  return false;
}

async function paint(tab) {
  if (tab === 'products') { if (inn() && !PRODUCTS.length) await pull(); paintProducts($('#prodFilter')?.value || ''); }
  if (tab === 'orders') paintOrders();
  if (tab === 'requests') paintRequests();
  if (tab === 'reviews') { if (inn() && !PRODUCTS.length) await pull(); paintReviews(); }
}

return { paint, wire, wireChange, setToast: fn => { toast = fn; }, pull };
})();
