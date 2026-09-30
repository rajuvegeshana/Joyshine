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
--
-- IMPORTANT: if the bucket already exists with a narrower list of
-- types, this file widens it. A bucket made by hand in the dashboard
-- accepts images only, which means an .stl — the whole point of the
-- custom-print form — is refused.
-- ===========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-uploads', 'customer-uploads', true, 26214400,
        array[
          -- pictures and drawings
          'image/jpeg','image/png','image/webp','image/avif','image/heic','image/svg+xml',
          'application/pdf',
          -- 3D models. Browsers rarely agree on what an .stl or .3mf is,
          -- so every name they use is listed, including the catch-all
          -- octet-stream that most of them fall back to.
          'model/stl','model/x.stl-binary','model/x.stl-ascii','application/sla',
          'application/vnd.ms-pki.stl','model/3mf','application/vnd.ms-3mfdocument',
          'model/obj','text/plain','model/step','application/step','application/STEP',
          'application/octet-stream',
          -- a folder of parts, zipped
          'application/zip','application/x-zip-compressed'])
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
