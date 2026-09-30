-- ===========================================================
-- THE WORKSHOP: filament, bills and money out
--
-- None of this is for customers. Every table here is readable
-- and writable only by you, signed in — there is no anonymous
-- policy at all, so the public key in config.js opens nothing.
--
-- Run once in the Supabase SQL editor.
-- ===========================================================

-- ---------- filament on the shelf ---------------------------
create table if not exists public.filaments (
  id          uuid primary key default gen_random_uuid(),
  brand       text,
  material    text not null default 'PLA',
  colour      text,
  hex         text,
  weight_g    int  not null default 1000,      -- what the spool held new
  price       numeric(10,2) not null default 0,-- what it cost, including tax
  bought_on   date not null default current_date,
  vendor      text,
  spool_code  text,                            -- your own label, if you use one
  opened_on   date,
  notes       text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists filaments_live_idx on public.filaments (archived, material);

-- ---------- what you have billed ----------------------------
-- One row per bill you write up, whether it came through the
-- shop or somebody walked in. items is a list of
-- { id, name, qty, price } and grams is what it actually took.
create table if not exists public.bills (
  id          uuid primary key default gen_random_uuid(),
  ref         text unique,
  billed_on   date not null default current_date,
  customer    text,
  phone       text,
  items       jsonb not null default '[]'::jsonb,
  grams       numeric(10,2) not null default 0,
  spool_id    uuid references public.filaments(id) on delete set null,
  subtotal    numeric(10,2) not null default 0,
  discount    numeric(10,2) not null default 0,
  shipping    numeric(10,2) not null default 0,
  total       numeric(10,2) not null default 0,
  paid_via    text,                             -- cash, UPI, Razorpay, WhatsApp
  status      text not null default 'paid',     -- paid, pending, cancelled
  order_id    uuid,                             -- if it came from the shop
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists bills_when_idx on public.bills (billed_on desc);

-- ---------- money out ---------------------------------------
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  spent_on    date not null default current_date,
  category    text not null default 'other',    -- filament, parts, packaging,
                                                -- postage, tools, power, rent,
                                                -- software, fees, other
  vendor      text,
  amount      numeric(10,2) not null default 0,
  note        text,
  bill_url    text,                             -- a photo of the receipt
  filament_id uuid references public.filaments(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists expenses_when_idx on public.expenses (spent_on desc);

-- ---------- how much of each spool is left ------------------
-- Counted from the bills that named it. A view, so it cannot
-- drift from the truth.
create or replace view public.filament_left as
select f.id,
       f.weight_g,
       coalesce(sum(b.grams) filter (where b.status <> 'cancelled'), 0)::numeric as used_g,
       greatest(f.weight_g - coalesce(sum(b.grams) filter (where b.status <> 'cancelled'), 0), 0)::numeric as left_g
  from public.filaments f
  left join public.bills b on b.spool_id = f.id
 group by f.id, f.weight_g;

-- ---------- locked to you -----------------------------------
alter table public.filaments enable row level security;
alter table public.bills     enable row level security;
alter table public.expenses  enable row level security;

drop policy if exists "workshop filaments" on public.filaments;
create policy "workshop filaments" on public.filaments
  for all to authenticated using (true) with check (true);

drop policy if exists "workshop bills" on public.bills;
create policy "workshop bills" on public.bills
  for all to authenticated using (true) with check (true);

drop policy if exists "workshop expenses" on public.expenses;
create policy "workshop expenses" on public.expenses
  for all to authenticated using (true) with check (true);

-- The view inherits nothing, so say it plainly: signed in only.
revoke all on public.filament_left from anon;
grant select on public.filament_left to authenticated;

-- ---------- a photo of a receipt ----------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 8388608,
        array['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Not public: a receipt carries your supplier, your prices and
-- sometimes your address. Only a signed-in session may read one.
drop policy if exists "receipts are yours" on storage.objects;
create policy "receipts are yours" on storage.objects
  for all to authenticated using (bucket_id = 'receipts') with check (bucket_id = 'receipts');
