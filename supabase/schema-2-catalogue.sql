-- ===========================================================
-- JOYSHINE — catalogue, orders, requests, reviews, posts
-- Paste into the Supabase SQL Editor and Run. Safe to re-run.
-- ===========================================================

-- ---------- categories -------------------------------------
create table if not exists public.categories (
  id    text primary key,
  name  text not null,
  note  text,
  sort  int  not null default 0
);

-- ---------- products ---------------------------------------
-- data holds the whole product object, the same shape the site
-- already uses, so the file and the database stay interchangeable.
create table if not exists public.products (
  id         text primary key,
  data       jsonb not null,
  sort       int  not null default 0,
  hidden     boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------- orders -----------------------------------------
-- Written by the browser when a payment succeeds or a WhatsApp
-- order is sent. Treat these as a RECORD OF INTENT, not proof of
-- payment: without a server nothing can verify them.
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  ref        text unique,
  channel    text not null default 'whatsapp',
  payment_id text,
  status     text not null default 'new',
  items      jsonb not null default '[]'::jsonb,
  totals     jsonb not null default '{}'::jsonb,
  customer   jsonb not null default '{}'::jsonb,
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- ---------- custom print requests ---------------------------
create table if not exists public.requests (
  id         uuid primary key default gen_random_uuid(),
  ref        text unique,
  kind       text not null default 'idea',
  detail     jsonb not null default '{}'::jsonb,
  customer   jsonb not null default '{}'::jsonb,
  status     text not null default 'new',
  created_at timestamptz not null default now()
);
create index if not exists requests_created_idx on public.requests (created_at desc);

-- ---------- reviews -----------------------------------------
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id text,
  name       text not null,
  rating     int  not null check (rating between 1 and 5),
  body       text not null,
  published  boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- blog posts ---------------------------------------
create table if not exists public.posts (
  id         text primary key,
  title      text not null,
  slug       text unique not null,
  excerpt    text,
  body       text,
  cover      text,
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===========================================================
-- ROW LEVEL SECURITY
-- The shop reads with a public key, so every table needs a
-- policy. The important asymmetry is on orders and requests:
-- a customer must be able to WRITE one, but nobody may READ
-- them back — they hold names, phone numbers and addresses.
-- ===========================================================
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;
alter table public.requests   enable row level security;
alter table public.reviews    enable row level security;
alter table public.posts      enable row level security;

-- catalogue: world readable, you write
do $$
declare t text;
begin
  foreach t in array array['categories','products'] loop
    execute format('drop policy if exists "read %1$s" on public.%1$I', t);
    execute format('create policy "read %1$s" on public.%1$I for select using (true)', t);
    execute format('drop policy if exists "write %1$s" on public.%1$I', t);
    execute format('create policy "write %1$s" on public.%1$I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- published content only, for everyone else
drop policy if exists "read published reviews" on public.reviews;
create policy "read published reviews" on public.reviews
  for select using (published or auth.role() = 'authenticated');
drop policy if exists "write reviews" on public.reviews;
create policy "write reviews" on public.reviews
  for all to authenticated using (true) with check (true);

drop policy if exists "read published posts" on public.posts;
create policy "read published posts" on public.posts
  for select using (published or auth.role() = 'authenticated');
drop policy if exists "write posts" on public.posts;
create policy "write posts" on public.posts
  for all to authenticated using (true) with check (true);

-- orders and requests: anyone may add one, only you may look
drop policy if exists "anyone can place an order" on public.orders;
create policy "anyone can place an order" on public.orders
  for insert with check (true);
drop policy if exists "only you can read orders" on public.orders;
create policy "only you can read orders" on public.orders
  for select to authenticated using (true);
drop policy if exists "only you can change orders" on public.orders;
create policy "only you can change orders" on public.orders
  for update to authenticated using (true) with check (true);

drop policy if exists "anyone can send a request" on public.requests;
create policy "anyone can send a request" on public.requests
  for insert with check (true);
drop policy if exists "only you can read requests" on public.requests;
create policy "only you can read requests" on public.requests
  for select to authenticated using (true);
drop policy if exists "only you can change requests" on public.requests;
create policy "only you can change requests" on public.requests
  for update to authenticated using (true) with check (true);

-- ---------- keep updated_at honest ---------------------------
create or replace function public.touch_row()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_row();
drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_row();
