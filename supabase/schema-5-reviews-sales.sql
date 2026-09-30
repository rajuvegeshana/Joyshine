-- ===========================================================
-- REVIEWS YOU CHOOSE, AND AN HONEST "HOW MANY SOLD"
-- Run this once in the Supabase SQL editor, after schema 2 and 3.
-- ===========================================================

-- ---------- a review can be pinned to the homepage ----------
alter table public.reviews add column if not exists pinned boolean not null default false;
create index if not exists reviews_pinned_idx on public.reviews (pinned) where pinned;
create index if not exists reviews_product_idx on public.reviews (product_id);

-- ---------- how many of each product have been sold ---------
-- A view, not a table, so the number is always the truth and
-- can never drift. It exposes ONLY a product id and a count:
-- names, addresses and phone numbers stay behind the orders
-- policy, which still refuses anonymous readers.
--
-- Cancelled orders do not count.
create or replace view public.product_sales as
select
  item->>'id'                                as product_id,
  sum(greatest((item->>'qty')::int, 0))::int as sold,
  count(distinct o.id)::int                  as orders
from public.orders o
cross join lateral jsonb_array_elements(o.items) as item
where coalesce(o.status, '') not in ('cancelled', 'refunded')
group by 1;

grant select on public.product_sales to anon, authenticated;

-- A view in Postgres runs with its owner's rights unless it is
-- told otherwise, which is what lets this aggregate be public
-- while the orders underneath it are not. Make that explicit so
-- a future Supabase default cannot quietly change it.
alter view public.product_sales set (security_invoker = false);
