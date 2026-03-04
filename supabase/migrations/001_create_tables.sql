-- TempleTools Database Schema
-- Run this in Supabase SQL Editor

-- 1. Temples
create table if not exists public.temples (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  deity_names text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  phone text,
  email text,
  website text,
  lat double precision,
  lng double precision,
  cover_image text,
  description text,
  is_published boolean default true,
  is_claimed boolean default false,
  stripe_metadata_tag text,
  source_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_temples_slug on public.temples(slug);
create index if not exists idx_temples_country on public.temples(country);
create index if not exists idx_temples_city on public.temples(city);
create index if not exists idx_temples_is_published on public.temples(is_published);

-- 2. Temple Admins
create table if not exists public.temple_admins (
  id uuid primary key default gen_random_uuid(),
  temple_id uuid not null references public.temples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'editor')),
  created_at timestamptz default now(),
  unique(temple_id, user_id)
);

create index if not exists idx_temple_admins_user on public.temple_admins(user_id);
create index if not exists idx_temple_admins_temple on public.temple_admins(temple_id);

-- 3. Schedules
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  temple_id uuid not null references public.temples(id) on delete cascade,
  title text not null,
  start_time time not null,
  end_time time,
  day_of_week smallint check (day_of_week >= 0 and day_of_week <= 6),
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_schedules_temple on public.schedules(temple_id);

-- 4. Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  temple_id uuid not null references public.temples(id) on delete cascade,
  title text not null,
  description text,
  start_date date not null,
  end_date date,
  start_time time,
  image_url text,
  created_at timestamptz default now()
);

create index if not exists idx_events_temple on public.events(temple_id);
create index if not exists idx_events_start_date on public.events(start_date);

-- 5. Gallery Photos
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  temple_id uuid not null references public.temples(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_gallery_photos_temple on public.gallery_photos(temple_id);

-- 6. Donations
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  temple_id uuid not null references public.temples(id) on delete cascade,
  stripe_session_id text unique not null,
  amount_cents integer not null,
  currency text default 'usd',
  donor_email text,
  donor_name text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz default now()
);

create index if not exists idx_donations_temple on public.donations(temple_id);
create index if not exists idx_donations_stripe_session on public.donations(stripe_session_id);

-- Updated at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_temples_updated
  before update on public.temples
  for each row execute function public.handle_updated_at();
