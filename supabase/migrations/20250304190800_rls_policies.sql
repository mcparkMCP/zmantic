-- Row Level Security Policies

-- Enable RLS on all tables
alter table public.temples enable row level security;
alter table public.temple_admins enable row level security;
alter table public.schedules enable row level security;
alter table public.events enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.donations enable row level security;

-- Helper: check if user is admin for a temple
create or replace function public.is_temple_admin(p_temple_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.temple_admins
    where temple_id = p_temple_id
    and user_id = auth.uid()
  );
$$ language sql security definer;

-- TEMPLES: public read, admin write
create policy "temples_public_read" on public.temples
  for select using (is_published = true);

create policy "temples_admin_read" on public.temples
  for select using (public.is_temple_admin(id));

create policy "temples_admin_update" on public.temples
  for update using (public.is_temple_admin(id));

-- TEMPLE_ADMINS: admin read own, service role insert
create policy "temple_admins_own_read" on public.temple_admins
  for select using (user_id = auth.uid());

create policy "temple_admins_owner_manage" on public.temple_admins
  for all using (
    exists (
      select 1 from public.temple_admins ta
      where ta.temple_id = temple_admins.temple_id
      and ta.user_id = auth.uid()
      and ta.role = 'owner'
    )
  );

-- SCHEDULES: public read, admin write
create policy "schedules_public_read" on public.schedules
  for select using (true);

create policy "schedules_admin_insert" on public.schedules
  for insert with check (public.is_temple_admin(temple_id));

create policy "schedules_admin_update" on public.schedules
  for update using (public.is_temple_admin(temple_id));

create policy "schedules_admin_delete" on public.schedules
  for delete using (public.is_temple_admin(temple_id));

-- EVENTS: public read, admin write
create policy "events_public_read" on public.events
  for select using (true);

create policy "events_admin_insert" on public.events
  for insert with check (public.is_temple_admin(temple_id));

create policy "events_admin_update" on public.events
  for update using (public.is_temple_admin(temple_id));

create policy "events_admin_delete" on public.events
  for delete using (public.is_temple_admin(temple_id));

-- GALLERY_PHOTOS: public read, admin write
create policy "gallery_public_read" on public.gallery_photos
  for select using (true);

create policy "gallery_admin_insert" on public.gallery_photos
  for insert with check (public.is_temple_admin(temple_id));

create policy "gallery_admin_update" on public.gallery_photos
  for update using (public.is_temple_admin(temple_id));

create policy "gallery_admin_delete" on public.gallery_photos
  for delete using (public.is_temple_admin(temple_id));

-- DONATIONS: admin read, service role insert (webhook)
create policy "donations_admin_read" on public.donations
  for select using (public.is_temple_admin(temple_id));

-- Storage bucket for gallery uploads
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "gallery_public_read" on storage.objects
  for select using (bucket_id = 'gallery');

create policy "gallery_admin_upload" on storage.objects
  for insert with check (
    bucket_id = 'gallery'
    and auth.role() = 'authenticated'
  );

create policy "gallery_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'gallery'
    and auth.role() = 'authenticated'
  );
