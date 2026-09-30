-- ===========================================================
-- JOYSHINE — product images and customer-submitted reviews
-- Paste into the Supabase SQL Editor and Run. Safe to re-run.
-- ===========================================================

-- ---------- a public bucket for product photos --------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/avif','image/gif'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif','image/gif'];

drop policy if exists "product images are public" on storage.objects;
create policy "product images are public" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "only you can upload images" on storage.objects;
create policy "only you can upload images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

drop policy if exists "only you can replace images" on storage.objects;
create policy "only you can replace images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');

drop policy if exists "only you can remove images" on storage.objects;
create policy "only you can remove images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

-- ---------- customers may leave a review --------------------
-- They can write one, but only unpublished: the `with check`
-- makes self-publishing impossible, so nothing reaches the shop
-- until you approve it in the panel.
drop policy if exists "customers can leave a review" on public.reviews;
create policy "customers can leave a review" on public.reviews
  for insert with check (published = false);

-- Someone else's unpublished review must stay private, so the
-- read policy already in place (published or signed in) is right.

-- A little more to show alongside a review.
alter table public.reviews add column if not exists title text;
alter table public.reviews add column if not exists verified boolean not null default false;
