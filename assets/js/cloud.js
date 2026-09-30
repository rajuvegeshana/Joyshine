/* ===========================================================
   CLOUD — talks to Supabase over plain REST.

   No SDK, no build step: Supabase exposes a REST API and an auth
   endpoint, and fetch is enough for both. The shop only ever
   reads; the control panel signs in and writes.

   The anon key below is PUBLIC by design — it identifies the
   project, it does not grant permission. Row Level Security in
   supabase/schema.sql is what actually stops strangers writing.
   =========================================================== */
window.CLOUD = (() => {
'use strict';

const CFG = () => window.JOYSHINE.supabase || {};
const ready = () => !!(CFG().url && CFG().anonKey);
const TOK = 'joyshine.cloud.session';

const base = () => CFG().url.replace(/\/+$/, '');
const table = () => CFG().table || 'settings';
const rowId = () => CFG().row || 'site';

let session = null;
try { session = JSON.parse(localStorage.getItem(TOK) || 'null'); } catch {}

const keep = s => {
  session = s;
  try { s ? localStorage.setItem(TOK, JSON.stringify(s)) : localStorage.removeItem(TOK); } catch {}
};

const headers = (auth = false) => {
  const h = { apikey: CFG().anonKey, 'Content-Type': 'application/json' };
  h.Authorization = `Bearer ${auth && session?.access_token ? session.access_token : CFG().anonKey}`;
  return h;
};

/* ---- auth ------------------------------------------------- */
async function signIn(email, password) {
  const r = await fetch(`${base()}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || d.msg || d.message || 'Could not sign in');
  keep(d);
  return d.user;
}

async function refresh() {
  if (!session?.refresh_token) return false;
  const r = await fetch(`${base()}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!r.ok) { keep(null); return false; }
  keep(await r.json());
  return true;
}

function signOut() {
  if (session?.access_token) {
    fetch(`${base()}/auth/v1/logout`, { method: 'POST', headers: headers(true) }).catch(() => {});
  }
  keep(null);
}

const user = () => session?.user || null;
const signedIn = () => !!session?.access_token;

/* ---- read (anyone) ---------------------------------------- */
async function read() {
  if (!ready()) return null;
  const url = `${base()}/rest/v1/${table()}?id=eq.${encodeURIComponent(rowId())}&select=data,updated_at`;
  const r = await fetch(url, { headers: headers(), cache: 'no-store' });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows?.[0] || null;
}

/* ---- write (signed in only) ------------------------------- */
async function write(data, retried = false) {
  if (!ready()) throw new Error('Supabase is not configured in config.js');
  if (!signedIn()) throw new Error('Sign in first');

  const url = `${base()}/rest/v1/${table()}?on_conflict=id`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { ...headers(true), Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([{ id: rowId(), data }]),
  });

  if (r.status === 401 && !retried) {          // token expired — try once
    if (await refresh()) return write(data, true);
    throw new Error('Your session expired. Sign in again.');
  }
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.message || d.hint || `Save failed (${r.status})`);
  }
  return (await r.json())[0];
}

return { ready, signIn, signOut, refresh, user, signedIn, read, write };
})();
