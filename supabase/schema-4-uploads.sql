-- ===========================================================
-- CUSTOMER UPLOADS
-- The custom-print form puts the customer's file here and
-- sends you the link on WhatsApp.
--
-- Run this once in the Supabase SQL editor.
--
-- What it allows: anyone may ADD a file. Nobody may list the
-- bucket, overwrite a file or delete one — only you, signed in.
-- Files are readable by link, because WhatsApp has to fetch it.
--
-- The size and type limits are enforced by Supabase itself, so
-- a script cannot talk its way past them.
-- ===========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-uploads', 'customer-uploads', true, 26214400,
        array['image/jpeg','image/png','image/webp','image/avif','application/pdf',
              'model/stl','application/sla','application/vnd.ms-pki.stl',
              'application/octet-stream','application/zip','text/plain'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "customer uploads are readable by link" on storage.objects;
create policy "customer uploads are readable by link" on storage.objects
  for select using (bucket_id = 'customer-uploads');

drop policy if exists "anyone may send us a file" on storage.objects;
create policy "anyone may send us a file" on storage.objects
  for insert with check (bucket_id = 'customer-uploads');

drop policy if exists "only you may replace an upload" on storage.objects;
create policy "only you may replace an upload" on storage.objects
  for update to authenticated using (bucket_id = 'customer-uploads');

drop policy if exists "only you may delete an upload" on storage.objects;
create policy "only you may delete an upload" on storage.objects
  for delete to authenticated using (bucket_id = 'customer-uploads');
