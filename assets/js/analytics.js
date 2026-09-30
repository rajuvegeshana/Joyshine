/* ===========================================================
   ANALYTICS — Google Analytics 4, loaded only after consent.

   India's DPDP Act 2023 (and GDPR for any EU visitor) means we
   cannot drop Google's cookies on someone before they agree. So
   nothing loads until they say yes: decline and not a single
   byte goes to Google.

   The shop's own visit counter in promo.js is separate, needs
   no consent, and keeps working either way.
   =========================================================== */
window.GA = (() => {
'use strict';

const CFG = () => window.JOYSHINE.analytics || {};
const KEY = 'joyshine.consent';
const id = () => CFG().ga4 || '';
const wanted = () => !!(CFG().on && /^G-[A-Z0-9]+$/i.test(id()));

let loaded = false, queue = [];

const choice = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

function load() {
  if (loaded || !wanted()) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  /* the router sends its own page_view, so the tag must not guess */
  gtag('config', id(), { send_page_view: false, anonymize_ip: true });

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id());
  document.head.appendChild(s);

  queue.forEach(([n, p]) => gtag('event', n, p));
  queue = [];
}

function event(name, params = {}) {
  if (!wanted() || choice() !== 'yes') return;
  if (!loaded) { queue.push([name, params]); return; }
  try { gtag('event', name, params); } catch {}
}

const page = (path, title) => event('page_view', {
  page_location: location.origin + location.pathname + '#' + path,
  page_path: path, page_title: title,
});

/* one product, in the shape GA4 expects */
const item = (p, qty, variant) => ({
  item_id: p.id, item_name: p.name,
  item_category: window.S ? S.catName(p.cat) : p.cat,
  item_variant: variant || '', price: p.price, quantity: qty || 1,
});

/* ---------- the consent notice --------------------------- */
function ask() {
  if (!wanted() || choice()) { if (choice() === 'yes') load(); return; }

  const el = document.createElement('div');
  el.className = 'consent';
  el.innerHTML = `
    <div class="consent__in">
      <p>We would like to use Google Analytics to see which products people look at,
         so we make more of what you like. It sets cookies. Nothing happens unless you agree,
         and the shop works exactly the same either way.</p>
      <div class="consent__btns">
        <button class="btn btn--pay btn--sm" data-yes>Allow</button>
        <button class="btn btn--ghost btn--sm" data-no>No thanks</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));

  el.addEventListener('click', e => {
    const yes = e.target.closest('[data-yes]');
    const no = e.target.closest('[data-no]');
    if (!yes && !no) return;
    try { localStorage.setItem(KEY, yes ? 'yes' : 'no'); } catch {}
    if (yes) { load(); page(location.hash.replace(/^#/, '') || '/', document.title); }
    else queue = [];
    el.classList.remove('on');
    setTimeout(() => el.remove(), 300);
  });
}

function start() {
  if (choice() === 'yes') load();
  else setTimeout(ask, 2500);
}

return { start, event, page, item, load, get on() { return wanted() && choice() === 'yes'; } };
})();
