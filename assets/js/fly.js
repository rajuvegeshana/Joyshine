/* ===========================================================
   FLY TO BASKET
   A clone of the product arcs into the cart button, shrinking
   as it goes and clipping away right at the end. The cart takes
   the hit with a real spring, a ring ripples out of it, and the
   product it left behind springs back into place.

   Ported from the Motion (React) version. Same choreography,
   built on the Web Animations API because this site has no
   build step.

   Tune it in FLY.config.
   =========================================================== */
window.FLY = (() => {
'use strict';

const config = {
  strength: 0.5,               // how far the arc bulges off the straight line
  peak: 0.15,                  // where along the flight the bulge sits
  rotate: 0.9,                 // rotates the bulge direction, in radians
  direction: 'cw',             // 'cw' | 'ccw'
  duration: 450,               // ms
  ease: 'cubic-bezier(.74,.18,.93,.69)',
  basketVelocityFactor: 0.05,  // how hard the cart gets knocked
  stiffness: 500,
  damping: 12,
  maxKnock: 14,                // px, so the cart never flies off
  steps: 48,
};

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- a quadratic arc from (0,0) to (dx,dy) --------- */
function arc(dx, dy) {
  const d = Math.hypot(dx, dy) || 1;
  let nx = -dy / d, ny = dx / d;                    // anticlockwise normal
  if (config.direction === 'cw') { nx = dy / d; ny = -dx / d; }
  const c = Math.cos(config.rotate), s = Math.sin(config.rotate);
  const rx = nx * c - ny * s, ry = nx * s + ny * c;
  const off = Math.min(config.strength * d * 0.5, 260);
  const cx = dx * config.peak + rx * off;
  const cy = dy * config.peak + ry * off;
  const at = u => { const m = 1 - u; return [2 * m * u * cx + u * u * dx, 2 * m * u * cy + u * u * dy]; };
  at.tangent = () => {                              // direction of travel at landing
    const tx = 2 * (dx - cx), ty = 2 * (dy - cy);
    const m = Math.hypot(tx, ty) || 1;
    return [tx / m, ty / m];
  };
  return at;
}

/* ---------- a damped spring, as keyframes ----------------- */
function springKeys(vx, vy, ms = 700, n = 44) {
  const wn = Math.sqrt(config.stiffness);
  const z = config.damping / (2 * Math.sqrt(config.stiffness));
  const wd = wn * Math.sqrt(Math.max(0.0001, 1 - z * z));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * (ms / 1000);
    const e = Math.exp(-z * wn * t) * Math.sin(wd * t) / wd;
    out.push({ transform: `translate(${(vx * e).toFixed(2)}px, ${(vy * e).toFixed(2)}px)` });
  }
  out[out.length - 1] = { transform: 'translate(0px, 0px)' };
  return out;
}

/* ---------- a bounce, as keyframes ------------------------ */
function bounceKeys(from, to, bounce = 0.35, n = 30) {
  const z = 1 - bounce;
  const wn = 18, wd = wn * Math.sqrt(Math.max(0.0001, 1 - z * z));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 0.55;
    const decay = Math.exp(-z * wn * t);
    const v = to - (to - from) * decay * (Math.cos(wd * t) + (z * wn / wd) * Math.sin(wd * t));
    out.push({ transform: `scale(${v.toFixed(3)})` });
  }
  out[out.length - 1] = { transform: `scale(${to})` };
  return out;
}

/* ---------- the ripple ------------------------------------ */
function ripple(target) {
  const r = target.getBoundingClientRect();
  const cs = getComputedStyle(target);
  const ring = document.createElement('div');
  ring.className = 'fly-ring';
  ring.style.cssText =
    `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;` +
    `border-radius:${cs.borderRadius}`;
  document.body.appendChild(ring);
  const a = ring.animate(
    [{ transform: 'scale(1)', opacity: .8 }, { transform: 'scale(2.2)', opacity: 0 }],
    { duration: 500, easing: 'ease-out' }
  );
  const drop = () => ring.remove();
  const t = setTimeout(drop, 900);          // in case the clock stalls
  a.onfinish = () => { clearTimeout(t); drop(); };
  a.oncancel = () => { clearTimeout(t); drop(); };
}

/* ---------- the flight ------------------------------------ */
const busy = new WeakSet();

function toCart(source, onLand) {
  const target = document.getElementById('openCart');
  if (!source || !target) { onLand?.(); return; }

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  /* nothing to watch in a background tab, and its animation clock may be
     parked — land it straight away instead */
  if (!from.width || !to.width || still() || document.visibilityState !== 'visible') {
    onLand?.(); return;
  }
  if (busy.has(source)) { onLand?.(); return; }
  busy.add(source);

  const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
  const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
  const scale = Math.max(0.12, Math.min(0.5,
    Math.min(to.width, to.height) / Math.max(from.width, from.height)));

  /* the clone: looks like the tile it left */
  const cs = getComputedStyle(source);
  const clone = document.createElement('div');
  clone.className = 'fly-clone';
  clone.setAttribute('aria-hidden', 'true');
  clone.style.cssText =
    `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;` +
    `border-radius:${cs.borderRadius};background:${cs.backgroundColor};`;
  const inner = source.querySelector('svg, img');
  if (inner) clone.appendChild(inner.cloneNode(true));
  document.body.appendChild(clone);

  /* the product left behind dips, then springs back */
  const art = inner;
  if (art) art.animate(bounceKeys(0.86, 1, 0.35),
    { duration: 550, delay: 60, easing: 'linear', fill: 'both' });

  /* build the arc */
  const path = arc(dx, dy);
  const keys = [];
  for (let i = 0; i <= config.steps; i++) {
    const u = i / config.steps;
    const [x, y] = path(u);
    const s = 1 + (scale - 1) * u;
    const o = u < 0.9 ? 1 : Math.max(0, 1 - (u - 0.9) / 0.1);
    keys.push({ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`, opacity: o });
  }

  const flight = clone.animate(keys, { duration: config.duration, easing: config.ease, fill: 'forwards' });

  /* If the animation clock stops — a tab switch mid-flight — finish by hand
     so the clone never strands on screen and the item always lands. */
  let landed = false;
  const land = () => {
    if (landed) return;
    landed = true;
    clearTimeout(guard);
    clone.remove();

    /* knock the cart along the direction the product was travelling */
    const [tx, ty] = path.tangent();
    const d = Math.hypot(dx, dy);
    const speed = (d / (config.duration / 1000)) * 2.4 * config.basketVelocityFactor;
    const wn = Math.sqrt(config.stiffness);
    const z = config.damping / (2 * wn);
    const wd = wn * Math.sqrt(Math.max(0.0001, 1 - z * z));
    const cap = Math.min(speed, config.maxKnock * wd);
    const knock = target.animate(springKeys(tx * cap, ty * cap), { duration: 700, easing: 'linear' });
    /* if the clock stalls mid-spring the cart would sit nudged off-centre */
    setTimeout(() => { try { knock.cancel(); } catch {} }, 1100);

    ripple(target);
    busy.delete(source);
    onLand?.();
  };

  const guard = setTimeout(land, config.duration + 500);
  flight.onfinish = land;
  flight.oncancel = () => {
    if (landed) return;
    landed = true; clearTimeout(guard);
    clone.remove(); busy.delete(source); onLand?.();
  };
}

return { toCart, config };
})();
