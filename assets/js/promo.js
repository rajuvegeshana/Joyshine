/* ===========================================================
   PROMO — the top ribbon, the welcome offer popup, discount
   codes and a plain visit count. All of it is driven from the
   control panel; nothing here is hard-coded.

   On discount codes, plainly: the browser applies them, so a
   determined person can forge one. Supabase enforces expiry and
   usage limits, which stops casual sharing — it is not
   accounting-grade until checkout runs on a server.
   =========================================================== */
window.PROMO = (() => {
'use strict';

const CFG = () => window.JOYSHINE;
const SB = () => CFG().supabase || {};
const on = () => !!(SB().url && SB().anonKey);
const base = () => SB().url.replace(/\/+$/, '');
const head = () => ({ apikey: SB().anonKey, Authorization: `Bearer ${SB().anonKey}`, 'Content-Type': 'application/json' });
const $ = s => document.querySelector(s);

const SEEN = 'joyshine.welcomed';
const OFFER = 'joyshine.offer';

/* ---------- visit count -----------------------------------
   One row per visit, no identifiers, no cookies. Enough to
   answer "how busy was last week" and nothing more.          */
function ping() {
  if (!on()) return;
  try {
    const key = 'joyshine.pinged';
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(key) === today) return;   // once a day per browser
    localStorage.setItem(key, today);
    fetch(`${base()}/rest/v1/visits`, {
      method: 'POST', headers: head(), keepalive: true,
      body: JSON.stringify({ path: location.hash.slice(0, 80) || '/', ref: (document.referrer || '').slice(0, 120) }),
    }).catch(() => {});
  } catch {}
}

/* ---------- the top ribbon -------------------------------- */
function ribbon() {
  const r = CFG().marketing?.ribbon;
  if (!r || !r.on || !r.text) return;
  if (r.dismissible && sessionStorage.getItem('joyshine.ribbon') === r.text) return;

  const el = document.createElement('div');
  el.className = 'ribbon';
  el.innerHTML =
    `<span>${esc(r.text)}</span>` +
    (r.cta && r.href ? `<a href="${esc(r.href)}">${esc(r.cta)}</a>` : '') +
    (r.dismissible ? `<button class="ribbon__x" aria-label="Dismiss">&times;</button>` : '');
  document.body.prepend(el);
  document.documentElement.style.setProperty('--ribbon-h', el.offsetHeight + 'px');
  el.querySelector('.ribbon__x')?.addEventListener('click', () => {
    try { sessionStorage.setItem('joyshine.ribbon', r.text); } catch {}
    el.remove();
    document.documentElement.style.setProperty('--ribbon-h', '0px');
  });
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/* ---------- welcome offer --------------------------------- */
function welcome() {
  const w = CFG().marketing?.welcome;
  if (!w || !w.on) return;
  try { if (localStorage.getItem(SEEN)) return; } catch {}

  setTimeout(() => {
    const wrap = document.createElement('div');
    wrap.className = 'welcome';
    wrap.innerHTML = `
      <div class="welcome__card" role="dialog" aria-modal="true" aria-label="${esc(w.title)}">
        <button class="welcome__x" aria-label="No thanks">&times;</button>
        <div class="welcome__art">${window.ART?.[w.art || 'giftbox'] ?
          `<svg viewBox="0 0 200 200">${window.ART[w.art || 'giftbox']}</svg>` : ''}</div>
        <p class="eyebrow">${esc(w.eyebrow || 'Welcome')}</p>
        <h2>${esc(w.title)}</h2>
        <p class="lede">${esc(w.body)}</p>
        ${w.code ? `<div class="welcome__code"><code>${esc(w.code)}</code>
          <button class="btn btn--sm btn--ghost" data-copy>Copy</button></div>` : ''}
        <div class="welcome__cta">
          <a class="btn btn--pay" href="${esc(w.href || '#/shop')}" data-close>${esc(w.cta || 'Start shopping')}</a>
          <button class="btn btn--ghost btn--sm" data-close>Maybe later</button>
        </div>
        ${w.small ? `<p class="quiet welcome__small">${esc(w.small)}</p>` : ''}
      </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('on'));

    const close = () => {
      try { localStorage.setItem(SEEN, '1'); } catch {}
      wrap.classList.remove('on');
      setTimeout(() => wrap.remove(), 300);
    };
    wrap.addEventListener('click', e => {
      if (e.target === wrap || e.target.closest('[data-close]') || e.target.closest('.welcome__x')) close();
      if (e.target.closest('[data-copy]') && w.code) {
        navigator.clipboard?.writeText(w.code).then(() => {
          e.target.textContent = 'Copied';
          setTimeout(() => { e.target.textContent = 'Copy'; }, 1600);
        }).catch(() => {});
      }
    });
    addEventListener('keydown', function esc2(ev) {
      if (ev.key === 'Escape') { close(); removeEventListener('keydown', esc2); }
    });
  }, (w.delay ?? 6) * 1000);
}

/* ---------- discount codes -------------------------------- */
let applied = null;
try { applied = JSON.parse(localStorage.getItem(OFFER) || 'null'); } catch {}

async function check(code) {
  code = String(code || '').trim().toUpperCase();
  if (!code) throw new Error('Type a code first');
  if (!on()) throw new Error('Codes are not set up yet');

  const r = await fetch(`${base()}/rest/v1/offers?code=eq.${encodeURIComponent(code)}&select=*`, { headers: head() });
  const [o] = await r.json().catch(() => []);
  if (!o) throw new Error('That code is not recognised');
  if (!o.active) throw new Error('That code is no longer active');

  const now = Date.now();
  if (o.starts_at && now < +new Date(o.starts_at)) throw new Error('That code is not live yet');
  if (o.ends_at && now > +new Date(o.ends_at)) throw new Error('That code has expired');
  if (o.max_uses != null && o.uses >= o.max_uses) throw new Error('That code has been fully claimed');

  applied = { code: o.code, kind: o.kind, value: +o.value, min: +o.min_spend, label: o.label || '' };
  try { localStorage.setItem(OFFER, JSON.stringify(applied)); } catch {}
  return applied;
}

function clear() {
  applied = null;
  try { localStorage.removeItem(OFFER); } catch {}
}

/* what the current code takes off a given subtotal */
function discount(sub) {
  if (!applied) return { off: 0, why: '' };
  if (sub < applied.min) return { off: 0, why: `Spend ${money(applied.min)} to use ${applied.code}` };
  const off = applied.kind === 'amount'
    ? Math.min(applied.value, sub)
    : Math.round(sub * applied.value / 100);
  return { off, why: '' };
}
const money = n => CFG().currencySymbol + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));

/* count a use once the order is actually placed */
function claim() {
  if (!applied || !on()) return;
  fetch(`${base()}/rest/v1/rpc/claim_offer`, {
    method: 'POST', headers: head(), body: JSON.stringify({ p_code: applied.code }),
  }).catch(() => {});
}

function start() {
  ribbon();
  welcome();
  ping();
}

return { start, check, clear, discount, claim, get applied() { return applied; } };
})();
