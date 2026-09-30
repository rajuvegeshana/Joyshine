/* ===========================================================
   REVIEW BEFORE PUBLISHING

   The control panel opens the shop in a new tab wearing the
   unpublished changes and leaves the list of them in this
   browser's storage. This bar lets you walk the whole site,
   then confirm — or throw the lot away.

   Nothing here can publish on its own: it writes only when the
   button is pressed, and only with the owner's signed-in
   session, which lives in this browser and nowhere else.
   =========================================================== */
window.REVIEWBAR = (() => {
'use strict';

const KEY = 'joyshine.review';
const PREVIEW = 'joyshine.preview';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
function clear() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(PREVIEW); } catch {}
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

function start() {
  const r = read();
  if (!r) return;

  const bar = document.createElement('div');
  bar.className = 'revbar';
  bar.innerHTML = `
    <div class="revbar__in">
      <span class="revbar__dot"></span>
      <b>You are looking at unpublished changes.</b>
      <span class="revbar__n">${r.changes.length} ${r.changes.length === 1 ? 'change' : 'changes'}</span>
      <div class="revbar__acts">
        <button class="revbar__b" data-rb="list">See the list</button>
        <button class="revbar__b revbar__b--go" data-rb="go">Confirm and publish</button>
        <button class="revbar__b" data-rb="drop">Discard</button>
      </div>
    </div>`;
  document.body.appendChild(bar);
  document.body.classList.add('has-revbar');

  bar.addEventListener('click', e => {
    const act = e.target.closest('[data-rb]')?.dataset.rb;
    if (act === 'list') return showList(r);
    if (act === 'go') return showList(r, true);
    if (act === 'drop') {
      if (!confirm('Throw away these changes?\n\nThe live shop is untouched either way, and the panel keeps its own copy.')) return;
      clear(); location.replace(location.pathname);
    }
  });
}

function showList(r, straightToConfirm) {
  const rows = r.changes.map(c => c.occasion
    ? `<li><b>${esc(c.label)}</b><span>${esc(c.to)}</span></li>`
    : `<li><b>${esc(c.label)}</b><span><i>${esc(c.from)}</i> → <em>${esc(c.to)}</em></span></li>`).join('');

  const box = document.createElement('div');
  box.className = 'revmodal';
  box.innerHTML = `
    <div class="revmodal__card" role="dialog" aria-modal="true" aria-label="Changes about to be published">
      <h3>${straightToConfirm ? 'Publish these changes?' : 'What is waiting'}</h3>
      <p class="quiet">Everything below goes to the live shop at once. Nothing else is touched.</p>
      <ul class="revmodal__list">${rows}</ul>
      <div class="revmodal__acts">
        <button class="btn btn--ghost" data-rm="close">${straightToConfirm ? 'Not yet' : 'Close'}</button>
        <button class="btn btn--pay" data-rm="go">Publish to the live shop</button>
      </div>
      <p class="revmodal__err" hidden></p>
    </div>`;
  document.body.appendChild(box);

  const shut = () => box.remove();
  box.addEventListener('click', async e => {
    if (e.target === box || e.target.closest('[data-rm="close"]')) return shut();
    if (!e.target.closest('[data-rm="go"]')) return;

    const btn = e.target.closest('[data-rm="go"]');
    const err = box.querySelector('.revmodal__err');
    err.hidden = true;
    btn.disabled = true; btn.textContent = 'Publishing…';
    try {
      if (!window.CLOUD?.ready()) throw new Error('Supabase is not set up in this copy of the site');
      if (!window.CLOUD.signedIn()) {
        const ok = await window.CLOUD.refresh();
        if (!ok) throw new Error('Your sign-in has expired — go back to the panel and sign in again');
      }
      await window.CLOUD.write(r.data);
      clear();
      shut();
      done();
    } catch (ex) {
      err.textContent = ex.message || 'Could not publish';
      err.hidden = false;
      btn.disabled = false; btn.textContent = 'Publish to the live shop';
    }
  });
}

function done() {
  const bar = document.querySelector('.revbar');
  if (bar) {
    bar.classList.add('revbar--done');
    bar.innerHTML = `<div class="revbar__in">
      <span class="revbar__dot"></span>
      <b>Published. This is the live shop now.</b>
      <div class="revbar__acts">
        <button class="revbar__b" onclick="location.replace(location.pathname)">Reload it clean</button>
      </div>
    </div>`;
  }
}

return { start, read };
})();
