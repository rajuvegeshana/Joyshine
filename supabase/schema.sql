-- ===========================================================
-- JOYSHINE — Supabase setup
-- Paste this whole file into the Supabase SQL Editor and Run.
-- Safe to run more than once.
-- ===========================================================

-- One row holds the whole site settings blob: the same JSON the
-- control panel already produces, so nothing else has to change.
create table if not exists public.settings (
  id          text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

insert into public.settings (id, data)
values ('site', '{"settings":{},"occasions":[]}'::jsonb)
on conflict (id) do nothing;

-- Row Level Security is the actual lock. The anon key that ships in
-- the website's JavaScript is public by design — these policies are
-- what stop a stranger writing to your shop.
alter table public.settings enable row level security;

drop policy if exists "settings are world readable" on public.settings;
create policy "settings are world readable"
  on public.settings for select
  using (true);

drop policy if exists "only signed in users can change settings" on public.settings;
create policy "only signed in users can change settings"
  on public.settings for update
  to authenticated
  using (true) with check (true);

drop policy if exists "only signed in users can add settings" on public.settings;
create policy "only signed in users can add settings"
  on public.settings for insert
  to authenticated
  with check (true);

-- Stamp every save, so you can see when the shop last changed.
create or replace function public.touch_settings()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  new.updated_by = coalesce(auth.jwt() ->> 'email', 'unknown');
  return new;
end $$;

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch
  before insert or update on public.settings
  for each row execute function public.touch_settings();
