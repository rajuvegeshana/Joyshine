/* ===========================================================
   THE WORKSHOP — filament, bills and money out, plus the
   dashboard that adds them up.

   None of this is on the shop. The tables behind it are
   readable only by a signed-in session (see
   supabase/schema-7-workshop.sql), so the public key that ships
   in config.js opens nothing here.

   Every figure is counted from what you have actually recorded.
   Nothing is estimated, nothing is projected, and where there
   is no data it says so rather than showing a zero that looks
   like a fact.
   =========================================================== */
window.ADMINW = (() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
let toast = () => {};

const CLOUD = () => window.CLOUD;
const inn = () => CLOUD()?.ready() && CLOUD().signedIn();
const CFG = () => window.JOYSHINE;

const money = n => '₹' + (Math.round(+n || 0)).toLocaleString('en-IN');
const money2 = n => '₹' + (+n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const today = () => new Date().toISOString().slice(0, 10);
const grams = g => (+g || 0) >= 1000 ? ((+g) / 1000).toFixed(2) + ' kg' : Math.round(+g || 0) + ' g';

const CATEGORIES = [
  ['filament', 'Filament'], ['parts', 'Printer parts'], ['packaging', 'Packaging'],
  ['postage', 'Postage & courier'], ['tools', 'Tools'], ['power', 'Electricity'],
  ['rent', 'Rent'], ['software', 'Software'], ['fees', 'Fees & commission'],
  ['ads', 'Advertising'], ['other', 'Other'],
];
const MATERIALS = ['PLA', 'PLA+', 'Silk PLA', 'PETG', 'PGLA', 'ABS', 'TPU', 'Resin', 'Other'];
const PAID = ['Cash', 'UPI', 'Razorpay', 'Bank transfer', 'WhatsApp / pay later'];

/* everything the workshop knows, fetched once per visit */
let W = { filaments: [], left: {}, bills: [], expenses: [], orders: [], at: 0 };

async function pull(force) {
  if (!inn()) return W;
  if (!force && Date.now() - W.at < 20000) return W;
  const [filaments, left, bills, expenses, orders] = await Promise.all([
    CLOUD().rows('filaments?select=*&order=bought_on.desc&limit=400'),
    CLOUD().rows('filament_left?select=*'),
    CLOUD().rows('bills?select=*&order=billed_on.desc&limit=500'),
    CLOUD().rows('expenses?select=*&order=spent_on.desc&limit=500'),
    CLOUD().rows('orders?select=id,ref,created_at,status,channel,payment_id,totals,items,customer&order=created_at.desc&limit=200'),
  ]);
  W = {
    filaments: filaments || [], bills: bills || [], expenses: expenses || [],
    orders: orders || [], left: {}, at: Date.now(),
  };
  for (const r of left || []) W.left[r.id] = r;
  return W;
}

const gate = what => `<div class="ad-card"><h3>Sign in first</h3>
  <p class="ad-p" style="margin:0">${esc(what)} lives in your database, and only a signed-in session
  can see it. Sign in on the Publish tab.</p></div>`;

/* ===========================================================
   THE DASHBOARD
   =========================================================== */
async function dash() {
  const top = $('#dashTop'), rest = $('#dashRest');
  if (!top) return;

  top.innerHTML = `<div class="ad-strip" id="dashStrip"><span class="ad-empty">Checking…</span></div>`;
  paintStatus();

  if (!inn()) {
    rest.innerHTML = `<div class="ad-card"><h3>The rest of the dashboard</h3>
      <p class="ad-p" style="margin:0">Orders, stock, takings and spending are all in your database.
      Sign in on the Publish tab and they appear here.</p></div>`;
    return;
  }

  rest.innerHTML = '<div class="ad-card"><p class="ad-empty">Adding it up…</p></div>';
  await pull(true);

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const inMonth = d => d && d >= from;

  const paidBills = W.bills.filter(b => b.status !== 'cancelled');
  const takings = paidBills.reduce((n, b) => n + (+b.total || 0), 0);
  const takingsM = paidBills.filter(b => inMonth(b.billed_on)).reduce((n, b) => n + (+b.total || 0), 0);
  const spend = W.expenses.reduce((n, e) => n + (+e.amount || 0), 0);
  const spendM = W.expenses.filter(e => inMonth(e.spent_on)).reduce((n, e) => n + (+e.amount || 0), 0);
  const profit = takings - spend, profitM = takingsM - spendM;

  const shopOrders = W.orders.filter(o => (o.status || '') !== 'cancelled');
  const shopValue = shopOrders.reduce((n, o) => n + (+(o.totals || {}).grand || 0), 0);
  const newOrders = W.orders.filter(o => (o.status || 'new') === 'new');
  const razorpay = W.orders.filter(o => o.payment_id).length;

  const lowSpools = W.filaments.filter(f => !f.archived).map(f => ({
    ...f, left: W.left[f.id] ? +W.left[f.id].left_g : +f.weight_g,
  })).filter(f => f.left <= 150);
  const stockTotal = W.filaments.filter(f => !f.archived)
    .reduce((n, f) => n + (W.left[f.id] ? +W.left[f.id].left_g : +f.weight_g), 0);

  const key = (CFG().razorpay || {}).keyId || '';
  const rzpState = !key || /REPLACE/i.test(key) ? ['off', 'No key yet — Buy now cannot take a payment']
    : /^rzp_test/.test(key) ? ['test', 'Test key: payments are pretend, no money moves']
    : ['live', 'Live key'];

  rest.innerHTML = `
    <div class="ad-cards">
      <div class="ad-card">
        <h3>Money</h3>
        <p class="ad-p">Counted from the bills and expenses you have written down — not from the shop's
          own orders, which are listed separately below. Write a bill for a shop order and it counts once.</p>
        <div class="ad-stats">
          <div><b>${money(takingsM)}</b><span>billed this month</span></div>
          <div><b>${money(spendM)}</b><span>spent this month</span></div>
          <div><b class="${profitM >= 0 ? 'good' : 'bad'}">${money(profitM)}</b><span>difference</span></div>
        </div>
        <div class="ad-list" style="margin-top:var(--space-4)">
          <div><b>Billed, all time</b><span>${money(takings)} across ${paidBills.length} bill${paidBills.length === 1 ? '' : 's'}</span></div>
          <div><b>Spent, all time</b><span>${money(spend)} across ${W.expenses.length} entr${W.expenses.length === 1 ? 'y' : 'ies'}</span></div>
          <div><b>Difference</b><span class="${profit >= 0 ? 'good' : 'bad'}">${money(profit)}</span></div>
        </div>
        ${!paidBills.length && !W.expenses.length ? `<p class="ad-hint" style="margin-top:.7rem">
          Nothing recorded yet. Write your first bill under Billing, and your first purchase under Money out.</p>` : ''}
      </div>

      <div class="ad-card">
        <h3>Orders from the shop</h3>
        <div class="ad-stats">
          <div><b>${newOrders.length}</b><span>waiting</span></div>
          <div><b>${shopOrders.length}</b><span>all time</span></div>
          <div><b>${money(shopValue)}</b><span>their value</span></div>
        </div>
        ${W.orders.length ? `<div class="ad-list" style="margin-top:var(--space-4)">
          ${W.orders.slice(0, 5).map(o => `<div><b>${esc(o.ref || o.id.slice(0, 6))}</b>
            <span>${day(o.created_at)} · ${esc(o.channel || '')} · ${money((o.totals || {}).grand)}
            <span class="ad-pill ${o.status === 'new' ? 'ad-pill--need' : 'ad-pill--live'}">${esc(o.status || 'new')}</span></span></div>`).join('')}
        </div>` : '<p class="ad-empty" style="margin-top:.8rem">No orders yet.</p>'}
        <div class="ad-btns" style="margin-top:var(--space-4)">
          <button class="ad-btn ad-btn--ghost ad-btn--sm" data-w="goorders">Open orders</button>
        </div>
      </div>

      <div class="ad-card">
        <h3>Filament on the shelf</h3>
        <div class="ad-stats">
          <div><b>${grams(stockTotal)}</b><span>left in total</span></div>
          <div><b>${W.filaments.filter(f => !f.archived).length}</b><span>spools</span></div>
          <div><b class="${lowSpools.length ? 'bad' : ''}">${lowSpools.length}</b><span>nearly out</span></div>
        </div>
        ${lowSpools.length ? `<div class="ad-list" style="margin-top:var(--space-4)">
          ${lowSpools.slice(0, 5).map(f => `<div><b>${esc([f.brand, f.material, f.colour].filter(Boolean).join(' '))}</b>
            <span class="bad">${grams(f.left)} left</span></div>`).join('')}
        </div>` : ''}
        <div class="ad-btns" style="margin-top:var(--space-4)">
          <button class="ad-btn ad-btn--ghost ad-btn--sm" data-w="goinv">Open filament</button>
          <button class="ad-btn ad-btn--ghost ad-btn--sm" data-w="gobill">Write a bill</button>
        </div>
      </div>

      <div class="ad-card">
        <h3>Payments &amp; measurement</h3>
        <div class="ad-list">
          <div><b>Razorpay</b><span><span class="ad-pill ${rzpState[0] === 'live' ? 'ad-pill--live' : 'ad-pill--need'}">${rzpState[0]}</span> ${esc(rzpState[1])}</span></div>
          <div><b>Paid through Razorpay</b><span>${razorpay} order${razorpay === 1 ? '' : 's'} carry a payment id</span></div>
          <div><b>Google Analytics</b><span>${(CFG().analytics || {}).on && (CFG().analytics || {}).ga4
            ? `on · <code>${esc(CFG().analytics.ga4)}</code>` : 'off'}</span></div>
        </div>
        <p class="ad-hint" style="margin-top:.7rem">Razorpay's own dashboard holds the settlement dates and
          refunds. This panel never sees your Razorpay secret, so it cannot read them.</p>
      </div>
    </div>`;
}

/* the strip along the top: is the shop up, and when did it last change */
async function paintStatus() {
  const box = $('#dashStrip'); if (!box) return;
  const bits = [];

  /* the live site, asked for real */
  let up = null, ms = 0;
  const t0 = performance.now();
  try {
    const r = await fetch('index.html?ping=' + Date.now(), { cache: 'no-store' });
    ms = Math.round(performance.now() - t0);
    up = r.ok;
  } catch { up = false; }

  bits.push(`<span class="ad-chip ${up ? 'ok' : 'bad'}">
    <i></i>${up ? 'Shop is up' : 'Shop did not answer'}${up ? ` · ${ms} ms` : ''}</span>`);

  /* when the settings were last published */
  if (inn()) {
    try {
      const row = await CLOUD().read();
      if (row?.updated_at) {
        const when = new Date(row.updated_at);
        const mins = Math.round((Date.now() - when) / 60000);
        const ago = mins < 1 ? 'just now' : mins < 60 ? mins + ' min ago'
          : mins < 1440 ? Math.round(mins / 60) + ' h ago' : Math.round(mins / 1440) + ' days ago';
        bits.push(`<span class="ad-chip"><i></i>Published ${ago}
          <b>${when.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</b></span>`);
      }
    } catch {}
  }

  const occ = window.OCC?.active();
  bits.push(`<span class="ad-chip"><i></i>${occ ? 'Wearing ' + esc(occ.name) : 'No occasion running'}</span>`);
  bits.push(`<span class="ad-chip"><i></i>${inn() ? 'Signed in' : 'Not signed in'}</span>`);

  box.innerHTML = bits.join('');
}

/* ===========================================================
   FILAMENT
   =========================================================== */
async function paintInventory() {
  const box = $('#pane-inventory'); if (!box) return;
  if (!inn()) { box.innerHTML = gate('Your filament'); return; }
  box.innerHTML = '<div class="ad-card"><p class="ad-empty">Loading…</p></div>';
  await pull(true);

  const live = W.filaments.filter(f => !f.archived);
  const leftOf = f => W.left[f.id] ? +W.left[f.id].left_g : +f.weight_g;
  const usedOf = f => W.left[f.id] ? +W.left[f.id].used_g : 0;
  const total = live.reduce((n, f) => n + leftOf(f), 0);
  const spent = W.filaments.reduce((n, f) => n + (+f.price || 0), 0);
  const perG = f => (+f.price || 0) / Math.max(1, +f.weight_g);

  box.innerHTML = `
    <div class="ad-head"><div><h2>Filament</h2>
      <p>Every spool you have bought, what it cost, and how much of it is left. What is left is
        counted from the bills that named the spool — nothing is guessed.</p></div></div>

    <div class="ad-stats">
      <div><b>${grams(total)}</b><span>on the shelf</span></div>
      <div><b>${live.length}</b><span>open spools</span></div>
      <div><b>${money(spent)}</b><span>spent on filament</span></div>
      <div><b>${live.length ? money2(live.reduce((n, f) => n + perG(f) * leftOf(f), 0)) : '—'}</b><span>value left</span></div>
    </div>

    <div class="ad-card">
      <h3>Add a spool</h3>
      <div class="ad-grid3">
        <label class="ad-field"><span>Date of purchase <i>*</i></span><input type="date" id="fBought" value="${today()}"></label>
        <label class="ad-field"><span>Material <i>*</i></span><select id="fMat">
          ${MATERIALS.map(m => `<option>${m}</option>`).join('')}</select></label>
        <label class="ad-field"><span>Brand</span><input id="fBrand" placeholder="e.g. Wol3D"></label>
      </div>
      <div class="ad-grid3">
        <label class="ad-field"><span>Colour</span><input id="fColour" placeholder="Pearl white"></label>
        <label class="ad-field"><span>Weight (grams) <i>*</i></span><input type="number" id="fWeight" min="1" value="1000"></label>
        <label class="ad-field"><span>Price paid (₹) <i>*</i></span><input type="number" id="fPrice" min="0" step="0.01" placeholder="1099"></label>
      </div>
      <div class="ad-grid3">
        <label class="ad-field"><span>Bought from</span><input id="fVendor" placeholder="Shop or website"></label>
        <label class="ad-field"><span>Your label</span><input id="fCode" placeholder="e.g. W-14"></label>
        <label class="ad-field"><span>Note</span><input id="fNote" placeholder="anything worth remembering"></label>
      </div>
      <label class="ad-chk" style="margin-bottom:var(--space-4)">
        <input type="checkbox" id="fExpense" checked>
        <i>Also record the price under Money out, so it counts against your takings</i></label>
      <button class="ad-btn ad-btn--primary" data-w="fadd">Add the spool</button>
    </div>

    ${live.length ? `<div class="ad-card">
      <h3>On the shelf</h3>
      <div class="ad-spools">
        ${live.map(f => {
          const l = leftOf(f), pc = Math.max(0, Math.min(100, l / Math.max(1, +f.weight_g) * 100));
          return `<div class="ad-spool${l <= 150 ? ' low' : ''}" data-fid="${f.id}">
            <div class="ad-spool__top">
              <b>${esc([f.brand, f.material, f.colour].filter(Boolean).join(' ') || f.material)}</b>
              ${f.spool_code ? `<span class="ad-pill">${esc(f.spool_code)}</span>` : ''}
            </div>
            <div class="ad-bar"><i style="width:${pc.toFixed(1)}%"></i></div>
            <div class="ad-spool__foot">
              <span>${grams(l)} left of ${grams(f.weight_g)}</span>
              <span>${money2(f.price)} · ${money2(perG(f) * 1000)}/kg</span>
            </div>
            <div class="ad-spool__meta">
              Bought ${day(f.bought_on)}${f.vendor ? ' · ' + esc(f.vendor) : ''}
              ${usedOf(f) ? ` · used ${grams(usedOf(f))}` : ''}
            </div>
            <div class="ad-btns" style="margin:0">
              <button class="ad-btn ad-btn--ghost ad-btn--sm" data-w="fbill" data-id="${f.id}">Bill from this</button>
              <button class="ad-btn ad-btn--ghost ad-btn--sm" data-w="fdone" data-id="${f.id}">Finished</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : '<div class="ad-card"><p class="ad-empty">No spools yet. Add the one on the printer.</p></div>'}

    ${W.filaments.some(f => f.archived) ? `<details class="ad-card ad-fold">
      <summary><h3>Finished spools</h3><span class="ad-fold__n">${W.filaments.filter(f => f.archived).length}</span></summary>
      <div class="ad-list">${W.filaments.filter(f => f.archived).map(f => `<div>
        <b>${esc([f.brand, f.material, f.colour].filter(Boolean).join(' '))}</b>
        <span>${day(f.bought_on)} · ${money2(f.price)} · used ${grams(usedOf(f))}
        <button class="ad-btn ad-btn--ghost ad-btn--sm" data-w="fback" data-id="${f.id}">Back on the shelf</button></span>
      </div>`).join('')}</div>
    </details>` : ''}`;
}

/* ===========================================================
   BILLING
   =========================================================== */
let billRows = [{ id: '', name: '', qty: 1, price: 0 }];

function billProducts() {
  const rows = (window.ADMINX && window.ADMINX.list) ? window.ADMINX.list() : [];
  if (rows.length) return rows;
  return (window.PRODUCTS || []).map(p => ({ id: p.id, name: p.name, price: p.price }));
}

async function paintBilling() {
  const box = $('#pane-billing'); if (!box) return;
  if (!inn()) { box.innerHTML = gate('Your bills'); return; }
  box.innerHTML = '<div class="ad-card"><p class="ad-empty">Loading…</p></div>';
  await pull(true);

  const live = W.filaments.filter(f => !f.archived);
  const paid = W.bills.filter(b => b.status !== 'cancelled');
  const sum = paid.reduce((n, b) => n + (+b.total || 0), 0);
  const gsum = paid.reduce((n, b) => n + (+b.grams || 0), 0);

  box.innerHTML = `
    <div class="ad-head"><div><h2>Billing</h2>
      <p>Write up anything you sell, whether it came through the shop or somebody walked in.
        This is your own record — it is never shown to anyone.</p></div></div>

    <div class="ad-stats">
      <div><b>${money(sum)}</b><span>billed in total</span></div>
      <div><b>${paid.length}</b><span>bills</span></div>
      <div><b>${grams(gsum)}</b><span>filament used</span></div>
      <div><b>${paid.length ? money(sum / paid.length) : '—'}</b><span>average bill</span></div>
    </div>

    <div class="ad-card">
      <h3>Write a bill</h3>
      <div class="ad-grid3">
        <label class="ad-field"><span>Date <i>*</i></span><input type="date" id="bDate" value="${today()}"></label>
        <label class="ad-field"><span>Customer</span><input id="bName" placeholder="Name, or leave blank"></label>
        <label class="ad-field"><span>Mobile</span><input id="bPhone" placeholder="98765 43210"></label>
      </div>

      <h4 class="ad-sub">What they took</h4>
      <div id="billRows"></div>
      <button class="ad-btn ad-btn--ghost ad-btn--sm" data-w="browadd" style="margin-bottom:var(--space-4)">+ Another line</button>

      <div class="ad-grid3">
        <label class="ad-field"><span>Filament used (grams)</span><input type="number" id="bGrams" min="0" step="0.1" placeholder="e.g. 120"></label>
        <label class="ad-field"><span>From which spool</span><select id="bSpool">
          <option value="">not recorded</option>
          ${live.map(f => `<option value="${f.id}">${esc([f.brand, f.material, f.colour].filter(Boolean).join(' '))}${
            f.spool_code ? ' · ' + esc(f.spool_code) : ''}</option>`).join('')}
        </select></label>
        <label class="ad-field"><span>Paid by</span><select id="bPaid">
          ${PAID.map(p => `<option>${p}</option>`).join('')}</select></label>
      </div>

      <div class="ad-grid3">
        <label class="ad-field"><span>Discount (₹)</span><input type="number" id="bDisc" min="0" step="0.01" value="0"></label>
        <label class="ad-field"><span>Delivery (₹)</span><input type="number" id="bShip" min="0" step="0.01" value="0"></label>
        <label class="ad-field"><span>Status</span><select id="bStatus">
          <option value="paid">Paid</option><option value="pending">Not paid yet</option></select></label>
      </div>

      <label class="ad-field"><span>Note</span><input id="bNote" placeholder="anything worth remembering"></label>

      <div class="ad-total" id="bTotal"></div>
      <button class="ad-btn ad-btn--primary" data-w="badd">Save this bill</button>
    </div>

    ${W.bills.length ? `<div class="ad-card">
      <h3>Bills</h3>
      <div class="ad-rows">
        ${W.bills.map(b => `<div class="ad-row2${b.status === 'cancelled' ? ' off' : ''}" data-bid="${b.id}">
          <div>
            <b>${esc(b.ref || '—')}</b>
            <span>${day(b.billed_on)}${b.customer ? ' · ' + esc(b.customer) : ''}
              · ${(b.items || []).length} line${(b.items || []).length === 1 ? '' : 's'}${
              +b.grams ? ' · ' + grams(b.grams) : ''}</span>
          </div>
          <div class="ad-row2__end">
            <b>${money2(b.total)}</b>
            <span class="ad-pill ${b.status === 'paid' ? 'ad-pill--live' : 'ad-pill--need'}">${esc(b.status)}</span>
            <button class="ad-o__more" data-w="bprint" data-id="${b.id}">Print</button>
            <button class="ad-o__more ad-o__more--warn" data-w="bdel" data-id="${b.id}">Delete</button>
          </div>
        </div>`).join('')}
      </div>
    </div>` : ''}`;

  paintBillRows();
}

function paintBillRows() {
  const box = $('#billRows'); if (!box) return;
  const prods = billProducts();
  box.innerHTML = billRows.map((r, i) => `
    <div class="ad-billrow" data-bri="${i}">
      <select data-br="id">
        <option value="">— pick a product, or type below —</option>
        ${prods.map(p => `<option value="${esc(p.id)}"${r.id === p.id ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}
      </select>
      <input data-br="name" value="${esc(r.name)}" placeholder="or write it yourself">
      <input data-br="qty" type="number" min="1" value="${r.qty}" title="Quantity">
      <input data-br="price" type="number" min="0" step="0.01" value="${r.price}" title="Price each">
      <button class="ad-o__more ad-o__more--warn" data-w="browdel"${billRows.length === 1 ? ' disabled' : ''}>&times;</button>
    </div>`).join('');
  paintBillTotal();
}

function billSums() {
  const sub = billRows.reduce((n, r) => n + (+r.qty || 0) * (+r.price || 0), 0);
  const disc = +($('#bDisc')?.value) || 0;
  const ship = +($('#bShip')?.value) || 0;
  return { sub, disc, ship, total: Math.max(0, sub - disc) + ship };
}

function paintBillTotal() {
  const el = $('#bTotal'); if (!el) return;
  const { sub, disc, ship, total } = billSums();
  const g = +($('#bGrams')?.value) || 0;
  const spool = W.filaments.find(f => f.id === $('#bSpool')?.value);
  const cost = spool && g ? (+spool.price || 0) / Math.max(1, +spool.weight_g) * g : 0;
  el.innerHTML = `
    <div><span>Lines</span><b>${money2(sub)}</b></div>
    ${disc ? `<div><span>Less discount</span><b>−${money2(disc)}</b></div>` : ''}
    ${ship ? `<div><span>Delivery</span><b>${money2(ship)}</b></div>` : ''}
    <div class="ad-total__big"><span>Total</span><b>${money2(total)}</b></div>
    ${cost ? `<div class="ad-total__note"><span>Filament in it</span><b>${money2(cost)} — about
      ${total ? Math.round(cost / total * 100) : 0}% of the bill</b></div>` : ''}`;
}

/* ===========================================================
   MONEY OUT
   =========================================================== */
async function paintExpenses() {
  const box = $('#pane-expenses'); if (!box) return;
  if (!inn()) { box.innerHTML = gate('Your spending'); return; }
  box.innerHTML = '<div class="ad-card"><p class="ad-empty">Loading…</p></div>';
  await pull(true);

  const now = new Date();
  const mFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const yFrom = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const sum = list => list.reduce((n, e) => n + (+e.amount || 0), 0);
  const month = W.expenses.filter(e => e.spent_on >= mFrom);
  const year = W.expenses.filter(e => e.spent_on >= yFrom);

  const byCat = {};
  for (const e of year) byCat[e.category || 'other'] = (byCat[e.category || 'other'] || 0) + (+e.amount || 0);
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const catMax = Math.max(1, ...Object.values(byCat));

  box.innerHTML = `
    <div class="ad-head"><div><h2>Money out</h2>
      <p>Every rupee that leaves — filament, packaging, postage, electricity, fees. Keep this honest and
        the dashboard's profit figure means something.</p></div></div>

    <div class="ad-stats">
      <div><b>${money(sum(month))}</b><span>this month</span></div>
      <div><b>${money(sum(year))}</b><span>this year</span></div>
      <div><b>${money(sum(W.expenses))}</b><span>all time</span></div>
      <div><b>${W.expenses.length}</b><span>entries</span></div>
    </div>

    <div class="ad-card">
      <h3>Record a spend</h3>
      <div class="ad-grid3">
        <label class="ad-field"><span>Date <i>*</i></span><input type="date" id="eDate" value="${today()}"></label>
        <label class="ad-field"><span>What for <i>*</i></span><select id="eCat">
          ${CATEGORIES.map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></label>
        <label class="ad-field"><span>Amount (₹) <i>*</i></span><input type="number" id="eAmt" min="0" step="0.01"></label>
      </div>
      <div class="ad-grid2">
        <label class="ad-field"><span>Paid to</span><input id="eVendor" placeholder="Shop, website or person"></label>
        <label class="ad-field"><span>Note</span><input id="eNote" placeholder="what it was"></label>
      </div>
      <div class="ad-up" data-drop="receipt">
        <input type="file" id="eFile" accept="image/*,.pdf" hidden>
        <button class="ad-btn ad-btn--ghost ad-btn--sm" data-w="epick">Attach the bill</button>
        <span class="ad-hint" id="eMsg">A photo or a PDF. Kept private — only a signed-in session can open it.</span>
      </div>
      <input type="hidden" id="eUrl">
      <button class="ad-btn ad-btn--primary" data-w="eadd" style="margin-top:var(--space-4)">Save it</button>
    </div>

    ${top.length ? `<div class="ad-card">
      <h3>Where it went this year</h3>
      <div class="ad-catbars">
        ${top.map(([k, v]) => `<div class="ad-catbar">
          <span>${esc((CATEGORIES.find(c => c[0] === k) || [, k])[1])}</span>
          <div class="ad-bar"><i style="width:${(v / catMax * 100).toFixed(1)}%"></i></div>
          <b>${money(v)}</b></div>`).join('')}
      </div>
    </div>` : ''}

    ${W.expenses.length ? `<div class="ad-card">
      <h3>Everything recorded</h3>
      <div class="ad-rows">
        ${W.expenses.map(e => `<div class="ad-row2" data-eid="${e.id}">
          <div><b>${esc((CATEGORIES.find(c => c[0] === e.category) || [, e.category])[1])}</b>
            <span>${day(e.spent_on)}${e.vendor ? ' · ' + esc(e.vendor) : ''}${e.note ? ' · ' + esc(e.note) : ''}</span></div>
          <div class="ad-row2__end">
            <b>${money2(e.amount)}</b>
            ${e.bill_url ? `<button class="ad-o__more" data-w="ebill" data-id="${e.id}">Bill</button>` : ''}
            <button class="ad-o__more ad-o__more--warn" data-w="edel" data-id="${e.id}">Delete</button>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '<div class="ad-card"><p class="ad-empty">Nothing recorded yet.</p></div>'}`;

  wireReceipt();
}

/* ===========================================================
   DOING THINGS
   =========================================================== */
const ref = p => p + '-' + Date.now().toString(36).toUpperCase().slice(-6);
const val = id => $('#' + id)?.value.trim() || '';
const num = id => +($('#' + id)?.value) || 0;

async function addFilament() {
  const weight = num('fWeight'), price = num('fPrice');
  if (!weight) { toast('How many grams was the spool?'); return true; }
  if (!val('fBought')) { toast('When did you buy it?'); return true; }
  const row = {
    brand: val('fBrand'), material: val('fMat'), colour: val('fColour'),
    weight_g: weight, price, bought_on: val('fBought'),
    vendor: val('fVendor'), spool_code: val('fCode'), notes: val('fNote'),
  };
  try {
    const saved = await CLOUD().upsert('filaments', row);
    if ($('#fExpense')?.checked && price > 0) {
      await CLOUD().upsert('expenses', {
        spent_on: row.bought_on, category: 'filament', vendor: row.vendor, amount: price,
        note: [row.brand, row.material, row.colour, grams(weight)].filter(Boolean).join(' '),
        filament_id: Array.isArray(saved) ? saved[0]?.id : saved?.id,
      });
    }
    toast('Spool added');
    await paintInventory();
  } catch (e) { toast(e.message); }
  return true;
}

async function addBill() {
  const lines = billRows.filter(r => (r.name || r.id) && +r.qty > 0);
  if (!lines.length) { toast('Put at least one line on it'); return true; }
  const { sub, disc, ship, total } = billSums();
  const row = {
    ref: ref('JB'), billed_on: val('bDate') || today(),
    customer: val('bName'), phone: val('bPhone'),
    items: lines.map(r => ({ id: r.id || null, name: r.name || r.id, qty: +r.qty, price: +r.price })),
    grams: num('bGrams'), spool_id: $('#bSpool')?.value || null,
    subtotal: sub, discount: disc, shipping: ship, total,
    paid_via: val('bPaid'), status: $('#bStatus')?.value || 'paid', notes: val('bNote'),
  };
  try {
    await CLOUD().upsert('bills', row);
    billRows = [{ id: '', name: '', qty: 1, price: 0 }];
    toast('Bill saved · ' + row.ref);
    await paintBilling();
  } catch (e) { toast(e.message); }
  return true;
}

async function addExpense() {
  const amt = num('eAmt');
  if (!amt) { toast('How much was it?'); return true; }
  try {
    await CLOUD().upsert('expenses', {
      spent_on: val('eDate') || today(), category: $('#eCat').value,
      vendor: val('eVendor'), amount: amt, note: val('eNote'), bill_url: val('eUrl') || null,
    });
    toast('Recorded');
    await paintExpenses();
  } catch (e) { toast(e.message); }
  return true;
}

/* a receipt is private, so it is fetched with the session and shown
   from a blob rather than linked to */
async function openPrivate(path) {
  try {
    const base = CFG().supabase.url.replace(/\/+$/, '');
    const tok = JSON.parse(localStorage.getItem('joyshine.cloud.session') || 'null')?.access_token;
    const r = await fetch(`${base}/storage/v1/object/receipts/${path}`, {
      headers: { apikey: CFG().supabase.anonKey, Authorization: 'Bearer ' + tok },
    });
    if (!r.ok) throw new Error('could not open it');
    const url = URL.createObjectURL(await r.blob());
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) { toast(e.message); }
}

function wireReceipt() {
  const f = $('#eFile');
  if (f && !f.dataset.wired) {
    f.dataset.wired = '1';
    f.addEventListener('change', async e => {
      const file = e.target.files[0]; e.target.value = ''; if (!file) return;
      const msg = $('#eMsg');
      msg.textContent = 'Uploading…';
      try {
        const base = CFG().supabase.url.replace(/\/+$/, '');
        const tok = JSON.parse(localStorage.getItem('joyshine.cloud.session') || 'null')?.access_token;
        const name = `${today()}/${Date.now().toString(36)}-${file.name.replace(/[^\w.\-]+/g, '')}`;
        const r = await fetch(`${base}/storage/v1/object/receipts/${encodeURI(name)}`, {
          method: 'POST',
          headers: { apikey: CFG().supabase.anonKey, Authorization: 'Bearer ' + tok,
                     'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        });
        if (!r.ok) throw new Error('that upload did not go through');
        $('#eUrl').value = name;
        msg.textContent = 'Attached: ' + file.name;
      } catch (ex) { msg.textContent = ex.message; }
    });
  }
}

/* a bill you can hand over or keep */
function printBill(id) {
  const b = W.bills.find(x => x.id === id); if (!b) return;
  const w = window.open('', '_blank');
  if (!w) { toast('Allow pop-ups to print a bill'); return; }
  const rows = (b.items || []).map(i => `<tr><td>${esc(i.name)}</td><td>${i.qty}</td>
    <td style="text-align:right">${money2(i.price)}</td>
    <td style="text-align:right">${money2(i.qty * i.price)}</td></tr>`).join('');
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(b.ref)}</title>
    <style>
      body { font: 15px/1.6 system-ui, sans-serif; color: #23203a; max-width: 640px; margin: 40px auto; padding: 0 20px; }
      h1 { font-size: 1.4rem; margin: 0 0 4px; }
      table { width: 100%; border-collapse: collapse; margin: 22px 0; }
      th, td { padding: 8px 6px; border-bottom: 1px solid #e6e3f0; text-align: left; }
      tfoot td { border: 0; font-weight: 600; }
      .muted { color: #6b6588; font-size: .88rem; }
      @media print { body { margin: 0; } }
    </style>
    <h1>${esc(CFG().brand.name)}</h1>
    <p class="muted">${esc(CFG().brand.origin || '')} · ${esc(CFG().brand.email || '')}</p>
    <p><b>${esc(b.ref)}</b><br><span class="muted">${day(b.billed_on)}</span></p>
    ${b.customer ? `<p>${esc(b.customer)}${b.phone ? '<br>' + esc(b.phone) : ''}</p>` : ''}
    <table><thead><tr><th>Item</th><th>Qty</th><th style="text-align:right">Each</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      ${+b.discount ? `<tr><td colspan="3" style="text-align:right">Discount</td><td style="text-align:right">−${money2(b.discount)}</td></tr>` : ''}
      ${+b.shipping ? `<tr><td colspan="3" style="text-align:right">Delivery</td><td style="text-align:right">${money2(b.shipping)}</td></tr>` : ''}
      <tr><td colspan="3" style="text-align:right">Total</td><td style="text-align:right">${money2(b.total)}</td></tr>
    </tfoot></table>
    <p class="muted">${esc(b.paid_via || '')}${b.status === 'pending' ? ' · not paid yet' : ''}</p>
    <script>print()<\/script>`);
  w.document.close();
}

/* ===========================================================
   EVENTS
   =========================================================== */
function wire(t) {
  const el = t.closest('[data-w]');
  const act = el?.dataset.w;
  if (!act) return false;
  const id = el.dataset.id;
  const go = tab => { $(`.ad-tab[data-tab="${tab}"]`)?.click(); return true; };

  if (act === 'goorders') return go('orders');
  if (act === 'goinv')    return go('inventory');
  if (act === 'gobill')   return go('billing');

  if (act === 'fadd')  { addFilament(); return true; }
  if (act === 'fdone') { CLOUD().update('filaments', 'id=eq.' + id, { archived: true }).then(() => paintInventory()); return true; }
  if (act === 'fback') { CLOUD().update('filaments', 'id=eq.' + id, { archived: false }).then(() => paintInventory()); return true; }
  if (act === 'fbill') { go('billing'); setTimeout(() => { const s = $('#bSpool'); if (s) s.value = id; }, 600); return true; }

  if (act === 'browadd') { billRows.push({ id: '', name: '', qty: 1, price: 0 }); paintBillRows(); return true; }
  if (act === 'browdel') {
    const i = +el.closest('[data-bri]').dataset.bri;
    if (billRows.length > 1) { billRows.splice(i, 1); paintBillRows(); }
    return true;
  }
  if (act === 'badd')   { addBill(); return true; }
  if (act === 'bprint') { printBill(id); return true; }
  if (act === 'bdel')   {
    if (confirm('Delete this bill? Your records will no longer show it.'))
      CLOUD().remove('bills', 'id=eq.' + id).then(() => paintBilling());
    return true;
  }

  if (act === 'epick') { $('#eFile').click(); return true; }
  if (act === 'eadd')  { addExpense(); return true; }
  if (act === 'ebill') { const e = W.expenses.find(x => x.id === id); if (e?.bill_url) openPrivate(e.bill_url); return true; }
  if (act === 'edel')  {
    if (confirm('Delete this entry?')) CLOUD().remove('expenses', 'id=eq.' + id).then(() => paintExpenses());
    return true;
  }
  return false;
}

function wireChange(t) {
  if (t.dataset.br) {
    const i = +t.closest('[data-bri]').dataset.bri;
    const r = billRows[i]; if (!r) return true;
    const k = t.dataset.br;
    r[k] = k === 'qty' || k === 'price' ? +t.value : t.value;
    /* picking a product fills in its name and price */
    if (k === 'id' && t.value) {
      const p = billProducts().find(x => x.id === t.value);
      if (p) { r.name = p.name; r.price = +p.price || 0; paintBillRows(); return true; }
    }
    paintBillTotal();
    return true;
  }
  if (['bDisc', 'bShip', 'bGrams', 'bSpool'].includes(t.id)) { paintBillTotal(); return true; }
  return false;
}

function paint(tab) {
  if (tab === 'inventory') paintInventory();
  if (tab === 'billing')   paintBilling();
  if (tab === 'expenses')  paintExpenses();
}

return { paint, dash, wire, wireChange, setToast: fn => { toast = fn; } };
})();
