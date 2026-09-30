/* ===========================================================
   CUSTOMISATION
   Per-product options the customer fills in: text, a dropdown,
   a colour, or a file they upload — a logo, a photo, artwork.

   The shape a product carries:

     custom: [
       { type:'text',     label:'Name to print', max:24, required:true,
         placeholder:'e.g. Aarohi' },
       { type:'textarea', label:'Message on the card', max:120 },
       { type:'select',   label:'Lettering', options:['Serif','Rounded','Block'] },
       { type:'colour',   label:'Text colour' },
       { type:'image',    label:'Your logo',
         hint:'PNG or SVG. A plain background prints best.' },
     ]

   Older products carrying the single `personalise` field still
   work: it is read as one required text option.
   =========================================================== */
window.CUSTOM = (() => {
'use strict';

const CFG = () => window.JOYSHINE;
const SB = () => CFG().supabase || {};
const can = () => !!(SB().url && SB().anonKey);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

const TYPES = {
  text:     'Short text',
  textarea: 'Long text',
  select:   'Pick one',
  colour:   'A colour',
  image:    'Upload a file',
};

/* the options a product offers, whichever way it stores them */
function fields(p) {
  if (Array.isArray(p.custom) && p.custom.length) return p.custom;
  if (p.personalise) {
    return [{ type: 'text', label: p.personalise.label, max: p.personalise.max,
              placeholder: p.personalise.placeholder, required: true }];
  }
  return [];
}
const has = p => fields(p).length > 0;

/* ---------- drawing the inputs ---------------------------- */
function render(p) {
  const list = fields(p);
  if (!list.length) return '';
  return `<div class="cust">
    <p class="cust__h">Make it yours</p>
    ${list.map((f, i) => one(f, i)).join('')}
  </div>`;
}

function one(f, i) {
  const id = 'cu_' + i;
  const req = f.required ? ' <i>*</i>' : '';
  const hint = f.hint ? `<small class="quiet">${esc(f.hint)}</small>` : '';

  if (f.type === 'select') {
    return `<label class="field cust__f" data-ci="${i}"><span>${esc(f.label)}${req}</span>
      <select id="${id}" data-cu="${i}">
        <option value="">Choose…</option>
        ${(f.options || []).map(o => `<option>${esc(o)}</option>`).join('')}
      </select>${hint}<u></u></label>`;
  }
  if (f.type === 'colour') {
    return `<label class="field cust__f" data-ci="${i}"><span>${esc(f.label)}${req}</span>
      <span class="cust__col">
        <input type="color" id="${id}" data-cu="${i}" value="${esc(f.value || '#ff9fc4')}">
        <input type="text" id="${id}_t" data-cuhex="${i}" value="${esc(f.value || '#ff9fc4')}"
               maxlength="7" spellcheck="false">
      </span>${hint}<u></u></label>`;
  }
  if (f.type === 'image') {
    return `<div class="field cust__f" data-ci="${i}"><span>${esc(f.label)}${req}</span>
      <div class="cust__up" data-updrop="${i}">
        <input type="file" id="${id}" data-cu="${i}" accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf" hidden>
        <button type="button" class="btn btn--ghost btn--sm" data-upbtn="${i}">Choose a file</button>
        <span class="cust__upname" data-upname="${i}">or drag one here</span>
      </div>
      <div class="cust__prev" data-upprev="${i}" hidden></div>
      ${hint}<u></u></div>`;
  }
  if (f.type === 'textarea') {
    return `<label class="field cust__f" data-ci="${i}"><span>${esc(f.label)}${req}</span>
      <textarea id="${id}" data-cu="${i}" rows="2" ${f.max ? `maxlength="${f.max}"` : ''}
        placeholder="${esc(f.placeholder)}"></textarea>
      ${f.max ? `<small class="quiet"><b data-culeft="${i}">${f.max}</b> characters left</small>` : ''}
      ${hint}<u></u></label>`;
  }
  return `<label class="field cust__f" data-ci="${i}"><span>${esc(f.label)}${req}</span>
    <input type="text" id="${id}" data-cu="${i}" ${f.max ? `maxlength="${f.max}"` : ''}
      placeholder="${esc(f.placeholder)}">
    ${f.max ? `<small class="quiet"><b data-culeft="${i}">${f.max}</b> characters left</small>` : ''}
    ${hint}<u></u></label>`;
}

/* ---------- reading them back ----------------------------- */
const uploaded = {};          // index -> { url, name }

function read(p) {
  const out = {};
  fields(p).forEach((f, i) => {
    if (f.type === 'image') {
      if (uploaded[i]) out[f.label] = uploaded[i].url;
      return;
    }
    const el = document.getElementById('cu_' + i);
    const v = (el?.value || '').trim();
    if (v) out[f.label] = v;
  });
  return out;
}

/* everything required present? marks the gaps if not */
function check(p) {
  let ok = true, first = null;
  fields(p).forEach((f, i) => {
    if (!f.required) return;
    const filled = f.type === 'image' ? !!uploaded[i]
      : !!(document.getElementById('cu_' + i)?.value || '').trim();
    const box = document.querySelector(`[data-ci="${i}"]`);
    const u = box?.querySelector('u');
    if (!filled) {
      ok = false; first = first || box;
      if (u) u.textContent = 'We need this to make it.';
      box?.classList.add('cust__f--bad');
    } else {
      if (u) u.textContent = '';
      box?.classList.remove('cust__f--bad');
    }
  });
  first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  return ok;
}

/* a one-line summary for the cart and the WhatsApp message */
const summarise = opts => Object.entries(opts || {})
  .map(([k, v]) => `${k}: ${/^https?:/.test(v) ? 'file attached' : v}`).join(' · ');

function reset() { Object.keys(uploaded).forEach(k => delete uploaded[k]); }

/* ---------- uploading a file ------------------------------ */
async function upload(file, i) {
  if (!can()) throw new Error('Uploads are not set up yet');
  if (file.size > 5 * 1024 * 1024) throw new Error('That file is over 5 MB');

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const base = SB().url.replace(/\/+$/, '');

  const r = await fetch(`${base}/storage/v1/object/customer-uploads/${name}`, {
    method: 'POST',
    headers: { apikey: SB().anonKey, Authorization: `Bearer ${SB().anonKey}`,
               'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!r.ok) throw new Error('That upload did not go through. Try a smaller file.');

  const url = `${base}/storage/v1/object/public/customer-uploads/${name}`;
  uploaded[i] = { url, name: file.name };
  return { url, name: file.name };
}

/* ---------- events, delegated once ------------------------ */
function wire(root = document) {
  if (root.__custWired) return;
  root.__custWired = true;

  root.addEventListener('click', e => {
    const b = e.target.closest('[data-upbtn]');
    if (b) { document.getElementById('cu_' + b.dataset.upbtn)?.click(); return; }
    const x = e.target.closest('[data-upclear]');
    if (x) {
      const i = x.dataset.upclear;
      delete uploaded[i];
      const prev = document.querySelector(`[data-upprev="${i}"]`);
      if (prev) { prev.hidden = true; prev.innerHTML = ''; }
      const nm = document.querySelector(`[data-upname="${i}"]`);
      if (nm) nm.textContent = 'or drag one here';
    }
  });

  root.addEventListener('input', e => {
    const t = e.target;
    const i = t.dataset.cu;
    if (i != null && t.type !== 'file') {
      const left = document.querySelector(`[data-culeft="${i}"]`);
      if (left && t.maxLength > 0) left.textContent = t.maxLength - t.value.length;
      const box = t.closest('[data-ci]');
      box?.classList.remove('cust__f--bad');
      const u = box?.querySelector('u'); if (u) u.textContent = '';
    }
    const hx = t.dataset.cuhex;
    if (hx != null && /^#[0-9a-f]{6}$/i.test(t.value)) {
      const c = document.getElementById('cu_' + hx); if (c) c.value = t.value;
    }
    if (i != null && t.type === 'color') {
      const tx = document.querySelector(`[data-cuhex="${i}"]`); if (tx) tx.value = t.value;
    }
  });

  root.addEventListener('change', e => {
    const t = e.target;
    if (t.type === 'file' && t.dataset.cu != null) take(t.files[0], t.dataset.cu);
  });

  /* drag and drop onto the box */
  root.addEventListener('dragover', e => {
    const d = e.target.closest('[data-updrop]');
    if (d) { e.preventDefault(); d.classList.add('cust__up--over'); }
  });
  root.addEventListener('dragleave', e => {
    e.target.closest('[data-updrop]')?.classList.remove('cust__up--over');
  });
  root.addEventListener('drop', e => {
    const d = e.target.closest('[data-updrop]');
    if (!d) return;
    e.preventDefault(); d.classList.remove('cust__up--over');
    take(e.dataTransfer.files[0], d.dataset.updrop);
  });
}

async function take(file, i) {
  if (!file) return;
  const nm = document.querySelector(`[data-upname="${i}"]`);
  const prev = document.querySelector(`[data-upprev="${i}"]`);
  if (nm) nm.textContent = 'Uploading…';
  try {
    const { url, name } = await upload(file, i);
    if (nm) nm.textContent = name;
    if (prev) {
      prev.hidden = false;
      prev.innerHTML = /\.(png|jpe?g|webp|svg)$/i.test(name)
        ? `<img src="${esc(url)}" alt=""><button type="button" class="linky" data-upclear="${i}">Remove</button>`
        : `<span>${esc(name)}</span><button type="button" class="linky" data-upclear="${i}">Remove</button>`;
    }
    const box = document.querySelector(`[data-ci="${i}"]`);
    box?.classList.remove('cust__f--bad');
    const u = box?.querySelector('u'); if (u) u.textContent = '';
  } catch (err) {
    if (nm) nm.textContent = err.message;
  }
}

return { TYPES, fields, has, render, read, check, summarise, reset, wire, upload };
})();
