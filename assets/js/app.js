/* ===========================================================
   APP — router, interactions, WhatsApp + Razorpay handoff.
   =========================================================== */
(() => {
'use strict';

const CFG = window.JOYSHINE;
const { I, esc } = window.V;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => S.money(n);

/* ===== THEME ============================================== */
const THEMES = {
  clay: 'Clay', retro: 'Retro', future: 'Futuristic',
  halloween: 'Halloween', diwali: 'Diwali', holi: 'Holi',
  christmas: 'Christmas', navratri: 'Navratri',
  ganesh: 'Ganesh', krishna: 'Krishna', tiranga: 'Tiranga',
};

/* a visitor picking a swatch: remembered, and tied to whichever
   occasion is running so the next festival can still re-skin them */
function setTheme(name, say) {
  if (!THEMES[name]) name = CFG.defaultTheme;
  paintTheme(name);
  S.write(S.K.theme, name);
  try { localStorage.setItem('joyshine.themeOcc', window.OCC_NOW ? window.OCC_NOW.id : ''); } catch {}
  if (say) toast(`${THEMES[name]} look loaded`);
}

function paintTheme(name) {
  document.documentElement.dataset.theme = name;
  window.KIT?.apply(name);
  window.SKIN?.cursors();   /* a look may bring its own pointer */
  $$('.themer button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.set === name)));
}

/* route lock > admin override > today's occasion > default.
   The shop has no theme picker any more: the look is the owner's
   decision, set in the control panel. */
function applyTheme(lock) {
  document.body.classList.toggle('theme-locked', !!lock);
  paintTheme(window.SETTINGS.theme(lock, window.OCC_NOW));
}

/* ===== TOASTS ============================================= */
function toast(msg, icon, ms = 4000) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = (icon || I.check) + '<span>' + esc(msg) + '</span>';
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, ms);
}
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cols = ['--brand', '--accent', '--art-1', '--art-3', '--wa'];
  for (let i = 0; i < 26; i++) {
    const d = document.createElement('i'); d.className = 'burst';
    const s = 6 + Math.random() * 8;
    d.style.cssText = `width:${s}px;height:${s}px;left:50%;top:38%;background:var(${cols[i % cols.length]});border-radius:${Math.random() > .5 ? '50%' : '2px'}`;
    document.body.appendChild(d);
    const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 260;
    d.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * r - 50}%, ${Math.sin(a) * r + 240}%) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 }],
      { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => d.remove();
  }
}

/* ===== MOTION ============================================= */
let io;
function reveals(root) {
  io = io || new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px', threshold: .05 });
  $$('.r', root || document).forEach(el => io.observe(el));
}
function sparkles() {
  const box = $('#sparkles'); if (!box) return;
  box.innerHTML = Array.from({ length: 16 }, () => {
    const s = 4 + Math.random() * 8;
    return `<i style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-delay:${Math.random() * 4.5}s"></i>`;
  }).join('');
}

/* ===== ROUTER ============================================= */
function parse() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  const seg = path.split('/').filter(Boolean);
  return { path, seg, q };
}

let pdp = null;   // product page state

function render() {
  const { seg, q } = parse();
  const view = $('#view');
  /* the homepage wears the SEO title; inner pages prefix their own */
  let html, title = CFG.seo?.title || CFG.brand.name;
  pdp = null;

  /* the engineering line wears its own look, whatever else is on */
  applyTheme(seg[0] === 'engineering' && CFG.engineering.active && CFG.engineering.ownLook
    ? CFG.engineering.theme : null);

  switch (seg[0]) {
    case undefined:  html = V.home(); break;
    case 'shop':     html = V.shop(q); title = 'Shop · ' + title; break;
    case 'c':        html = V.shop({ ...q, cat: seg[1] }); title = S.catName(seg[1]) + ' · ' + title; break;
    case 'p': {
      const p = S.byId(seg[1]);
      if (p) { pdp = { p, v: S.defaults(p), qty: 1, note: '' }; S.sawProduct(p.id);
               window.CUSTOM.reset(); title = p.name + ' · ' + title; }
      html = p ? V.product(seg[1], pdp?.v) : V.missingProduct(); break;
    }
    case 'search':   html = V.searchPage(q.q || ''); title = 'Search · ' + title; break;
    case 'custom':   html = V.custom(q); title = 'Custom print · ' + title; break;
    case 'wishlist': html = V.wishlist(); title = 'Wishlist · ' + title; break;
    case 'engineering':
      html = V.engineering();
      title = CFG.engineering.name + ' · ' + CFG.brand.name; break;
    case 'faq':      html = V.faq(); title = 'FAQ · ' + title; break;
    case 'privacy':  html = LEGAL.privacy();  title = 'Privacy · ' + CFG.brand.name; break;
    case 'terms':    html = LEGAL.terms();    title = 'Terms · ' + CFG.brand.name; break;
    case 'refunds':  html = LEGAL.refunds();  title = 'Refunds · ' + CFG.brand.name; break;
    case 'shipping': html = LEGAL.shipping(); title = 'Shipping · ' + CFG.brand.name; break;
    case 'contact':  html = LEGAL.contact();  title = 'Contact · ' + CFG.brand.name; break;
    case 'about':    html = V.about(); title = 'About · ' + title; break;
    case 'gone':     html = V.errorPage('notFound', q.from
                       ? `<p class="quiet oops__from">Nothing lives at <code>${esc(q.from)}</code>.</p>` : '');
                     title = 'Not found · ' + title; break;
    default:         html = V.notFound();
  }

  view.innerHTML = html;
  /* a dead end is not a place to browse a sitemap: the page offers its
     own way out, and the footer only repeats it at twice the length */
  document.body.classList.toggle('no-foot', !!view.querySelector('.oops'));
  document.title = title;
  window.KIT?.apply(document.documentElement.dataset.theme);
  window.SKIN?.apply(view);
  fillBrand(view);
  reveals(view); sparkles();
  const track = $('#stripTrack'); if (track) track.innerHTML += track.innerHTML;
  if (seg[0] === 'custom') setupCustom(q);
  if (pdp) syncPdp();
  markNav();
  GA.page(parse().path, title);
  if (pdp) GA.event('view_item', { currency: CFG.currency, value: S.unitPrice(pdp.p, pdp.v),
                                   items: [GA.item(pdp.p, 1, S.variantText(pdp.p, pdp.v))] });
  scrollTo({ top: 0, behavior: 'instant' });
}

/* the policy links only appear once the pages are actually complete */
function showLegalLinks() {
  const ok = CFG.legal?.published && window.LEGAL.ready();
  const box = $('#legalLinks');
  if (box) box.hidden = !ok;
}

function applySeo() {
  const s = CFG.seo || {};
  if (s.title) document.title = s.title;
  const set = (sel, attr, val) => { if (!val) return; const el = $(sel); if (el) el.setAttribute(attr, val); };
  set('meta[name="description"]', 'content', s.description);
  set('meta[property="og:title"]', 'content', s.title);
  set('meta[property="og:description"]', 'content', s.description);
  if (s.keywords) {
    let m = $('meta[name="keywords"]');
    if (!m) { m = document.createElement('meta'); m.name = 'keywords'; document.head.appendChild(m); }
    m.content = s.keywords;
  }
  if (s.ogImage) {
    let m = $('meta[property="og:image"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute('property', 'og:image'); document.head.appendChild(m); }
    m.content = s.ogImage;
  }
}

function fillBrand(root = document) {
  $$('[data-brand]', root).forEach(el => el.textContent = CFG.brand.name);
  $$('[data-year]', root).forEach(el => el.textContent = new Date().getFullYear());
  $$('[data-origin]', root).forEach(el => el.textContent = CFG.brand.origin);
  $$('[data-freeabove]', root).forEach(el => el.textContent = money(CFG.shipping.freeAbove));
  $$('[data-instagram]', root).forEach(el => el.href = CFG.brand.instagram);
  $$('[data-email]', root).forEach(el => { el.href = 'mailto:' + CFG.brand.email; el.textContent = CFG.brand.email; });
  const pretty = '+' + CFG.whatsapp.number.replace(/^(\d{2})(\d{5})(\d+)$/, '$1 $2 $3');
  ['#waNumber', '#waNumber2', '#waNumber3'].forEach(s => { const e = $(s, root) || $(s); if (e) e.textContent = pretty; });
  const call = $('#waCall'); if (call) call.href = 'tel:+' + CFG.whatsapp.number;
}

function markNav() {
  const p = parse().path;
  $$('[data-nav]').forEach(a => {
    const href = a.getAttribute('href').replace(/^#/, '').split('?')[0];
    a.classList.toggle('on', href === p || (href !== '/' && p.startsWith(href)));
  });
}

/* ===== PRODUCT PAGE ======================================= */
function syncPdp() {
  if (!pdp) return;
  const { p, v, qty } = pdp;
  const unit = S.unitPrice(p, v);
  const off = p.bulk ? S.bulkOff(qty) : 0;
  const hex = S.colourHex(p, v);

  const price = $('#pdpPrice');
  if (price) price.textContent = money(off ? Math.round(unit * (1 - off / 100)) : unit);
  const stage = $('#pdpStage svg');
  if (stage && hex) stage.style.setProperty('--art-1', hex);
  $('#pdpQty') && ($('#pdpQty').textContent = qty);
  const bulk = $('#pdpBulk');
  if (bulk) bulk.textContent = off ? `${off}% bulk discount applied · ${money(Math.round(unit * qty * (1 - off / 100)))} total`
    : (p.bulk && qty < 5 ? `Buy 5 or more for ${CFG.bulk.tiers[1].off}% off` : '');
  $$('[data-v]').forEach(b => b.classList.toggle('on', v[b.dataset.v] === b.dataset.val));
  const now = $('.sel__now');
  if (now) now.innerHTML = V.selNow(p, v);
}

function pdpItem() {
  const opts = window.CUSTOM.read(pdp.p);
  return { id: pdp.p.id, v: pdp.v, note: window.CUSTOM.summarise(opts),
           opts: Object.keys(opts).length ? opts : undefined, qty: pdp.qty };
}
/* every required option filled in? */
function pdpNeedsNote() {
  if (!window.CUSTOM.has(pdp.p)) return false;
  if (window.CUSTOM.check(pdp.p)) return false;
  toast('A couple of details are still needed', I.info);
  return true;
}

/* ===== CART =============================================== */
function badge(pop = true) {
  const b = $('#cartCount'), n = S.totals(S.cart).count;
  b.textContent = n; b.classList.toggle('on', n > 0);
  if (pop) { b.classList.remove('pop'); void b.offsetWidth; if (n) b.classList.add('pop'); }
  const w = $('#wishCount'), m = S.wish.length;
  w.textContent = m; w.classList.toggle('on', m > 0);
}

function lineHTML(it, i, later) {
  const p = S.byId(it.id), l = S.lineTotal(it), hex = S.colourHex(p, it.v);
  return `<div class="line">
    <a class="line__art" href="#/p/${p.id}"><svg viewBox="0 0 200 200"${hex ? ` style="--art-1:${hex}"` : ''}>${p.art}</svg></a>
    <div>
      <h4><a href="#/p/${p.id}">${esc(p.name)}</a></h4>
      <small>${esc(S.variantText(p, it.v)) || esc(p.specs.Material)}</small>
      ${it.opts ? Object.entries(it.opts).map(([k, v]) => `<small class="pers-note">${esc(k)}:
          ${/^https?:/.test(v) ? `<a href="${esc(v)}" target="_blank" rel="noopener"><b>file attached</b></a>`
                               : `<b>${esc(v)}</b>`}</small>`).join('')
        : (it.note ? `<small class="pers-note">${esc(it.note)}</small>` : '')}
      ${l.off ? `<small class="save">${l.off}% bulk discount</small>` : ''}
      ${later ? `<button class="linky" data-back="${i}" style="margin-top:.4rem">Move to cart</button>`
        : `<div class="qty" style="margin-top:.4rem">
            <button data-q="-1" data-i="${i}" aria-label="One fewer">&minus;</button>
            <span class="num">${it.qty}</span>
            <button data-q="1" data-i="${i}" aria-label="One more">+</button>
          </div>`}
    </div>
    <div class="line__right">
      <b class="num">${money(l.net)}</b>
      ${l.off ? `<s class="num">${money(l.gross)}</s>` : ''}
      ${later ? `<button class="linky" data-rmlater="${i}">Remove</button>`
        : `<button class="linky" data-later="${i}">Save for later</button>
           <button class="linky" data-rm="${i}">Remove</button>`}
    </div>
  </div>`;
}

function paintCart(pop = true) {
  const body = $('#cartBody'), foot = $('#cartFoot');
  const laterHTML = S.later.length
    ? `<h4 class="panel__sub">Saved for later</h4>${S.later.map((it, i) => lineHTML(it, i, true)).join('')}` : '';

  if (!S.cart.length) {
    body.innerHTML = V.empty('Your cart is feeling a little lonely.',
      'Pick something from the shelf and it shows up here with the shipping worked out.',
      '<a class="btn btn--pay btn--sm" href="#/shop" data-close>Explore products</a>') + laterHTML;
    foot.hidden = true; badge(pop); return;
  }

  const suggest = window.PRODUCTS.filter(p => !p.quote && !S.cart.some(c => c.id === p.id) && S.has(p, 'bestseller')).slice(0, 4);
  body.innerHTML = S.cart.map((it, i) => lineHTML(it, i)).join('') + laterHTML +
    (suggest.length ? `<h4 class="panel__sub">You may also like</h4>
      <div class="minis">${suggest.map(p => `<a class="mini" href="#/p/${p.id}" data-close>
        <span class="mini__a"><svg viewBox="0 0 200 200">${p.art}</svg></span>
        <span class="mini__t">${esc(p.name)}<b class="num">${money(p.price)}</b></span></a>`).join('')}</div>` : '');

  const t = S.totals(S.cart);
  const oc = window.PROMO.applied;
  foot.hidden = false;
  foot.innerHTML = `
    ${oc ? `<div class="codeon">Code <b>${esc(oc.code)}</b> applied
        ${t.off ? '' : `<span>\u2014 ${esc(t.offerWhy)}</span>`}
        <button id="dropCode">Remove</button></div>`
      : `<form class="codebox" id="codeForm">
           <input id="codeIn" placeholder="Discount code" autocomplete="off">
           <button class="btn btn--ghost btn--sm" type="submit">Apply</button>
         </form>`}
    <div class="totals">
      <div><span>Subtotal</span><span class="num">${money(t.sub)}</span></div>
      ${t.off ? `<div class="free"><span>Code ${esc(t.code)}</span><span class="num">&minus;${money(t.off)}</span></div>` : ''}
      ${t.saved ? `<div class="free"><span>Bulk savings</span><span class="num">&minus;${money(t.saved)}</span></div>` : ''}
      <div><span>Shipping</span><span class="num ${t.free ? 'free' : ''}">${t.free ? 'Free' : money(t.ship)}</span></div>
      ${!t.free ? `<div><span class="quiet">Free above ${money(CFG.shipping.freeAbove)}</span><span class="quiet num">${money(CFG.shipping.freeAbove - t.sub)} to go</span></div>` : ''}
      <div class="grand"><span>Total</span><b class="num">${money(t.grand)}</b></div>
    </div>
    <div style="display:grid;gap:.5rem">
      <button class="btn btn--pay btn--block" id="payCart">${I.bolt}Pay ${money(t.grand)} with Razorpay</button>
      <button class="btn btn--wa btn--block" id="waCart">${I.wa}Order on WhatsApp</button>
    </div>`;
  badge(pop);
}

/* ===== PANELS ============================================= */
function openPanel(sel) {
  $('#scrim').classList.add('on');
  $(sel).classList.add('on');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $(sel + ' [data-focus]')?.focus?.(), 360);
}
function closePanels() {
  $('#scrim').classList.remove('on');
  $$('.panel').forEach(p => p.classList.remove('on'));
  $('#searchWrap').classList.remove('on');
  document.body.style.overflow = '';
}

/* ===== SEARCH ============================================= */
function openSearch() {
  $('#searchWrap').classList.add('on');
  $('#scrim').classList.add('on');
  document.body.style.overflow = 'hidden';
  paintSearch('');
  setTimeout(() => $('#q').focus(), 120);
}

function paintSearch(q) {
  const box = $('#searchBody');
  if (!q.trim()) {
    box.innerHTML = `
      ${S.seen.length ? `<div class="sgroup"><h4>Recent</h4><div class="chips">
        ${S.seen.map(t => `<button class="chip" data-q="${esc(t)}">${esc(t)}</button>`).join('')}
        <button class="linky" id="clearSeen">Clear</button></div></div>` : ''}
      <div class="sgroup"><h4>Popular searches</h4><div class="chips">
        ${S.POPULAR.map(t => `<button class="chip" data-q="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>
      <div class="sgroup"><h4>Categories</h4><div class="chips">
        ${window.CATEGORIES.map(c => `<a class="chip" href="#/c/${c.id}" data-close>${esc(c.name)}</a>`).join('')}</div></div>
      <div class="sgroup"><h4>Trending now</h4><div class="minis">
        ${S.rail({ kind: 'trending' }).slice(0, 6).map(p => `<a class="mini" href="#/p/${p.id}" data-close>
          <span class="mini__a"><svg viewBox="0 0 200 200">${p.art}</svg></span>
          <span class="mini__t">${esc(p.name)}<b class="num">${money(p.price)}</b></span></a>`).join('')}</div></div>`;
    return;
  }
  const res = S.search(q);
  if (!res.length) { box.innerHTML = V.noResults(q); return; }
  const cats = [...new Set(res.map(p => p.cat))];
  box.innerHTML = `
    ${cats.length > 1 ? `<div class="sgroup"><h4>Jump to</h4><div class="chips">
      ${cats.map(c => `<a class="chip" href="#/c/${c}" data-close>${esc(S.catName(c))}</a>`).join('')}</div></div>` : ''}
    <div class="sgroup"><h4>${res.length} product${res.length === 1 ? '' : 's'}</h4>
      <div class="minis minis--lg">${res.slice(0, 10).map(p => `<a class="mini" href="#/p/${p.id}" data-close>
        <span class="mini__a"><svg viewBox="0 0 200 200">${p.art}</svg></span>
        <span class="mini__t">${esc(p.name)}<i>${esc(S.catName(p.cat))}</i><b class="num">${p.quote ? 'Quoted' : money(p.price)}</b></span></a>`).join('')}</div>
      ${res.length > 10 ? `<button class="btn btn--ghost btn--sm" data-goq="${esc(q)}" style="margin-top:1rem">See all ${res.length} results</button>` : ''}
    </div>`;
}

function goSearch(q) {
  if (!q.trim()) return;
  S.sawSearch(q);
  GA.event('search', { search_term: q.trim() });
  closePanels();
  location.hash = '#/search?q=' + encodeURIComponent(q.trim());
}

/* ===== WHATSAPP ORDER ===================================== */
let waItems = [];

function openWA(items) {
  waItems = items;
  const t = S.totals(items);
  $('#waSummary').textContent = `${t.count} item${t.count > 1 ? 's' : ''} · ${money(t.grand)}`;
  buildOrderPreview(); validateOrder(false);
  openPanel('#waPanel');
}

const F = () => ({
  name: $('#f_name').value.trim(), phone: $('#f_phone').value.trim(),
  email: $('#f_email').value.trim(), pin: $('#f_pin').value.trim(),
  addr: $('#f_addr').value.trim(), city: $('#f_city').value.trim(),
  state: $('#f_state').value.trim(), mark: $('#f_mark').value.trim(),
  flat: $('#f_flat')?.value.trim() || '', bldg: $('#f_bldg')?.value.trim() || '',
  floor: $('#f_floor')?.value.trim() || '', area: $('#f_area')?.value || '',
  notes: $('#f_notes').value.trim(),
  mode: ($('input[name=mode]:checked') || {}).value || 'Delivery',
});

/* the street line, as it would be written on a parcel */
function addrLine(f) {
  const one = [f.flat, f.bldg, f.floor && f.floor + ' floor'].filter(Boolean).join(', ');
  return [one, f.addr, f.area].filter(Boolean).join(', ');
}

const PHONE = v => /^(\+?91[-\s]?)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, ''));
const ORULES = {
  f_name: v => v.length >= 2 || 'Tell us who to address it to',
  f_phone: v => PHONE(v) || 'A 10-digit Indian mobile number',
  /* a PIN has to be six digits AND exist: pinOk is set by the lookup */
  f_pin: v => (/^[1-9]\d{5}$/.test(v) ? (pinOk === v ? true : (pinBad === v ? 'No such PIN code in India' : 'Checking that PIN code…'))
                                       : 'A real 6-digit Indian PIN code'),
  f_flat: v => v.length >= 1 || 'Flat or house number',
  f_addr: v => v.length >= 4 || 'Street or road, please',
  f_city: v => v.length >= 2 || 'Which city?',
  f_state: v => v.length >= 2 || 'Which state?',
};

/* ---- PIN codes -------------------------------------------
   India Post's own directory, asked over https, nothing sent
   but the six digits. A PIN that it does not know cannot be
   used: it is the commonest reason a parcel goes missing.     */
let pinOk = '', pinBad = '', pinBusy = '';
const PIN_CACHE = new Map();

async function lookupPin(pin) {
  if (!/^[1-9]\d{5}$/.test(pin) || pinBusy === pin) return;
  if (PIN_CACHE.has(pin)) return usePin(pin, PIN_CACHE.get(pin));
  pinBusy = pin;
  say('Checking ' + pin + '…');
  try {
    const r = await fetch('https://api.postalpincode.in/pincode/' + pin, { cache: 'force-cache' });
    const j = await r.json();
    const rec = Array.isArray(j) ? j[0] : null;
    const offices = (rec && rec.Status === 'Success' && rec.PostOffice) || null;
    PIN_CACHE.set(pin, offices);
    usePin(pin, offices);
  } catch {
    /* offline or blocked: do not hold the customer hostage to a lookup */
    pinOk = pin; say('Could not check that PIN code just now — carry on.', 'warn');
  } finally {
    pinBusy = '';
    validateOrder(false); buildOrderPreview();
  }
}

function say(msg, kind = '') {
  const el = $('#f_pinsay'); if (!el) return;
  el.textContent = msg || '';
  el.className = 'pinsay' + (kind ? ' pinsay--' + kind : '');
}

function usePin(pin, offices) {
  if ($('#f_pin').value.trim() !== pin) return;
  const areaSel = $('#f_area');
  if (!offices || !offices.length) {
    pinBad = pin; pinOk = '';
    if (areaSel) { areaSel.innerHTML = '<option>—</option>'; areaSel.disabled = true; }
    say('India Post has no record of ' + pin + '. Check the digits.', 'bad');
    return;
  }
  pinOk = pin; pinBad = '';
  const first = offices[0];
  $('#f_city').value = first.District || '';
  $('#f_state').value = first.State || '';
  if (areaSel) {
    areaSel.disabled = false;
    areaSel.innerHTML = '<option value="">Pick your locality</option>' +
      offices.map(o => `<option>${esc(o.Name)}</option>`).join('');
  }
  say(`${first.District}, ${first.State} — ${offices.length} ${offices.length === 1 ? 'locality' : 'localities'} here.`, 'ok');
}

/* ---- locate me -------------------------------------------
   The browser asks the customer first. We reverse-geocode with
   OpenStreetMap, fill in what it gives us, and leave the flat,
   building and floor to the person who lives there.           */
function locateMe() {
  const btn = $('#f_locate');
  if (!navigator.geolocation) { toast('This browser cannot share a location', I.info); return; }
  btn.disabled = true; btn.textContent = 'Finding you…';
  const done = (msg, kind) => { btn.disabled = false; btn.textContent = 'Locate me'; if (msg) say(msg, kind); };

  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: lat, longitude: lon } = pos.coords;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { Accept: 'application/json' } });
      const j = await r.json();
      const a = j.address || {};
      const pin = (a.postcode || '').replace(/\D/g, '').slice(0, 6);
      const road = [a.road, a.suburb || a.neighbourhood || a.village].filter(Boolean).join(', ');
      if (road) $('#f_addr').value = road;
      if (a.city || a.town || a.state_district) $('#f_city').value = a.city || a.town || a.state_district;
      if (a.state) $('#f_state').value = a.state;
      if (pin) { $('#f_pin').value = pin; await lookupPin(pin); }
      done(pin ? '' : 'Found the street but not the PIN code — type it in.', pin ? '' : 'warn');
      $('#f_flat').focus();
      toast('Filled in what we could — add your flat and floor', I.check);
    } catch { done('Could not turn that location into an address', 'bad'); }
    validateOrder(false); buildOrderPreview();
  }, err => {
    done(err.code === 1 ? 'Location permission was declined — type the PIN code instead.' : 'Could not get a location', 'warn');
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
}

function validateOrder(showAll) {
  let ok = true;
  for (const [id, rule] of Object.entries(ORULES)) {
    const el = $('#' + id); if (!el) continue;
    const u = el.parentElement.querySelector('u');
    if (el.disabled) { el.removeAttribute('aria-invalid'); if (u) u.textContent = ''; continue; }
    const res = rule(el.value.trim()), bad = res !== true;
    if (bad) ok = false;
    if (showAll || el.dataset.touched) { el.setAttribute('aria-invalid', String(bad)); if (u) u.textContent = bad ? res : ''; }
  }
  $('#waSend').disabled = !ok;
  return ok;
}

function orderMessage() {
  const f = F(), t = S.totals(waItems), L = [];
  L.push(`*${CFG.whatsapp.greeting}*`, '');
  waItems.forEach((it, i) => {
    const p = S.byId(it.id), l = S.lineTotal(it);
    L.push(`${i + 1}. ${p.name} × ${it.qty} — ${money(l.net)}`);
    const vt = S.variantText(p, it.v); if (vt) L.push(`   ${vt}`);
    if (it.opts) Object.entries(it.opts).forEach(([k, v]) => L.push(`   ${k}: ${v}`));
    else if (it.note) L.push(`   Note: ${it.note}`);
    if (l.off) L.push(`   ${l.off}% bulk discount`);
  });
  L.push('', `Subtotal: ${money(t.sub)}`);
  if (t.saved) L.push(`Bulk savings: -${money(t.saved)}`);
  L.push(`Shipping: ${t.free ? 'Free' : money(t.ship)}`, `*Total: ${money(t.grand)}*`, '');
  L.push(`*${f.mode}*`, f.name || '-', f.phone || '-');
  if (f.email) L.push(f.email);
  if (f.mode === 'Delivery') {
    L.push(addrLine(f) || '-');
    if (f.mark) L.push(`Landmark: ${f.mark}`);
    L.push(`${f.city || '-'} ${f.pin || ''}`.trim(), f.state || '-');
  }
  if (f.notes) L.push('', `Notes: ${f.notes}`);
  L.push('', `Sent from ${CFG.brand.name.toLowerCase()} website`);
  return L.join('\n');
}
const buildOrderPreview = () => { $('#waPreview').textContent = orderMessage(); };

function sendOrder() {
  if (!validateOrder(true)) { $('[aria-invalid="true"]')?.focus(); toast('A few fields still need you', I.info); return; }
  S.write(S.K.buyer, F());
  const wt = S.totals(waItems);
  recordOrder('whatsapp', waItems, wt, null, F());
  window.PROMO.claim();
  GA.event('purchase', { transaction_id: 'WA-' + Date.now().toString(36), currency: CFG.currency,
    value: wt.grand, shipping: wt.ship, coupon: wt.code || undefined, affiliation: 'whatsapp',
    items: waItems.map(it => GA.item(S.byId(it.id), it.qty, S.variantText(S.byId(it.id), it.v))) });
  openWhatsApp(orderMessage());
  closePanels(); confetti();
  toast('WhatsApp is open — press send there to confirm', I.wa, 6000);
}

function openWhatsApp(text) {
  const url = `https://wa.me/${CFG.whatsapp.number}?text=${encodeURIComponent(text)}`;
  const w = window.open(url, '_blank', 'noopener');
  if (!w) location.href = url;
}

function prefillBuyer() {
  const b = S.read(S.K.buyer, null); if (!b) return;
  ({ f_name: 'name', f_phone: 'phone', f_email: 'email', f_pin: 'pin', f_addr: 'addr',
     f_city: 'city', f_state: 'state', f_mark: 'mark' });
  const map = { f_name: 'name', f_phone: 'phone', f_email: 'email', f_pin: 'pin',
                f_addr: 'addr', f_city: 'city', f_state: 'state', f_mark: 'mark',
                f_flat: 'flat', f_bldg: 'bldg', f_floor: 'floor' };
  for (const [id, k] of Object.entries(map)) if (b[k] && $('#' + id)) $('#' + id).value = b[k];
  if (b.pin) lookupPin(b.pin);
}

/* ===== CUSTOM PRINT FORM ================================== */
const FILE_FIELD = accept => `
  <label class="field"><span>Your file</span>
    <input id="c_file" type="file" accept="${accept}">
    <small class="quiet">Up to ${window.JOYSHINE.custom.maxSizeMB} MB. It uploads when you send, and WhatsApp gets the link.</small><u></u></label>
  <div class="upbar" id="c_upbar" hidden><i></i></div>
  <label class="field"><span>Or paste a link <small class="quiet">Google Drive, Dropbox, WeTransfer, MakerWorld…</small></span>
    <input id="c_drive" type="url" placeholder="https://drive.google.com/…"><u></u></label>`;

const PATH_FIELDS = {
  image: `<label class="field"><span>What are we making</span><input id="c_what" type="text" placeholder="e.g. a plaque with our surname on it"><u></u></label>
          ${FILE_FIELD('.jpg,.jpeg,.png,.pdf,.stl,.3mf,.obj')}`,
  stl:   `<label class="field"><span>Model name</span><input id="c_what" type="text" placeholder="e.g. articulated dragon v3"><u></u></label>
          ${FILE_FIELD('.stl,.3mf,.obj,.step,.stp,.zip')}`,
  link:  `<label class="field"><span>MakerWorld link <i>*</i></span><input id="c_link" type="url" placeholder="https://makerworld.com/en/models/..."><u></u></label>
          <p class="quiet" style="font-size:.8rem;margin-top:-.4rem">We only print models whose licence allows it. If it doesn't, we'll tell you.</p>`,
  idea:  `<label class="field"><span>Describe your idea <i>*</i></span><textarea id="c_idea" placeholder="I want a small tractor model with my son's name on it, about 15 cm long, in red."></textarea><u></u></label>`,
};
let cpath = 'image';

function setupCustom(q) {
  cpath = q.path || 'image';
  $$('.path[data-path]').forEach(b => b.classList.toggle('on', b.dataset.path === cpath));
  paintPathFields(q);
  const b = S.read(S.K.buyer, null);
  if (b) { if (b.name) $('#c_name').value = b.name; if (b.phone) $('#c_phone').value = b.phone; if (b.email) $('#c_email').value = b.email; }
  if (q.p) { const p = S.byId(q.p); if (p && $('#c_what')) $('#c_what').value = p.name; }
  buildCustomPreview();
}
function paintPathFields(q = {}) {
  $('#pathFields').innerHTML = PATH_FIELDS[cpath] || '';
  if (q.q) { const el = $('#c_what') || $('#c_idea'); if (el) el.value = q.q; }
  buildCustomPreview();
}
function customMessage() {
  const g = id => $('#' + id)?.value.trim() || '';
  const L = [`*${CFG.whatsapp.customGreeting}*`, ''];
  const kind = { image: 'Design upload', stl: '3D file', link: 'MakerWorld link', idea: 'An idea' }[cpath];
  L.push(`Type: ${kind}`);
  if (g('c_what')) L.push(`What: ${g('c_what')}`);
  if (g('c_link')) L.push(`Link: ${g('c_link')}`);
  if (g('c_idea')) L.push(`Idea: ${g('c_idea')}`);
  const f = $('#c_file')?.files?.[0];
  if (f) L.push(uploadedUrl
    ? `File: ${f.name} (${Math.round(f.size / 1024)} KB)\n${uploadedUrl}`
    : `File: ${f.name} (${Math.round(f.size / 1024)} KB) — attaching in this chat`);
  if (g('c_drive')) L.push(`Shared link: ${g('c_drive')}`);
  L.push('', `Quantity: ${g('c_qty') || 1}`, `Size: ${g('c_size')}`, `Material: ${g('c_mat')}`, `Colour: ${g('c_col')}`);
  if (g('c_by')) L.push(`Needed by: ${g('c_by')}`);
  L.push('', `Name: ${g('c_name') || '-'}`, `Mobile: ${g('c_phone') || '-'}`);
  if (g('c_email')) L.push(`Email: ${g('c_email')}`);
  if (g('c_notes')) L.push('', `Notes: ${g('c_notes')}`);
  L.push('', `Sent from ${CFG.brand.name.toLowerCase()} website`);
  return L.join('\n');
}
const buildCustomPreview = () => { const el = $('#cPreview'); if (el) el.textContent = customMessage(); };

let uploadedUrl = '';

/* put the file somewhere WhatsApp can reach before opening it */
async function pushFile() {
  const f = $('#c_file')?.files?.[0];
  if (!f) return '';
  const cap = (CFG.custom.maxSizeMB || 25) * 1024 * 1024;
  if (f.size > cap) { toast(`That file is over ${CFG.custom.maxSizeMB} MB — send a link instead`, I.info, 6000); return ''; }
  const bar = $('#c_upbar'), fill = bar?.querySelector('i');
  if (bar) { bar.hidden = false; bar.dataset.state = ''; }
  try {
    const url = await window.CATALOGUE.uploadFile(f, p => { if (fill) fill.style.width = Math.round(p * 100) + '%'; });
    if (fill) fill.style.width = '100%';
    if (bar) bar.dataset.state = 'done';
    return url;
  } catch {
    if (bar) { bar.dataset.state = 'fail'; }
    toast('Could not upload the file — attach it in WhatsApp instead', I.info, 6000);
    return '';
  }
}

async function sendCustom() {
  const name = $('#c_name').value.trim(), phone = $('#c_phone').value.trim();
  const fail = (el, msg) => { el.setAttribute('aria-invalid', 'true');
    el.parentElement.querySelector('u').textContent = msg; el.focus(); toast(msg, I.info); };
  if (name.length < 2) return fail($('#c_name'), 'We need a name to reply to');
  if (!PHONE(phone))   return fail($('#c_phone'), 'A 10-digit Indian mobile number');
  if (cpath === 'link' && !$('#c_link').value.trim()) return fail($('#c_link'), 'Paste the MakerWorld link');
  if (cpath === 'idea' && $('#c_idea').value.trim().length < 10) return fail($('#c_idea'), 'A sentence or two, so we can price it');

  const b = S.read(S.K.buyer, {}) || {};
  S.write(S.K.buyer, { ...b, name, phone, email: $('#c_email').value.trim() });
  const g = id => $('#' + id)?.value.trim() || '';
  const file = $('#c_file')?.files?.[0];

  const btn = $('#cSend');
  if (btn) { btn.disabled = true; btn.dataset.was = btn.innerHTML; btn.textContent = 'Uploading…'; }
  uploadedUrl = await pushFile();
  if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.was; }
  buildCustomPreview();

  window.CATALOGUE.logRequest({
    kind: cpath,
    detail: { what: g('c_what'), link: g('c_link'), idea: g('c_idea'), drive: g('c_drive'),
              fileUrl: uploadedUrl,
              file: file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : '',
              qty: g('c_qty'), size: g('c_size'), material: g('c_mat'),
              colour: g('c_col'), by: g('c_by'), notes: g('c_notes') },
    customer: { name, phone, email: g('c_email') },
  });
  GA.event('generate_lead', { currency: CFG.currency, value: 0, method: cpath });
  openWhatsApp(customMessage());
  confetti();
  $('#customForm').innerHTML = `<div class="done">${I.check}
    <h3>Your idea is on its way! ✨</h3>
    <p>WhatsApp should be open with your enquiry. ${
      uploadedUrl ? 'Your file went up with it — just press send.'
      : ($('#c_file')?.files?.[0] ? 'Attach the file there and press send.'
      : 'Press send there and we will reply with a price and a print slot.')}</p>
    <div class="hero__cta"><a class="btn btn--ghost btn--sm" href="#/shop">Keep exploring</a></div></div>`;
}

/* ===== RAZORPAY =========================================== */
let rzp;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  rzp = rzp || new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = res; s.onerror = () => rej(new Error('offline'));
    document.head.appendChild(s);
  });
  return rzp;
}

async function pay(items, btn) {
  const t = S.totals(items);
  if (!t.grand) return;
  if (!CFG.razorpay.keyId || CFG.razorpay.keyId.includes('REPLACE_ME')) {
    toast('Add your Razorpay Key ID in assets/js/config.js', I.info, 5500); return;
  }
  const label = btn && btn.innerHTML;
  if (btn) { btn.disabled = true; btn.innerHTML = 'Opening Razorpay…'; }
  try { await loadRazorpay(); }
  catch { if (btn) { btn.disabled = false; btn.innerHTML = label; } toast('Razorpay needs an internet connection', I.info); return; }

  const summary = items.map(it => `${S.byId(it.id).name} x${it.qty}`).join(', ');
  const buyer = S.read(S.K.buyer, {}) || {};
  const opts = {
    key: CFG.razorpay.keyId, amount: t.grand * 100, currency: CFG.currency,
    name: CFG.brand.name, description: summary.slice(0, 250),
    prefill: { name: buyer.name || '', contact: buyer.phone || '', email: buyer.email || '' },
    notes: { items: summary.slice(0, 250), shipping: String(t.ship) },
    theme: { color: CFG.razorpay.themeColor },
    modal: { ondismiss: () => { if (btn) { btn.disabled = false; btn.innerHTML = label; } } },
    handler: r => { if (btn) { btn.disabled = false; btn.innerHTML = label; } paid(r.razorpay_payment_id, items); },
  };
  if (CFG.razorpay.orderEndpoint) {
    try {
      const r = await fetch(CFG.razorpay.orderEndpoint, { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: t.grand * 100, currency: CFG.currency, items }) });
      const o = await r.json(); if (o?.id) opts.order_id = o.id;
    } catch {}
  }
  new window.Razorpay(opts).open();
}

function paid(paymentId, items) {
  const t = S.totals(items);
  const fromCart = items === S.cart;
  const lines = items.map(it => { const p = S.byId(it.id); return `${p.name} × ${it.qty}`; });
  if (fromCart) S.clearCart();
  closePanels(); paintCart(); badge(); confetti();
  $('#view').innerHTML = `<section class="band wrap"><div class="done done--big">${I.check}
    <h2>Yay! Your ${esc(CFG.brand.name)} order is confirmed! ✨</h2>
    <p class="lede">Payment <b>${esc(paymentId)}</b> received. We have your order and will message you on WhatsApp with the print slot and tracking.</p>
    <ul class="done__list">${lines.map(l => `<li>${esc(l)}</li>`).join('')}
      <li class="done__tot">Total paid <b class="num">${money(t.grand)}</b></li></ul>
    <p class="quiet">Dispatch in 2-4 working days. Keep this payment id for reference.</p>
    <div class="hero__cta">
      <button class="btn btn--wa" id="afterWa">${I.wa}Send us your address</button>
      <a class="btn btn--ghost" href="#/shop">Continue shopping</a>
    </div></div></section>`;
  document.title = 'Order confirmed · ' + CFG.brand.name;
  reveals();
  $('#afterWa').onclick = () => openWhatsApp(
    `*Order paid*\n\nPayment id: ${paymentId}\nTotal: ${money(t.grand)}\n\n${lines.join('\n')}\n\nMy delivery address:\n`);
}

/* ===== RECORDING ==========================================
   A copy of every order and custom request goes to Supabase so
   the dashboard has something to show. It is a record of what
   the customer asked for, not proof of payment — nothing here
   is server-verified. If it fails, the customer never notices. */
function recordOrder(channel, items, totals, paymentId, buyer) {
  const who = buyer || S.read(S.K.buyer, {}) || {};
  window.CATALOGUE.logOrder({
    channel, payment_id: paymentId || null,
    items: items.map(it => {
      const p = S.byId(it.id), l = S.lineTotal(it);
      return { id: it.id, name: p.name, qty: it.qty, variant: S.variantText(p, it.v),
               note: it.note || '', options: it.opts || null, unit: l.unit, total: l.net };
    }),
    totals: { sub: totals.sub, saved: totals.saved, ship: totals.ship, grand: totals.grand, count: totals.count },
    customer: { name: who.name || '', phone: who.phone || '', email: who.email || '',
                address: addrLine(who) || who.addr || '', landmark: who.mark || '', city: who.city || '',
                pin: who.pin || '', state: who.state || '', mode: who.mode || '', notes: who.notes || '' },
  });
}

/* ===== REVIEWS ============================================
   Anyone may write one; nobody may publish their own. The
   database enforces that, not this function.                 */
async function sendReview(id) {
  const name = $('#rv_name').value.trim();
  const body = $('#rv_body').value.trim();
  const fail = (el, msg) => { el.setAttribute('aria-invalid', 'true');
    const u = el.parentElement.querySelector('u'); if (u) u.textContent = msg;
    el.focus(); toast(msg, I.info); };
  if (name.length < 2) return fail($('#rv_name'), 'A name to put under it');
  if (body.length < 12) return fail($('#rv_body'), 'A sentence or two, so it helps someone');

  const btn = $('#rv_send'); btn.disabled = true; btn.textContent = 'Sending…';
  const row = await window.CATALOGUE.logReview({
    product_id: id, name, rating: +$('#rv_rating').value || 5,
    title: $('#rv_title').value.trim() || null, body,
  });
  const box = $('#revForm');
  if (box) box.outerHTML = `<div class="done done--sm">${I.check}
    <h4>Thank you — that is with us.</h4>
    <p class="quiet">We read every review before it goes up${row ? '' : ', and we will pick this one up shortly'}.</p></div>`;
  GA.event('review_submitted', { item_id: id });
}

/* ===== SHARE ============================================== */
async function share(id) {
  const p = S.byId(id);
  const url = location.origin + location.pathname + '#/p/' + id;
  const data = { title: `${p.name} · ${CFG.brand.name}`, text: p.blurb, url };
  if (navigator.share) { try { await navigator.share(data); return; } catch { return; } }
  try { await navigator.clipboard.writeText(url); toast('Link copied'); }
  catch { openWhatsApp(`${p.name} — ${money(p.price)}\n${p.blurb}\n${url}`); }
}

/* ===== BOOT =============================================== */
async function boot() {
  /* The browser restores the old scroll position on reload, and at that
     moment the page is only a header and a footer — so it lands at the
     bottom. Take the wheel, and give the empty page something its own
     height while the settings and the catalogue arrive. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo({ top: 0, behavior: 'instant' });
  const view = $('#view');
  if (view && !view.innerHTML.trim()) view.innerHTML = V.booting();

  await window.SETTINGS.load();
  await window.CATALOGUE.load();       /* database first, files as the net */
  window.OCC_NOW = window.SETTINGS.current();
  window.CATALOGUE.arrange(window.OCC_NOW);
  applyTheme(null);
  window.SKIN?.fonts();
  window.SKIN?.cursors();
  window.SKIN?.brand();
  applySeo();
  showLegalLinks();
  fillBrand();
  prefillBuyer();
  paintCart(); badge();
  render();

  window.REVIEWBAR?.start();
  window.PROMO.start();
  window.GA.start();
  window.CUSTOM.wire();

  /* a phone should not scroll past four open columns to reach the bottom */
  if (matchMedia('(max-width: 720px)').matches) {
    $$('.foot__col').forEach((d, i) => { d.open = false; });
  }

  const bar = $('#topbar');
  const measure = () => document.documentElement.style.setProperty('--bar-h', bar.offsetHeight + 'px');
  measure(); addEventListener('resize', measure);
  const onScroll = () => bar.classList.toggle('stuck', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  addEventListener('hashchange', render);
  /* some browsers hold a restore until the page is tall enough for it */
  addEventListener('load', () => { if (!location.hash.includes('#/')) scrollTo({ top: 0, behavior: 'instant' }); }, { once: true });

  /* reviews and sale counts land a moment after the catalogue: put them
     in place without redrawing the page under the customer's finger */
  document.addEventListener('joyshine:social', () => {
    $$('[data-social]').forEach(el => {
      const p = S.byId(el.dataset.social); if (!p) return;
      el.outerHTML = V.socialLine(p);
    });
    const revs = $('#revs');
    if (revs && pdp) revs.innerHTML = V.reviewBlock(pdp.p);
    const home = $('#homeRevs');
    if (home) home.innerHTML = V.pinnedReviews();
    $$('.card[data-id]').forEach(c => {
      const p = S.byId(c.dataset.id); if (!p) return;
      const line = c.querySelector('.card__social');
      const n = V.soldCount(p.id), rv = V.reviewsFor(p.id);
      if (!n && !rv.length) { line?.remove(); return; }
      const avg = rv.length ? (rv.reduce((t, r) => t + (+r.rating || 0), 0) / rv.length).toFixed(1) : '';
      const html = `${rv.length ? `${V.stars(Math.round(+avg))} <b>${avg}</b>` : ''}${
        rv.length && n ? '<span class="social__dot">·</span>' : ''}${n ? `${n} sold` : ''}`;
      if (line) line.innerHTML = html;
      else c.querySelector('.card__blurb')?.insertAdjacentHTML('afterend', `<p class="card__social">${html}</p>`);
    });
  });

  /* ---- clicks ---- */
  document.addEventListener('click', e => {
    const t = e.target;

    const sw = t.closest('.themer button'); if (sw) return setTheme(sw.dataset.set, true);
    if (t.closest('#openSearch') || t.closest('[data-opensearch]')) { e.preventDefault(); return openSearch(); }
    if (t.closest('#openCart')) { e.preventDefault(); return openPanel('#cartPanel'); }
    if (t.closest('#scrim') || t.closest('[data-close]')) { if (t.closest('a')) { closePanels(); return; } e.preventDefault?.(); return closePanels(); }
    if (t.closest('[data-closepanel]')) return closePanels();

    const q = t.closest('[data-q]'); if (q && q.dataset.q && !q.dataset.i) { $('#q').value = q.dataset.q; return paintSearch(q.dataset.q); }
    const goq = t.closest('[data-goq]'); if (goq) return goSearch(goq.dataset.goq);
    if (t.closest('#clearSeen')) { S.write(S.K.seen, []); location.reload(); return; }

    const wish = t.closest('[data-wish]');
    if (wish) {
      const on = S.toggleWish(wish.dataset.wish);
      wish.classList.toggle('on', on);
      wish.innerHTML = on ? I.heartOn : I.heart;
      badge(); toast(on ? 'Saved to wishlist' : 'Removed from wishlist');
      if (parse().seg[0] === 'wishlist') render();
      return;
    }

    const sh = t.closest('[data-share]'); if (sh) return share(sh.dataset.share);
    if (t.closest('[data-waask]')) return openWhatsApp(
      `Hi ${CFG.brand.name}! I was looking for something on your website and could not find it.`);

    /* card buttons */
    const add = t.closest('[data-add]');
    if (add) { const p = S.byId(add.dataset.add);
      if (window.CUSTOM.has(p)) { toast('This one needs your details', I.info); location.hash = '#/p/' + p.id; return; }
      S.add(p.id, S.defaults(p));
      GA.event('add_to_cart', { currency: CFG.currency, value: p.price, items: [GA.item(p, 1)] });
      paintCart(false);
      window.FLY.toCart(add.closest('.card')?.querySelector('.card__art'), () => {
        badge(true); toast(`${p.name} added`);
      });
      return; }
    const buy = t.closest('[data-buy]');
    if (buy) { const p = S.byId(buy.dataset.buy);
      if (window.CUSTOM.has(p)) { location.hash = '#/p/' + p.id; return; }
      return pay([{ id: p.id, v: S.defaults(p), note: '', qty: 1 }], buy); }
    const wab = t.closest('[data-wa]');
    if (wab) { const p = S.byId(wab.dataset.wa);
      if (window.CUSTOM.has(p)) { location.hash = '#/p/' + p.id; return; }
      return openWA([{ id: p.id, v: S.defaults(p), note: '', qty: 1 }]); }
    const quote = t.closest('[data-quote]'); if (quote) { location.hash = '#/custom?p=' + quote.dataset.quote; return; }

    /* pdp */
    const vb = t.closest('[data-v]');
    if (vb && pdp) { pdp.v = { ...pdp.v, [vb.dataset.v]: vb.dataset.val }; syncPdp(); return; }
    const pq = t.closest('[data-pq]');
    if (pq && pdp) { pdp.qty = Math.max(1, pdp.qty + +pq.dataset.pq); syncPdp(); return; }
    if (t.closest('#pdpAdd') && pdp) { if (pdpNeedsNote()) return;
      const it = pdpItem(); const name = pdp.p.name;
      S.add(it.id, it.v, it.note, it.qty, it.opts);
      window.CUSTOM.reset();
      GA.event('add_to_cart', { currency: CFG.currency, value: S.unitPrice(pdp.p, it.v) * it.qty,
                                items: [GA.item(pdp.p, it.qty, S.variantText(pdp.p, it.v))] });
      paintCart(false);
      window.FLY.toCart($('#pdpStage'), () => { badge(true); toast(`${name} added`); });
      return; }
    if (t.closest('#pdpBuy') && pdp) { if (pdpNeedsNote()) return; return pay([pdpItem()], $('#pdpBuy')); }
    if (t.closest('#pdpWa') && pdp)  { if (pdpNeedsNote()) return; return openWA([pdpItem()]); }
    if (t.closest('#pdpBulk2') && pdp) {
      return openWhatsApp(`*${CFG.whatsapp.bulkGreeting}*\n\n${pdp.p.name}\nQuantity: (tell us how many)\n${S.variantText(pdp.p, pdp.v)}\n\nSent from ${CFG.brand.name.toLowerCase()} website`);
    }

    /* custom print paths */
    const path = t.closest('.path[data-path]');
    if (path) { cpath = path.dataset.path;
      $$('.path[data-path]').forEach(b => b.classList.toggle('on', b === path));
      paintPathFields(); return; }
    if (t.closest('#cSend')) return sendCustom();
    const rv = t.closest('[data-rev]'); if (rv) return sendReview(rv.dataset.rev);

    /* cart lines */
    const qb = t.closest('[data-q][data-i]');
    if (qb) { const i = +qb.dataset.i; S.setQty(i, S.cart[i].qty + +qb.dataset.q); paintCart(); return; }
    const rm = t.closest('[data-rm]'); if (rm) { S.removeAt(+rm.dataset.rm); paintCart(); return; }
    const lt = t.closest('[data-later]'); if (lt) { S.toLater(+lt.dataset.later); paintCart(); toast('Saved for later'); return; }
    const bk = t.closest('[data-back]'); if (bk) { S.fromLater(+bk.dataset.back); paintCart(); return; }
    const rl = t.closest('[data-rmlater]'); if (rl) { S.later.splice(+rl.dataset.rmlater, 1); S.write(S.K.later, S.later); paintCart(); return; }

    if (t.closest('#payCart')) return pay(S.cart, $('#payCart'));
    if (t.closest('#waCart')) { closePanels(); return setTimeout(() => openWA(S.cart), 250); }
    if (t.closest('#waSend')) return sendOrder();
    if (t.closest('#f_locate')) return locateMe();
    if (t.closest('#dropCode')) { window.PROMO.clear(); paintCart(); toast('Code removed'); return; }

    if (t.closest('#engQuote') || t.closest('#engQuote2')) {
      return openWhatsApp(`*${CFG.engineering.whatsappGreeting}*\n\n` +
        `Part: \nQuantity: \nMaterial: \nFinish tolerance: \nNeeded by: \n\n` +
        `(attaching the file in this chat)\n\nSent from ${CFG.brand.name.toLowerCase()} engineering`);
    }
  });

  /* ---- inputs ---- */
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'q') { paintSearch(t.value); return; }
    if (t.closest('#waForm')) {
      t.dataset.touched = '1';
      if (t.id === 'f_pin') { pinOk = ''; pinBad = ''; lookupPin(t.value.trim()); }
      validateOrder(false); buildOrderPreview(); return;
    }
    if (t.closest('#customForm')) { t.removeAttribute('aria-invalid'); buildCustomPreview(); return; }
    if (t.id === 'pdpNote') { t.removeAttribute('aria-invalid'); t.parentElement.querySelector('u').textContent = ''; return; }
  });

  document.addEventListener('change', e => {
    const f = e.target.closest('[data-f]');
    if (f) {
      const { path, q } = parse();
      const next = { ...q, [f.dataset.f]: f.value };
      Object.keys(next).forEach(k => !next[k] && delete next[k]);
      const qs = new URLSearchParams(next).toString();
      location.hash = '#' + path + (qs ? '?' + qs : '');
      return;
    }
    if (e.target.name === 'mode') {
      const del = e.target.value === 'Delivery';
      $('#addrBlock').hidden = !del;
      ['f_pin', 'f_addr', 'f_city', 'f_state'].forEach(id => $('#' + id).disabled = !del);
      validateOrder(false); buildOrderPreview();
    }
  });

  document.addEventListener('submit', e => {
    e.preventDefault();
    if (e.target.id === 'waForm') sendOrder();
    if (e.target.id === 'customForm') sendCustom();
    if (e.target.id === 'searchForm') goSearch($('#q').value);
  });

  addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanels();
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', boot)
  : boot();
})();
