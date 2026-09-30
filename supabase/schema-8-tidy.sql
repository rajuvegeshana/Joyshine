-- ===========================================================
-- LET THE OWNER TIDY UP
--
-- Orders and requests can be placed by anyone and read only by
-- you. Until now nobody could delete one at all, which means a
-- test order, or a spam enquiry, sits in your figures for ever.
--
-- This adds a delete for a signed-in session and nothing else.
-- Anonymous visitors still cannot read, change or remove a
-- single row — only add one.
-- ===========================================================

drop policy if exists "only you can remove an order" on public.orders;
create policy "only you can remove an order" on public.orders
  for delete to authenticated using (true);

drop policy if exists "only you can remove a request" on public.requests;
create policy "only you can remove a request" on public.requests
  for delete to authenticated using (true);
