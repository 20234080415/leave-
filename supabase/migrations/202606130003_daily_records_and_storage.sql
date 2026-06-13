-- 留白 Leave: daily records and private record image storage
-- Run after 202606130002_invite_codes_and_space_rpcs.sql.

begin;

do $$
begin
  create type public.record_visibility as enum ('shared', 'private');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.daily_records (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null
    constraint daily_records_content_length
    check (char_length(trim(content)) between 1 and 5000),
  mood text
    constraint daily_records_mood_length
    check (mood is null or char_length(mood) between 1 and 20),
  weather text
    constraint daily_records_weather_length
    check (weather is null or char_length(weather) between 1 and 20),
  image_url text,
  visibility public.record_visibility not null default 'shared',
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.daily_records is
  'Daily journal entries scoped to a two-person space.';

comment on column public.daily_records.image_url is
  'Object path in the private record-images Storage bucket.';

create index if not exists daily_records_space_created_at_idx
  on public.daily_records (space_id, created_at desc);

create index if not exists daily_records_author_id_idx
  on public.daily_records (author_id);

create unique index if not exists daily_records_image_url_key
  on public.daily_records (image_url)
  where image_url is not null;

alter table public.daily_records enable row level security;

drop policy if exists "daily_records_select_visible_in_space"
  on public.daily_records;
create policy "daily_records_select_visible_in_space"
on public.daily_records
for select
to authenticated
using (
  public.is_space_member(space_id)
  and (
    visibility = 'shared'
    or author_id = auth.uid()
  )
);

drop policy if exists "daily_records_insert_self_in_space"
  on public.daily_records;
create policy "daily_records_insert_self_in_space"
on public.daily_records
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.is_space_member(space_id)
  and (
    image_url is null
    or (
      (storage.foldername(image_url))[1] = space_id::text
      and (storage.foldername(image_url))[2] = author_id::text
    )
  )
);

drop policy if exists "daily_records_update_own"
  on public.daily_records;
create policy "daily_records_update_own"
on public.daily_records
for update
to authenticated
using (
  author_id = auth.uid()
  and public.is_space_member(space_id)
)
with check (
  author_id = auth.uid()
  and public.is_space_member(space_id)
  and (
    image_url is null
    or (
      (storage.foldername(image_url))[1] = space_id::text
      and (storage.foldername(image_url))[2] = author_id::text
    )
  )
);

drop policy if exists "daily_records_delete_own"
  on public.daily_records;
create policy "daily_records_delete_own"
on public.daily_records
for delete
to authenticated
using (
  author_id = auth.uid()
  and public.is_space_member(space_id)
);

revoke all on table public.daily_records from anon;
grant select, insert, update, delete on table public.daily_records
  to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'record-images',
  'record-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_read_record_image(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when auth.uid() is null then false
      when (storage.foldername(object_name))[2] = auth.uid()::text then
        public.is_space_member(
          ((storage.foldername(object_name))[1])::uuid
        )
      else exists (
        select 1
        from public.daily_records
        where daily_records.image_url = object_name
          and daily_records.visibility = 'shared'
          and public.is_space_member(daily_records.space_id)
      )
    end;
$$;

revoke all on function public.can_read_record_image(text) from public;
grant execute on function public.can_read_record_image(text) to authenticated;

drop policy if exists "record_images_select_visible"
  on storage.objects;
create policy "record_images_select_visible"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'record-images'
  and public.can_read_record_image(name)
);

drop policy if exists "record_images_insert_own_space_folder"
  on storage.objects;
create policy "record_images_insert_own_space_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'record-images'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.is_space_member(
    ((storage.foldername(name))[1])::uuid
  )
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
);

drop policy if exists "record_images_delete_own"
  on storage.objects;
create policy "record_images_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'record-images'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.is_space_member(
    ((storage.foldername(name))[1])::uuid
  )
);

commit;
