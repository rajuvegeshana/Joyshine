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

/* ---- forgot password ------------------------------------- */
async function sendRecovery(email, redirectTo) {
  const r = await fetch(`${base()}/auth/v1/recover`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify(redirectTo ? { email, redirect_to: redirectTo } : { email }),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.msg || d.error_description || d.message || 'Could not send the email');
  }
  return true;
}

/* Supabase sends you back with the token in the URL fragment.
   Catch it, hold it as a session, and tidy the address bar. */
function recoveryInUrl() {
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  const err = h.get('error_description');
  if (err) { history.replaceState(null, '', location.pathname); return { error: err }; }
  if (h.get('type') === 'recovery' && h.get('access_token')) {
    keep({ access_token: h.get('access_token'), refresh_token: h.get('refresh_token'), user: null });
    history.replaceState(null, '', location.pathname);
    return { ok: true };
  }
  return null;
}

async function setPassword(password) {
  if (!signedIn()) throw new Error('That reset link has expired. Send yourself a new one.');
  const r = await fetch(`${base()}/auth/v1/user`, {
    method: 'PUT', headers: headers(true), body: JSON.stringify({ password }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.msg || d.message || 'Could not change the password');
  if (session) { session.user = d; keep(session); }
  return d;
}

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

/* ---- put an image in the catalogue bucket ----------------- */
async function uploadImage(file) {
  if (!ready()) throw new Error('Supabase is not configured');
  if (!signedIn()) throw new Error('Sign in first');
  if (file.size > 5 * 1024 * 1024) throw new Error('That image is over 5 MB');

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const r = await fetch(`${base()}/storage/v1/object/product-images/${name}`, {
    method: 'POST',
    headers: { apikey: CFG().anonKey, Authorization: `Bearer ${session.access_token}`,
               'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!r.ok) throw new Error('That upload did not go through');
  return `${base()}/storage/v1/object/public/product-images/${name}`;
}

/* ---- generic table access, signed in --------------------- */
async function req(method, path, body, retried = false) {
  if (!ready()) throw new Error('Supabase is not configured');
  const opts = { method, headers: { ...headers(true) } };
  if (method === 'POST' || method === 'PATCH') {
    opts.headers.Prefer = method === 'POST'
      ? 'resolution=merge-duplicates,return=representation' : 'return=representation';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(`${base()}/rest/v1/${path}`, opts);
  if (r.status === 401 && !retried) {
    if (await refresh()) return req(method, path, body, true);
    throw new Error('Your session expired. Sign in again.');
  }
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.message || d.hint || `Request failed (${r.status})`);
  }
  if (r.status === 204) return null;
  return r.json().catch(() => null);
}

const rows    = path            => req('GET', path);
const upsert  = (table, body)   => req('POST', `${table}?on_conflict=id`, Array.isArray(body) ? body : [body]);
const update  = (table, q, b)   => req('PATCH', `${table}?${q}`, b);
const remove  = (table, q)      => req('DELETE', `${table}?${q}`);

/* ---- setup check ------------------------------------------
   Proves the wiring is right instead of leaving you to hope.
   The important one is "a stranger cannot write": if that ever
   passes, anyone on the internet can rewrite your shop.        */
function keyRole(key) {
  /* Supabase's current keys are prefixed strings; older projects still
     hand out JWTs. Both shapes have a browser-safe and a secret form. */
  if (/^sb_publishable_/.test(key)) return 'anon';
  if (/^sb_secret_/.test(key))      return 'service_role';
  try {
    const p = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return p.role || null;
  } catch { return null; }
}

async function diagnose() {
  const out = [];
  const add = (label, ok, detail, danger) => out.push({ label, ok, detail, danger });
  const c = CFG();

  if (!c.url || !c.anonKey) {
    add('Details filled in', false, 'Add url and anonKey to the supabase block in config.js');
    return out;
  }
  add('Details filled in', true, c.url);

  const role = keyRole(c.anonKey);
  if (role === 'service_role') {
    add('Correct key used', false,
        'That is a secret key. It ignores every security rule and must never sit in a website. Replace it with the publishable (anon) key and rotate the secret one in Supabase now.', true);
    return out;
  }
  add('Correct key used', role === 'anon', role === 'anon'
    ? (/^sb_publishable_/.test(c.anonKey) ? 'publishable key' : 'anon public key')
    : 'Could not read the key. Copy the publishable key from Project Settings - API Keys.');

  try {
    const r = await fetch(`${base()}/rest/v1/`, { headers: headers() });
    add('Project reachable', r.status < 500,
        r.status < 500 ? 'Answering normally' : `The project returned HTTP ${r.status}`);
  } catch (e) {
    add('Project reachable', false, 'No response. Check the URL.');
    return out;
  }

  let row = null;
  try {
    row = await read();
    add('Settings readable by the shop', !!row,
        row ? 'The row exists' : 'No row yet. Run supabase/schema.sql in the SQL editor.');
  } catch {
    add('Settings readable by the shop', false, 'Blocked. Run supabase/schema.sql.');
  }

  /* the security check: an unauthenticated write must be refused */
  try {
    const r = await fetch(`${base()}/rest/v1/${table()}?on_conflict=id`, {
      method: 'POST',
      headers: { apikey: c.anonKey, Authorization: `Bearer ${c.anonKey}`,
                 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify([{ id: '__probe__', data: {} }]),
    });
    const blocked = r.status === 401 || r.status === 403;
    add('A stranger cannot change your shop', blocked,
        blocked ? `Refused with HTTP ${r.status}, as it should be`
                : `NOT PROTECTED - the write was accepted (HTTP ${r.status}). Run supabase/schema.sql and check Row Level Security is on.`,
        !blocked);
  } catch {
    add('A stranger cannot change your shop', true, 'Refused');
  }

  if (signedIn()) {
    try {
      await write(row?.data || { settings: {}, occasions: [] });
      add('You can publish', true, `Signed in as ${user()?.email || 'you'}`);
    } catch (e) {
      add('You can publish', false, e.message);
    }
  } else {
    add('You can publish', null, 'Sign in to check this');
  }

  return out;
}

return { ready, signIn, signOut, refresh, user, signedIn, read, write, diagnose,
         sendRecovery, recoveryInUrl, setPassword,
         rows, upsert, update, remove, uploadImage };
})();
