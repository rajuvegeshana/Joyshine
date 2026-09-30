/* ===========================================================
   VIEWS — every screen, rendered as a string. No state here.
   =========================================================== */
window.V = (() => {
'use strict';

const CFG = window.JOYSHINE;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const money = n => S.money(n);

/* ---------- icons ---------------------------------------- */
const I = {
  cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.94.56 3.75 1.53 5.28L2 22l5.03-1.68a9.8 9.8 0 0 0 5.01 1.36c5.44 0 9.84-4.4 9.84-9.84S17.48 2 12.04 2zm0 17.9c-1.6 0-3.1-.45-4.36-1.24l-.31-.19-3.2 1.07 1.08-3.12-.2-.32a7.9 7.9 0 0 1-1.22-4.26 8.2 8.2 0 1 1 8.21 8.06zm4.52-5.9c-.25-.13-1.47-.72-1.7-.8-.22-.09-.39-.13-.55.12-.16.25-.63.8-.77.96-.14.17-.28.19-.53.06a6.6 6.6 0 0 1-1.94-1.2 7.3 7.3 0 0 1-1.34-1.67c-.14-.25-.02-.39.11-.52.11-.11.25-.3.37-.44.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.55-1.33-.75-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.25-.84.82-.84 2 0 1.19.86 2.33.98 2.5.12.16 1.68 2.65 4.1 3.6 2.42.95 2.42.63 2.86.59.44-.04 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.17-.47-.3z"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9.2"/><path d="M12 11v6M12 7.6v.2"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.5a4.4 4.4 0 0 1 7.5 2.9c0 5-7.5 9.6-7.5 9.6z"/></svg>',
  heartOn:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.5a4.4 4.4 0 0 1 7.5 2.9c0 5-7.5 9.6-7.5 9.6z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M12 6l-6 6M12 6l6 6"/></svg>',
  file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M10 13a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 11a4 4 0 0 0-6-.5l-2 2A4 4 0 0 0 11.7 18l1-1"/></svg>',
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1-5.2A8 8 0 1 1 21 12z"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>',
  spark:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5 14 9l6.5 2-6.5 2-2 6.5L10 13l-6.5-2L10 9z"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3"/></svg>',
  horn:'<svg viewBox="0 0 120 120" fill="none"><path d="M60 8 74 62H46z" fill="var(--art-3)"/><path d="M52 24h16M49 38h22M46 52h28" stroke="var(--art-4)" stroke-width="3" stroke-linecap="round" opacity=".45"/><path d="M34 62h52l-8 44H42z" fill="var(--art-1)"/><ellipse cx="60" cy="112" rx="26" ry="5" fill="var(--art-4)" opacity=".2"/></svg>',
};

/* ---------- small pieces --------------------------------- */
const BADGES = [
  ['limited', 'Limited'], ['bestseller', 'Best Seller'], ['new', 'New'],
  ['trending', 'Trending'], ['personalised', 'Personalised'], ['madeinindia', 'Made in India'],
];
const badgeOf = p => { const b = BADGES.find(([t]) => S.has(p, t)); return b ? b[1] : ''; };

function art(p, hex, cls = '') {
  if (p.photo) return `<img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy">`;
  const style = hex ? ` style="--art-1:${esc(hex)}"` : '';
  return `<svg class="${cls}" viewBox="0 0 200 200" role="img" aria-label="${esc(p.name)}"${style}>${p.art}</svg>`;
}

/* "90 x 90 x 120 mm" when we know it, the old text if we only have that */
function dims(o) {
  if (o.l && o.b && o.h) return `${o.l} \u00d7 ${o.b} \u00d7 ${o.h} mm`;
  if (o.dim) return esc(o.dim);
  return esc(o.label || '');
}

/* what the customer has chosen, in words */
function selNow(p, v) {
  const find = (list, k) => (p.variants?.[list] || []).find(o => o.k === v[list]);
  const sz = find('size'), mt = find('material'), cl = find('colour');
  const bits = [];
  if (sz) bits.push(`Size <b>${esc(sz.label || sz.k)}</b> \u00b7 ${dims(sz)} (L \u00d7 B \u00d7 H)`);
  if (mt) bits.push(`Material <b>${esc(mt.label || mt.k)}</b>`);
  if (cl) bits.push(`Colour <b>${esc(cl.label)}</b>`);
  return bits.join(' &nbsp;\u00b7&nbsp; ');
}

const priceBlock = p => p.quote
  ? `<div class="price"><b>Quoted</b><em>on WhatsApp</em></div>`
  : `<div class="price"><b class="num">${money(p.price)}</b>${p.was
      ? `<s class="num">${money(p.was)}</s><em>${Math.round((1 - p.price / p.was) * 100)}% off</em>` : ''}</div>`;

const swatches = p => !p.variants?.colour ? '' :
  `<div class="dots" aria-hidden="true">${p.variants.colour.slice(0, 5)
    .map(c => `<i style="background:${c.hex}"></i>`).join('')}${p.variants.colour.length > 5
    ? `<u>+${p.variants.colour.length - 5}</u>` : ''}</div>`;

function card(p, i = 0) {
  const b = badgeOf(p);
  return `<article class="card r" style="--d:${(i % 6) * 55}ms" data-id="${p.id}">
    ${b ? `<span class="card__tag">${esc(b)}</span>` : ''}
    <div class="card__acts">
      <button class="heart" data-share="${p.id}" aria-label="Share ${esc(p.name)}">${I.share}</button>
      <button class="heart${S.inWish(p.id) ? ' on' : ''}" data-wish="${p.id}"
        aria-label="${S.inWish(p.id) ? 'Remove from' : 'Save to'} wishlist">${S.inWish(p.id) ? I.heartOn : I.heart}</button>
    </div>
    <div class="card__art">${art(p)}</div>
    <div class="card__body">
      <span class="card__cat">${esc(S.catName(p.cat))}</span>
      <h3><a class="card__link" href="#/p/${p.id}">${esc(p.name)}</a></h3>
      <p class="card__blurb">${esc(p.blurb)}</p>
      ${(() => { const n = soldCount(p.id); const rv = reviewsFor(p.id);
        if (!n && !rv.length) return '';
        const avg = rv.length ? (rv.reduce((t, r) => t + (+r.rating || 0), 0) / rv.length).toFixed(1) : '';
        return `<p class="card__social">${rv.length ? `${stars(Math.round(+avg))} <b>${avg}</b>` : ''}${
          rv.length && n ? '<span class="social__dot">·</span>' : ''}${n ? `${n} sold` : ''}</p>`;
      })()}
      ${swatches(p)}
      <div class="card__foot">
        ${priceBlock(p)}
        ${p.personalise ? `<span class="hint">${I.spark}${esc(p.personalise.label)}</span>` : ''}
        <div class="card__buys">
          ${p.quote
            ? `<button class="btn btn--wa btn--sm card__add" data-quote="${p.id}">${I.wa}Get a quote</button>`
            : `<button class="btn btn--pay btn--sm" data-buy="${p.id}">${I.bolt}Buy now</button>
               <button class="btn btn--wa btn--sm" data-wa="${p.id}">${I.wa}WhatsApp</button>
               <button class="btn btn--ghost btn--sm card__add" data-add="${p.id}">Add to cart</button>`}
        </div>
      </div>
    </div>
  </article>`;
}

const grid = list => `<div class="grid">${list.map(card).join('')}</div>`;

function railBlock(title, note, list, href) {
  if (!list.length) return '';
  return `<section class="band band--tight">
    <div class="wrap">
      <div class="headrow headrow--rail">
        <div><h2 class="r">${esc(title)}</h2>${note ? `<p class="quiet r" style="--d:60ms">${esc(note)}</p>` : ''}</div>
        ${href ? `<a class="linky r" href="${href}" style="--d:90ms">See all</a>` : ''}
      </div>
    </div>
    <div class="rail" tabindex="0" aria-label="${esc(title)}">
      <div class="rail__track">${list.map(card).join('')}</div>
    </div>
  </section>`;
}

const catCard = (c, i) => `<a class="catcard r" style="--d:${i * 50}ms" href="#/c/${c.id}">
    <span class="catcard__art">${art({ name: c.name, art: window.ART[({
      home:'planter', puja:'barni', desk:'organizer', kids:'minis',
      gifts:'giftbox', keys:'keys', light:'lamp', custom:'upload' })[c.id]] })}</span>
    <span class="catcard__t"><b>${esc(c.name)}</b><span>${esc(c.note)}</span></span>
  </a>`;

const empty = (title, line, cta) => `<div class="empty"><span data-spark>${I.horn}</span>
  <h4>${esc(title)}</h4><p>${esc(line)}</p>${cta || ''}</div>`;

/* the first moment, before the settings and catalogue land */
const booting = () => `<div class="booting" aria-busy="true" aria-live="polite">
  <div class="booting__art">${I.horn}</div>
  <p class="quiet">Warming the print bed…</p>
</div>`;

/* ---------- HOME ----------------------------------------- */
function home() {
  return `
  <section class="hero wrap">
    <div class="hero__grid">
      <div class="hero__copy">
        <p class="eyebrow r"><span data-origin>${esc(CFG.brand.origin)}</span><span class="chip chip--theme" data-themenote></span></p>
        <h1 class="r" style="--d:70ms">Creative things<br>for a brighter<em>everyday.</em></h1>
        <p class="lede r" style="--d:140ms">${esc(CFG.brand.blurb)}</p>
        <div class="hero__cta r" style="--d:210ms">
          <a class="btn btn--pay" href="#/shop">${I.bolt}Shop products</a>
          <a class="btn btn--ghost" href="#/custom"><span data-spark>${I.spark}</span>Create something custom</a>
        </div>
        <dl class="hero__facts r" style="--d:280ms">
          <div class="fact"><b class="num">${window.PRODUCTS.length}</b><span>things to print</span></div>
          <div class="fact"><b class="num">0.05<span style="font-size:.6em">mm</span></b><span>finest layer</span></div>
          <div class="fact"><b class="num">2-4</b><span>days to dispatch</span></div>
          <div class="fact"><b>Your design</b><span>printed too</span></div>
        </dl>
      </div>
      <div class="printer r" style="--d:120ms" aria-hidden="true">
        <div class="printer__glow"></div><div class="printer__bed"></div>
        <div class="sparkles" id="sparkles"></div>
        <div class="printer__art"><svg viewBox="0 0 200 200"><g class="build">
          <ellipse cx="100" cy="178" rx="58" ry="8" fill="var(--art-4)" opacity=".2"/>
          <rect x="60" y="150" width="80" height="26" rx="8" fill="var(--art-4)" opacity=".85"/>
          <path d="M74 150q-12-52 14-74t48 6q14 18 4 40l-8 28z" fill="var(--art-1)"/>
          <path d="M74 150q-12-52 14-74t24-2v76z" fill="var(--art-2)" opacity=".35"/>
          <path d="M118 78 138 14l6 62z" fill="var(--art-3)"/>
          <path d="M126 60h14M126 44h13M129 30h9" stroke="var(--art-4)" stroke-width="2.6" stroke-linecap="round" opacity=".4"/>
          <path d="M94 80q-17-17-7-34 16 5 21 28z" fill="var(--art-2)"/>
          <path d="M140 92q20 6 17 28t-26 24" stroke="var(--art-2)" stroke-width="12" fill="none" stroke-linecap="round"/>
          <path d="M146 76q16-2 22 12" stroke="var(--art-3)" stroke-width="8" fill="none" stroke-linecap="round"/>
          <circle cx="104" cy="100" r="5.5" fill="var(--art-4)"/>
          <path d="M80 120q11 9 20 2" stroke="var(--art-4)" stroke-width="3.6" fill="none" stroke-linecap="round"/>
          <rect x="66" y="70" width="80" height="80" rx="20" fill="url(#layerlines)" opacity=".55"/>
          <rect x="60" y="150" width="80" height="26" rx="8" fill="url(#layerlines)" opacity=".4"/>
        </g></svg></div>
        <div class="printer__nozzle"></div>
        <div class="printer__hud"><span>Now printing · <b data-hud>Nova bust</b></span><span>Bed <b>60°C</b></span></div>
      </div>
    </div>
  </section>

  <div class="strip" aria-hidden="true"><div class="strip__track" id="stripTrack"><span>Hand finished</span><span>Made to order</span><span>Free shipping over <i data-freeabove></i></span><span>UPI, card, netbanking</span><span>Or just WhatsApp us</span><span>Your design printed too</span></div></div>

  <section class="band band--tight wrap" id="cats">
    <div class="headrow"><div><p class="eyebrow r">Browse</p><h2 class="r" style="--d:60ms">Eight shelves, one little studio.</h2></div></div>
    <div class="cats">${window.CATEGORIES.map(catCard).join('')}</div>
  </section>

  ${occasionBanner()}

  <div id="homeRevs">${pinnedReviews()}</div>

  ${CFG.rails.map(r => {
    const list = S.rail(r);
    const o = window.OCC_NOW;
    const title = r.kind === 'festival' ? (o ? o.name : '') : r.title;
    const note  = r.kind === 'festival' ? (o ? o.banner.note : '') : r.note;
    const href  = r.kind === 'cat' ? `#/c/${r.cat}`
                : r.kind === 'under' ? `#/shop?max=${r.max}`
                : r.kind === 'recent' ? '' : `#/shop?tag=${r.badge || r.kind}`;
    return railBlock(title, note, list, href);
  }).join('')}

  <section class="band wrap" id="how">
    <div class="headrow"><div><p class="eyebrow r">How it works</p>
      <h2 class="r" style="--d:60ms">From file to doorstep.</h2></div></div>
    <div class="steps">
      <div class="step r"><h3>Pick or ask</h3><p>Buy off the shelf, or send a photo, an STL or a MakerWorld link and we quote it.</p></div>
      <div class="step r" style="--d:80ms"><h3>We slice it</h3><p>Layer height, walls and infill chosen per piece. Lamps get thin walls, bookends get thick ones.</p></div>
      <div class="step r" style="--d:160ms"><h3>It prints</h3><p>Filament pieces come off the bed warm. Resin is washed, UV cured, then sanded by hand.</p></div>
      <div class="step r" style="--d:240ms"><h3>Packed and posted</h3><p>Recycled fill, boxed, tracked. Dispatch in 2-4 working days.</p></div>
    </div>
  </section>

  ${reviewsBlock()}`;
}

/* the occasion banner — empty when nothing is running today */
function occasionBanner() {
  const o = window.OCC_NOW;
  if (!o) return '';
  const b = o.banner || {};
  const pic = { puja: 'diya', festival: 'toran', gift: 'giftbox', personalised: 'plaque',
                quirky: 'minis', keys: 'keys', desk: 'organizer', madeinindia: 'bust' }[o.tag] || 'giftbox';
  return `<section class="band band--tight wrap"><div class="promo r">
    <div>
      <p class="eyebrow">${esc(b.eyebrow || o.name)}</p>
      <h2>${esc(b.title || o.name)}</h2>
      <p class="lede">${esc(b.note || '')}</p>
      <a class="btn btn--pay" href="#/shop?tag=${esc(o.tag)}" style="margin-top:1.2rem">See the collection</a>
    </div>
    <div class="promo__art" aria-hidden="true">${art({ name: o.name, art: window.ART[pic] })}</div>
  </div></section>`;
}

/* reviews: real ones only. Add them to a product's reviews[] array. */
function reviewsBlock() {
  const all = window.PRODUCTS.flatMap(p => (p.reviews || []).map(r => ({ ...r, p })));
  if (!all.length) return '';
  return `<section class="band wrap"><div class="headrow"><div>
    <p class="eyebrow r">What our customers say</p><h2 class="r" style="--d:60ms">In their words.</h2></div></div>
    <div class="grid grid--rev">${all.slice(0, 6).map(r => `<blockquote class="rev r">
      <div class="stars" aria-label="${r.rating} out of 5">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <p>${esc(r.text)}</p><cite>${esc(r.name)} · ${esc(r.p.name)}</cite></blockquote>`).join('')}</div></section>`;
}

/* ---------- SHOP ----------------------------------------- */
function shop(q) {
  const cat = q.cat || '';
  const tag = q.tag || '';
  const max = q.max ? +q.max : 0;
  const mat = q.mat || '';
  const sort = q.sort || 'featured';

  let list = window.PRODUCTS.filter(p => !p.hidden);
  if (cat) list = list.filter(p => p.cat === cat);
  if (tag) list = list.filter(p => S.has(p, tag));
  if (max) list = list.filter(p => p.price > 0 && p.price <= max);
  if (mat) list = list.filter(p => (p.variants?.material || []).some(m => m.k === mat) || p.specs.Material.includes(mat));
  /* quoted items have no price, so they sit at the end of either sort */
  const q9 = p => p.quote ? Infinity : p.price;
  if (sort === 'low')  list = [...list].sort((a, b) => q9(a) - q9(b));
  if (sort === 'high') list = [...list].sort((a, b) => (b.quote ? -1 : b.price) - (a.quote ? -1 : a.price));
  if (sort === 'new')  list = [...list].sort((a, b) => (S.has(b, 'new') ? 1 : 0) - (S.has(a, 'new') ? 1 : 0));

  const c = window.CATEGORIES.find(x => x.id === cat);
  const heading = c ? c.name : tag ? ({ gift: 'Gift Ideas', festival: CFG.festival.name, personalised: 'Personalised',
      quirky: 'Cute & Quirky', bestseller: 'Best Sellers', trending: 'Trending', new: 'New Arrivals' }[tag] || 'Shop')
    : max ? `Under ${money(max)}` : 'Everything';

  return `<section class="band band--tight wrap">
    <div class="headrow">
      <div><p class="eyebrow r">${c ? 'Category' : 'Shop'}</p><h2 class="r" style="--d:60ms">${esc(heading)}</h2>
        ${c ? `<p class="quiet r" style="--d:100ms">${esc(c.note)}</p>` : ''}</div>
    </div>
  </section>

  <nav class="catbar" aria-label="Categories">
    <div class="catbar__in wrap">
      <a class="chip${!cat && !tag && !max ? ' on' : ''}" href="#/shop">All</a>
      ${window.CATEGORIES.map(x => `<a class="chip${cat === x.id ? ' on' : ''}" href="#/c/${x.id}">${esc(x.name)}</a>`).join('')}
    </div>
  </nav>

  <section class="band band--tight wrap">
    <div class="filters">
      <span class="filters__n num">${list.length} product${list.length === 1 ? '' : 's'}</span>
      <div class="filters__g">
        <label class="sel"><span>Price</span>
          <select data-f="max">
            <option value="">Any</option>
            <option value="299"${max === 299 ? ' selected' : ''}>Under ${money(299)}</option>
            <option value="499"${max === 499 ? ' selected' : ''}>Under ${money(499)}</option>
            <option value="999"${max === 999 ? ' selected' : ''}>Under ${money(999)}</option>
          </select></label>
        <label class="sel"><span>Material</span>
          <select data-f="mat"><option value="">Any</option>
            ${['PLA', 'PGLA', 'ABS'].map(m => `<option${mat === m ? ' selected' : ''}>${m}</option>`).join('')}
          </select></label>
        <label class="sel"><span>Sort</span>
          <select data-f="sort">
            <option value="featured"${sort === 'featured' ? ' selected' : ''}>Featured</option>
            <option value="new"${sort === 'new' ? ' selected' : ''}>Newest</option>
            <option value="low"${sort === 'low' ? ' selected' : ''}>Price: low to high</option>
            <option value="high"${sort === 'high' ? ' selected' : ''}>Price: high to low</option>
          </select></label>
      </div>
    </div>
    ${list.length ? grid(list) : empty('Nothing on this shelf yet',
      'Try another category, or tell us what you were hoping to find.',
      '<a class="btn btn--wa btn--sm" href="#/custom">Ask Joyshine</a>')}
  </section>`;
}

/* ---------- PRODUCT -------------------------------------- */
function product(id, sel) {
  const p = S.byId(id);
  if (!p) return notFound();
  const v = sel || S.defaults(p);
  const hex = S.colourHex(p, v);
  const unit = S.unitPrice(p, v);
  const related = window.PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 6);
  const alsoLike = window.PRODUCTS.filter(x => x.cat !== p.cat && S.has(x, 'bestseller')).slice(0, 6);

  const optRow = (kind, label, opts, render) => !opts ? '' : `
    <div class="opt"><span class="opt__l">${label}${kind === 'material'
      ? ` <button class="qmark" data-tip="PLA is the everyday choice. PGLA is tougher and glossier. ABS handles heat." aria-label="Material help">?</button>` : ''}</span>
      <div class="opt__r" role="group">${opts.map(o => render(o)).join('')}</div></div>`;

  return `<nav class="crumbs wrap"><a href="#/shop">Shop</a><i>/</i><a href="#/c/${p.cat}">${esc(S.catName(p.cat))}</a><i>/</i><span>${esc(p.name)}</span></nav>

  <section class="pdp wrap" data-id="${p.id}">
    <div class="pdp__media">
      <div class="pdp__stage" id="pdpStage">${art(p, hex, 'pdp__art')}
        ${badgeOf(p) ? `<span class="card__tag">${esc(badgeOf(p))}</span>` : ''}
        <div class="pdp__acts">
          <button class="heart" data-share="${p.id}" aria-label="Share this">${I.share}</button>
          <button class="heart${S.inWish(p.id) ? ' on' : ''}" data-wish="${p.id}" aria-label="Save to wishlist">${S.inWish(p.id) ? I.heartOn : I.heart}</button>
        </div>
      </div>
      <div class="thumbs">
        ${(p.variants?.colour || [{ k: '', hex: null, label: 'As shown' }]).slice(0, 6).map(c =>
          `<button class="thumb${v.colour === c.k ? ' on' : ''}" data-v="colour" data-val="${c.k}" title="${esc(c.label)}">
            <svg viewBox="0 0 200 200"${c.hex ? ` style="--art-1:${c.hex}"` : ''}>${p.art}</svg></button>`).join('')}
        <div class="thumb thumb--scale" title="Size reference">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <rect x="24" y="150" width="152" height="6" rx="3" fill="var(--art-4)" opacity=".3"/>
            <path d="M28 142v20M100 146v16M172 142v20" stroke="var(--art-4)" stroke-width="4" stroke-linecap="round" opacity=".45"/>
            <g opacity=".9">${p.art}</g>
          </svg>
          <b>Scale</b>
        </div>
      </div>
    </div>

    <div class="pdp__info">
      <span class="card__cat">${esc(S.catName(p.cat))}</span>
      <h1>${esc(p.name)}</h1>
      ${socialLine(p)}
      <p class="lede">${esc(p.blurb)}</p>
      ${p.story ? `<p class="story">${esc(p.story)}</p>` : ''}

      <div class="pdp__price">
        ${p.quote ? `<b>Quoted on WhatsApp</b>`
          : `<b class="num" id="pdpPrice">${money(unit)}</b>
             ${p.was ? `<s class="num">${money(p.was)}</s><em>${Math.round((1 - p.price / p.was) * 100)}% off</em>` : ''}`}
        <span class="quiet">${p.quote ? 'Send the file, we price it' : 'Inclusive of taxes'}</span>
      </div>

      <div class="opts">
        ${optRow('size', 'Size', p.variants?.size, o =>
          `<button class="pill${v.size === o.k ? ' on' : ''}" data-v="size" data-val="${o.k}">
            <b>${esc(o.label || o.k)}</b>
            <span>${dims(o)}</span></button>`)}
        ${optRow('material', 'Material', p.variants?.material, o => {
          const gone = o.stock != null && o.stock <= 0;
          return `<button class="pill${v.material === o.k ? ' on' : ''}${gone ? ' pill--gone' : ''}"
            data-v="material" data-val="${o.k}"${gone ? ' disabled' : ''}>
            <b>${esc(o.label)}</b>
            <span>${gone ? 'out of stock' : (o.delta ? `+${money(o.delta)}` : 'included')}</span>
            ${o.stock != null && o.stock > 0 && o.stock <= 5 ? `<i class="pill__low">only ${o.stock} left</i>` : ''}
          </button>`;
        })}
        ${optRow('colour', 'Colour', p.variants?.colour, o =>
          `<button class="sw${v.colour === o.k ? ' on' : ''}" data-v="colour" data-val="${o.k}"
            title="${esc(o.label)}" aria-label="${esc(o.label)}"><i style="background:${o.hex}"></i></button>`)}
      </div>
      <p class="quiet sel__now">${selNow(p, v)}</p>

      ${window.CUSTOM.render(p)}

      <div class="qtyrow">
        <div class="qty" data-pdpqty>
          <button data-pq="-1" aria-label="One fewer">&minus;</button>
          <span class="num" id="pdpQty">1</span>
          <button data-pq="1" aria-label="One more">+</button>
        </div>
        <span class="quiet" id="pdpBulk"></span>
      </div>

      <div class="pdp__buys">
        ${p.quote
          ? `<a class="btn btn--wa btn--block" href="#/custom?p=${p.id}">${I.wa}Send your file for a quote</a>`
          : `<button class="btn btn--pay" id="pdpBuy">${I.bolt}Buy now</button>
             <button class="btn btn--wa" id="pdpWa">${I.wa}Order on WhatsApp</button>
             <button class="btn btn--ghost btn--block" id="pdpAdd">Add to cart</button>`}
      </div>

      ${p.bulk ? `<details class="bulk">
        <summary><b>Need ${CFG.bulk.askAbove}+ pieces?</b></summary>
        <table><tbody>${CFG.bulk.tiers.map(t => `<tr><td>${t.min}${t.max ? `–${t.max}` : '+'}</td>
          <td class="num">${t.off ? `${t.off}% off` : 'list price'}</td></tr>`).join('')}</tbody></table>
        <button class="btn btn--wa btn--block" id="pdpBulk2">${I.wa}Request quote</button>
      </details>` : ''}

      <div class="acc">
        ${(() => {
          /* a heading with nothing under it is worse than no heading */
          const d = p.details || {};
          const ship = (d.shipping || '').trim();
          const rows = [
            ['Description', [p.blurb, p.story].filter(Boolean).join(' ')],
            ['Materials', d.materials],
            ['Dimensions', d.dimensions],
            ['Care', d.care],
            ['Production', d.production],
            ['Shipping & returns', ship && ship + ' Unused shelf items can be returned within 7 days. Personalised and custom pieces cannot be returned once printed.'],
            p.personalise ? ['Customisation', `We print exactly what you type. ${p.personalise.max} characters max. Check spelling — a reprint is a new order.`] : null,
          ].filter(r => r && String(r[1] || '').trim());
          return rows.map(([t, b], i) => `<details${i === 0 ? ' open' : ''}>
            <summary>${esc(t)}</summary><div>${esc(b)}</div></details>`).join('');
        })()}
      </div>

      <div class="pdp__share">
        <span class="quiet">${esc(CFG.brand.origin)}</span>
      </div>

      <div class="revs" id="revs">${reviewBlock(p)}</div>
    </div>
  </section>

  ${railBlock('More from ' + S.catName(p.cat), '', related, `#/c/${p.cat}`)}
  ${railBlock('You may also like', '', alsoLike, '#/shop')}`;
}

/* ---------- reviews --------------------------------------
   Whatever came back from the database, plus anything written
   into the product itself, plus the form to add one.          */
function reviewsFor(id) {
  const fromDb = (window.REVIEWS || []).filter(r => r.product_id === id)
    .map(r => ({ name: r.name, rating: r.rating, text: r.body, title: r.title,
                 verified: r.verified, when: r.created_at }));
  const p = S.byId(id);
  const inline = (p && p.reviews || []).map(r => ({ name: r.name, rating: r.rating, text: r.text }));
  return fromDb.concat(inline);
}

const stars = n => `<span class="stars" aria-label="${n} out of 5">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;

/* Only ever the real count, straight from the orders table. No
   number at all until somebody has actually bought one. */
function soldCount(id) {
  const s = (window.SALES || {})[id];
  return s && s.sold > 0 ? s.sold : 0;
}

function socialLine(p) {
  const n = soldCount(p.id);
  const revs = reviewsFor(p.id);
  const avg = revs.length ? revs.reduce((t, r) => t + (+r.rating || 0), 0) / revs.length : 0;
  const bits = [];
  if (revs.length) bits.push(`<a href="#revs" class="social__rev">${stars(Math.round(avg))}
    <b>${avg.toFixed(1)}</b> <i>(${revs.length})</i></a>`);
  if (n) bits.push(`<span class="social__sold">${n} ${n === 1 ? 'person has' : 'people have'} bought this</span>`);
  return bits.length ? `<p class="social" data-social="${esc(p.id)}">${bits.join('<span class="social__dot">·</span>')}</p>` : '<p class="social" data-social="' + esc(p.id) + '" hidden></p>';
}

function reviewOne(r) {
  return `<blockquote class="rev">
    <div class="rev__top">${stars(r.rating)}${r.verified ? '<span class="rev__ok">verified buyer</span>' : ''}</div>
    ${r.title ? `<b>${esc(r.title)}</b>` : ''}
    <p>${esc(r.text)}</p>
    <cite>${esc(r.name)}${r.when ? ` · ${new Date(r.when).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : ''}</cite>
  </blockquote>`;
}

/* the ones the owner pinned in the panel, on the homepage */
function pinnedReviews() {
  const list = (window.REVIEWS || []).filter(r => r.pinned).slice(0, 6);
  if (!list.length) return '';
  return `<section class="band band--tight wrap">
    <div class="headrow"><div><p class="eyebrow r">In their words</p>
      <h2 class="r" style="--d:60ms">What came back to us.</h2></div></div>
    <div class="revwall">
      ${list.map((r, i) => `<figure class="rev rev--card r" style="--d:${i * 60}ms">
        <div class="rev__top">${stars(r.rating)}${r.verified ? '<span class="rev__ok">verified buyer</span>' : ''}</div>
        ${r.title ? `<b>${esc(r.title)}</b>` : ''}
        <p>${esc(r.body)}</p>
        <figcaption>${esc(r.name)}${r.product_id && S.byId(r.product_id)
          ? ` · <a href="#/p/${esc(r.product_id)}">${esc(S.byId(r.product_id).name)}</a>` : ''}</figcaption>
      </figure>`).join('')}
    </div>
  </section>`;
}

function reviewBlock(p) {
  const list = reviewsFor(p.id);
  const avg = list.length ? (list.reduce((n, r) => n + (+r.rating || 0), 0) / list.length) : 0;
  return `
    <div class="revs__head">
      <h3>Reviews</h3>
      ${list.length ? `<span class="revs__avg">${stars(Math.round(avg))} <b>${avg.toFixed(1)}</b>
        <i>from ${list.length} ${list.length === 1 ? 'review' : 'reviews'}</i></span>` : ''}
    </div>
    ${list.length ? list.map(reviewOne).join('')
      : '<p class="quiet">Nobody has written about this one yet. If you have it, you could be the first.</p>'}

    <details class="revform" id="revForm">
      <summary><span class="btn btn--ghost btn--sm">Write a review</span></summary>
      <div class="revform__in">
        <div class="row2">
          <label class="field"><span>Your name <i>*</i></span><input id="rv_name" type="text" placeholder="Aarohi M."><u></u></label>
          <label class="field"><span>Rating <i>*</i></span>
            <select id="rv_rating">
              <option value="5">5 — loved it</option><option value="4">4 — very good</option>
              <option value="3">3 — fine</option><option value="2">2 — not great</option>
              <option value="1">1 — no</option>
            </select></label>
        </div>
        <label class="field"><span>Headline</span><input id="rv_title" type="text" placeholder="Sturdier than it looks"><u></u></label>
        <label class="field"><span>Your review <i>*</i></span><textarea id="rv_body" placeholder="What you got, how it printed, how it has held up."></textarea><u></u></label>
        <button class="btn btn--pay btn--block" id="rv_send" type="button" data-rev="${esc(p.id)}">Send it in</button>
        <p class="quiet" style="font-size:.78rem;margin-top:.6rem">We read every one before it goes up, and we do not edit them.</p>
      </div>
    </details>`;
}

/* ---------- CUSTOM PRINT --------------------------------- */
function custom(q) {
  const c = CFG.custom;
  const paths = [
    ['image', I.file, 'Upload your design', 'A photo, sketch or logo. We model it, then print it.'],
    ['stl',   I.up,   'Upload a 3D file',   'STL, 3MF or OBJ. We check it slices cleanly and quote.'],
    ['link',  I.link, 'Share a MakerWorld link', 'Paste the model URL. We print it in your colours.'],
    ['idea',  I.chat, 'Describe your idea', 'No file needed. Tell us what you picture.'],
  ];
  return `<section class="band band--tight wrap">
    <div class="headrow"><div>
      <p class="eyebrow r">Custom print</p>
      <h2 class="r" style="--d:60ms">Bring us something that doesn't exist yet.</h2>
      <p class="lede r" style="--d:120ms">Name plaques, cake toppers, a replacement knob, a unicorn wearing your dog's face. Send what you have — we come back with a price in two to three days.</p>
    </div></div>

    <div class="paths" role="group" aria-label="How would you like to start">
      ${paths.map(([k, ic, t, d], i) => `<button class="path r${i === 0 ? ' on' : ''}" style="--d:${i * 60}ms" data-path="${k}">
        <span class="path__i">${ic}</span><b>${t}</b><span class="path__d">${d}</span></button>`).join('')}
    </div>

    <form class="cform r" id="customForm" novalidate>
      <div class="note">${I.info}<span>Attach your file here and it uploads when you press send, so WhatsApp opens with the link already in the message. Too big, or already on a drive? Paste the link instead. Accepted: ${esc(c.fileTypes)}, up to ${c.maxSizeMB} MB.</span></div>

      <div id="pathFields"></div>

      <div class="row2">
        <label class="field"><span>Name <i>*</i></span><input id="c_name" type="text" autocomplete="name" placeholder="Aarohi Menon"><u></u></label>
        <label class="field"><span>Mobile <i>*</i></span><input id="c_phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="98765 43210"><u></u></label>
      </div>
      <label class="field"><span>Email</span><input id="c_email" type="email" autocomplete="email" placeholder="you@example.com"><u></u></label>

      <div class="row3">
        <label class="field"><span>Quantity</span><input id="c_qty" type="number" min="${c.minQty}" value="1"><u></u></label>
        <label class="field"><span>Size</span><select id="c_size">${c.sizes.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>
        <label class="field"><span>Material</span><select id="c_mat">${c.materials.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>
      </div>
      <div class="row2">
        <label class="field"><span>Colour</span><select id="c_col">${c.colours.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>
        <label class="field"><span>Needed by</span><input id="c_by" type="date"><u></u></label>
      </div>

      <label class="field"><span>Notes</span><textarea id="c_notes" placeholder="Anything that helps: where it goes, how it is used, a size you have measured."></textarea><u></u></label>

      <div class="field"><span>Message preview</span><div class="preview" id="cPreview" aria-live="polite"></div></div>

      <button class="btn btn--wa btn--block" id="cSend" type="button">${I.wa}Send on WhatsApp</button>
      <p class="quiet" style="font-size:.78rem;text-align:center">We reply with a price and a print slot. ${esc(c.turnaround)}.</p>
    </form>
  </section>`;
}

/* ---------- WISHLIST / FAQ / ABOUT ----------------------- */
function wishlist() {
  const list = S.wish.map(S.byId).filter(Boolean);
  return `<section class="band band--tight wrap">
    <div class="headrow"><div><p class="eyebrow r">Saved</p><h2 class="r" style="--d:60ms">Your wishlist</h2></div></div>
    ${list.length ? grid(list) : empty('Nothing saved yet',
      'Tap the heart on anything you like and it waits for you here.',
      '<a class="btn btn--pay btn--sm" href="#/shop">Explore products</a>')}
  </section>`;
}

const FAQ = [
  ['Orders', [
    ['How do I order?', 'Two ways. Buy now takes you straight to Razorpay for UPI, card, wallet or netbanking. Or press the WhatsApp button — fill in your address here and we hand you a ready-made message to send us.'],
    ['How can I track my order?', 'We send the courier tracking link on WhatsApp the day it ships. Reply to that thread any time for an update.'],
  ]],
  ['Custom printing', [
    ['Can I upload my own design?', 'Yes. Use the Custom Print page, then attach the image in WhatsApp when it opens. A photo or a rough sketch is enough to start.'],
    ['Can I send an STL?', 'Yes — STL, 3MF or OBJ. We check it slices cleanly before quoting. If it needs repair work we tell you first.'],
    ['Can I share a MakerWorld link?', 'Yes. Paste the model URL and we print it in the colours and size you want. We only print models whose licence allows it.'],
    ['How long does a custom print take?', 'Two to three days to quote, then three to seven days to print, depending on size and what is in the queue.'],
  ]],
  ['Products', [
    ['What materials do you use?', 'PLA for most decor, PGLA where it needs to be tougher and glossier, ABS where it has to handle heat, and resin for fine detail pieces.'],
    ['Can I choose the colour and size?', 'On most products, yes — the options are on the product page. If the combination you want is not listed, ask on WhatsApp.'],
    ['Will I see the layer lines?', 'On some pieces, yes, and that is deliberate. 3D printing builds in layers and fine lines are part of how it looks. We sand where it matters and leave them where they suit the piece.'],
  ]],
  ['Shipping', [
    ['How long does delivery take?', 'Dispatch in 2-4 working days, then two to six days by courier depending on your PIN code.'],
    ['Do you ship free?', `Yes, above ${money(CFG.shipping.freeAbove)}. Below that it is a flat ${money(CFG.shipping.flat)}.`],
    ['How is it packed?', 'Recycled fill inside a rigid box. Lamps and resin pieces get a second inner box.'],
  ]],
  ['Returns', [
    ['Can I return something?', 'Unused shelf items, within 7 days, in their packaging. Message us on WhatsApp and we arrange the pickup.'],
    ['Can customised products be returned?', 'No — once a personalised or custom piece is printed it cannot be resold, so it cannot be returned. Please check spelling before you order.'],
  ]],
];

function faq() {
  return `<section class="band band--tight wrap">
    <div class="headrow"><div><p class="eyebrow r">Help</p><h2 class="r" style="--d:60ms">Questions, answered plainly.</h2></div></div>
    ${FAQ.map(([sec, qs]) => `<div class="faqsec r"><h3>${esc(sec)}</h3><div class="acc">
      ${qs.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${esc(a)}</div></details>`).join('')}
    </div></div>`).join('')}
    <div class="note r" style="margin-top:2rem">${I.wa}<span>Still stuck? Message us on WhatsApp — <b id="waNumber"></b> — and a human replies.</span></div>
  </section>`;
}

function about() {
  return `<section class="band band--tight wrap">
    <div class="headrow"><div><p class="eyebrow r">About</p>
      <h2 class="r" style="--d:60ms">Small things. Big joy.</h2>
      <p class="lede r" style="--d:120ms">Joyshine is a small studio in India making 3D-printed and handcrafted things for everyday life — a barni for the puja shelf, a lamp for a child's room, a keychain with your name on it.</p></div></div>
    <div class="steps">
      <div class="step r"><h3>Made to order</h3><p>Nothing sits in a warehouse. Your piece starts printing after you order, which is why it takes a few days and why you can change the colour.</p></div>
      <div class="step r" style="--d:80ms"><h3>Honest about the process</h3><p>3D printing leaves fine layer lines and small variations. We sand where it matters and tell you where it shows. No two pieces are identical.</p></div>
      <div class="step r" style="--d:160ms"><h3>Your ideas too</h3><p>Roughly a third of what leaves the studio is something a customer asked for that we had never made before.</p></div>
    </div>
    <div class="trust r">
      <div><b>${esc(CFG.brand.origin)}</b><span>Designed and printed here</span></div>
      <div><b>Free over ${money(CFG.shipping.freeAbove)}</b><span>Flat ${money(CFG.shipping.flat)} below that</span></div>
      <div><b>7-day returns</b><span>On unused shelf items</span></div>
      <div><b id="waNumber2"></b><span>WhatsApp us any time</span></div>
    </div>
  </section>`;
}

/* ---------- ENGINEERING & PROTOTYPING -------------------- */
function engineering() {
  const E = CFG.engineering;
  if (!E || !E.active) return notFound();
  return `<section class="eng-hero wrap">
    <p class="eyebrow r">Service line<span class="chip chip--theme" data-themenote></span></p>
    <h1 class="r" style="--d:60ms">${esc(E.name)}</h1>
    <p class="lede r" style="--d:120ms">${esc(E.blurb)}</p>
    <div class="hero__cta r" style="--d:180ms">
      <button class="btn btn--pay" id="engQuote">${I.bolt}Get a part quoted</button>
      <a class="btn btn--ghost" href="#/custom?path=stl">${I.up}Send an STL</a>
    </div>
    <dl class="hero__facts r" style="--d:240ms">
      <div class="fact"><b class="num">24h</b><span>to quote</span></div>
      <div class="fact"><b class="num">2-7</b><span>days to parts</span></div>
      <div class="fact"><b class="num">1</b><span>minimum order</span></div>
      <div class="fact"><b>±0.3 mm</b><span>typical tolerance</span></div>
    </dl>
  </section>

  <section class="band band--tight wrap">
    <div class="headrow"><div><p class="eyebrow r">What we take on</p>
      <h2 class="r" style="--d:60ms">Parts, not ornaments.</h2></div></div>
    <div class="steps">
      ${E.services.map(([t, d], i) => `<div class="step r" style="--d:${i * 70}ms">
        <h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}
    </div>
  </section>

  <section class="band band--tight wrap">
    <div class="headrow"><div><p class="eyebrow r">Materials</p>
      <h2 class="r" style="--d:60ms">Pick by what the part has to survive.</h2></div></div>
    <div class="tablewrap r">
      <table class="spectable">
        <thead><tr><th>Material</th><th>Class</th><th>Heat</th><th>Use it when</th></tr></thead>
        <tbody>${E.materials.map(([m, c, h, w]) => `<tr>
          <td><b>${esc(m)}</b></td><td>${esc(c)}</td><td class="num">${esc(h)}</td><td>${esc(w)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
    <p class="quiet r" style="margin-top:1rem;font-size:.82rem">Heat figures are the point the part starts to soften under light load, not a rating. Tell us the working temperature and we will pick for you.</p>
  </section>

  <section class="band band--tight wrap">
    <div class="headrow"><div><p class="eyebrow r">The boring, important numbers</p>
      <h2 class="r" style="--d:60ms">What the machines can hold.</h2></div></div>
    <div class="tablewrap r">
      <table class="spectable">
        <tbody>${E.specs.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </section>

  <section class="band band--tight wrap">
    <div class="headrow"><div><p class="eyebrow r">How a job runs</p>
      <h2 class="r" style="--d:60ms">Four steps, no purchase order needed.</h2></div></div>
    <div class="steps">
      <div class="step r"><h3>Send the file</h3><p>STEP, STL, 3MF, IGES or a dimensioned drawing. A photo and a measurement works too.</p></div>
      <div class="step r" style="--d:80ms"><h3>We check it prints</h3><p>Wall thickness, overhangs, tolerances and orientation. We tell you what we would change before quoting.</p></div>
      <div class="step r" style="--d:160ms"><h3>Quote in 24 hours</h3><p>Price per part at your quantity, material options and a lead time. No minimum order.</p></div>
      <div class="step r" style="--d:240ms"><h3>Printed and checked</h3><p>Critical dimensions measured with calipers before it ships. We tell you what we measured.</p></div>
    </div>
    <div class="note r" style="margin-top:2rem">${I.info}<span>Your files are used for your job and nothing else. Ask and we will sign an NDA before you send anything.</span></div>
  </section>

  <section class="band band--tight wrap">
    <div class="promo r">
      <div>
        <p class="eyebrow">Ready when you are</p>
        <h2>Send us the part.</h2>
        <p class="lede">A quote costs nothing and takes a day. Bring a file, a sample or a sketch.</p>
        <div class="hero__cta" style="margin-top:1.2rem">
          <button class="btn btn--wa" id="engQuote2">${I.wa}Quote on WhatsApp</button>
          <a class="btn btn--ghost" href="#/">Back to the shop</a>
        </div>
      </div>
      <div class="promo__art" aria-hidden="true">${art({ name: 'Part', art: window.ART.organizer })}</div>
    </div>
  </section>`;
}

/* ---------- SEARCH RESULTS ------------------------------- */
function searchPage(q) {
  const res = S.search(q);
  return `<section class="band band--tight wrap">
    <div class="headrow"><div><p class="eyebrow r">Search</p>
      <h2 class="r" style="--d:60ms">${res.length ? `${res.length} result${res.length === 1 ? '' : 's'} for "${esc(q)}"` : `"${esc(q)}"`}</h2></div></div>
    ${res.length ? grid(res) : noResults(q)}
  </section>`;
}

function noResults(q) {
  return `<div class="dead r">
    <div class="dead__head">${I.horn}
      <h3>We couldn't find that yet.</h3>
      <p>Nothing on the shelf matches "${esc(q)}" — but that does not mean we can't make it.</p>
    </div>
    <div class="paths">
      <a class="path" href="#/custom?path=image&q=${encodeURIComponent(q)}"><span class="path__i">${I.file}</span><b>Upload your design</b><span class="path__d">A photo or sketch is enough to start.</span></a>
      <a class="path" href="#/custom?path=stl&q=${encodeURIComponent(q)}"><span class="path__i">${I.up}</span><b>Upload an STL</b><span class="path__d">STL, 3MF or OBJ. We check it and quote.</span></a>
      <a class="path" href="#/custom?path=link&q=${encodeURIComponent(q)}"><span class="path__i">${I.link}</span><b>Share a MakerWorld link</b><span class="path__d">We print it in your colours and size.</span></a>
      <a class="path" href="#/custom?path=idea&q=${encodeURIComponent(q)}"><span class="path__i">${I.chat}</span><b>Ask Joyshine</b><span class="path__d">Describe it. We will tell you if we can.</span></a>
    </div>
    <div class="dead__alt"><span class="quiet">Or try</span>
      ${S.POPULAR.slice(0, 5).map(t => `<button class="chip" data-q="${esc(t)}">${esc(t)}</button>`).join('')}</div>
  </div>`;
}

function notFound() {
  return `<section class="band wrap">${empty('That page has wandered off',
    'The link may be old, or we may have renamed something.',
    '<a class="btn btn--pay btn--sm" href="#/">Back to the shop</a>')}</section>`;
}

return { I, esc, art, card, grid, railBlock, empty, badgeOf, occasionBanner, selNow, booting,
         reviewBlock, reviewsFor, reviewOne, stars, socialLine, soldCount, pinnedReviews,
         home, shop, product, custom, wishlist, faq, about, engineering,
         searchPage, noResults, notFound };
})();
