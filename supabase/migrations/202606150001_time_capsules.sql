-- 留白 Leave V1.1: time capsules and private capsule image storage
-- Run after the existing space and storage migrations.

begin;

create or replace function public.time_capsule_storage_space_id(
  object_name text
)
returns uuid
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  folder_value text;
begin
  folder_value := (storage.foldername(object_name))[1];

  if folder_value is null
    or folder_value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return null;
  end if;

  return folder_value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.time_capsule_storage_owner_id(
  object_name text
)
returns uuid
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  folder_value text;
begin
  folder_value := (storage.foldername(object_name))[2];

  if folder_value is null
    or folder_value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return null;
  end if;

  return folder_value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

revoke all on function public.time_capsule_storage_space_id(text)
  from public;
revoke all on function public.time_capsule_storage_owner_id(text)
  from public;
grant execute on function public.time_capsule_storage_space_id(text)
  to authenticated;
grant execute on function public.time_capsule_storage_owner_id(text)
  to authenticated;

create table if not exists public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null
    constraint time_capsules_content_length
    check (char_length(trim(content)) between 1 and 5000),
  image_url text,
  unlock_at timestamptz not null,
  opened_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint time_capsules_unlock_after_creation
    check (unlock_at > created_at),
  constraint time_capsules_open_after_unlock
    check (opened_at is null or opened_at >= unlock_at)
);

comment on table public.time_capsules is
  'Messages scoped to a shared space and sealed until a future time.';

comment on column public.time_capsules.image_url is
  'Object path in the private time-capsule-images Storage bucket.';

create index if not exists time_capsules_space_unlock_at_idx
  on public.time_capsules (space_id, unlock_at desc);

create index if not exists time_capsules_author_id_idx
  on public.time_capsules (author_id);

create unique index if not exists time_capsules_image_url_key
  on public.time_capsules (image_url)
  where image_url is not null;

alter table public.time_capsules enable row level security;

drop policy if exists "time_capsules_select_space_members"
  on public.time_capsules;
create policy "time_capsules_select_space_members"
on public.time_capsules
for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "time_capsules_insert_author_in_space"
  on public.time_capsules;
create policy "time_capsules_insert_author_in_space"
on public.time_capsules
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.is_space_member(space_id)
  and unlock_at > timezone('utc', now())
  and opened_at is null
  and (
    image_url is null
    or (
      public.time_capsule_storage_space_id(image_url) = space_id
      and public.time_capsule_storage_owner_id(image_url) = author_id
    )
  )
);

drop policy if exists "time_capsules_open_space_members"
  on public.time_capsules;
create policy "time_capsules_open_space_members"
on public.time_capsules
for update
to authenticated
using (
  public.is_space_member(space_id)
  and opened_at is null
  and unlock_at <= timezone('utc', now())
)
with check (
  public.is_space_member(space_id)
  and opened_at is not null
  and opened_at >= unlock_at
);

create or replace function public.guard_time_capsule_open()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.space_id is distinct from old.space_id
    or new.author_id is distinct from old.author_id
    or new.content is distinct from old.content
    or new.image_url is distinct from old.image_url
    or new.unlock_at is distinct from old.unlock_at
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only opened_at can be updated on a time capsule.'
      using errcode = 'insufficient_privilege';
  end if;

  if old.opened_at is not null or new.opened_at is null then
    raise exception 'This time capsule cannot be opened again.'
      using errcode = 'check_violation';
  end if;

  if timezone('utc', now()) < old.unlock_at then
    raise exception 'This time capsule is still sealed.'
      using errcode = 'check_violation';
  end if;

  new.opened_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists before_time_capsule_open
  on public.time_capsules;
create trigger before_time_capsule_open
  before update on public.time_capsules
  for each row execute procedure public.guard_time_capsule_open();

revoke all on function public.guard_time_capsule_open() from public;
revoke all on table public.time_capsules from anon;
revoke all on table public.time_capsules from authenticated;
grant select, insert on table public.time_capsules to authenticated;
grant update (opened_at) on table public.time_capsules to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'time-capsule-images',
  'time-capsule-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_read_time_capsule_image(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.time_capsules
    where time_capsules.image_url = object_name
      and time_capsules.unlock_at <= timezone('utc', now())
      and public.is_space_member(time_capsules.space_id)
  );
$$;

revoke all on function public.can_read_time_capsule_image(text) from public;
grant execute on function public.can_read_time_capsule_image(text)
  to authenticated;

drop policy if exists "time_capsule_images_select_unlocked"
  on storage.objects;
create policy "time_capsule_images_select_unlocked"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'time-capsule-images'
  and public.can_read_time_capsule_image(name)
);

drop policy if exists "time_capsule_images_insert_own_space_folder"
  on storage.objects;
create policy "time_capsule_images_insert_own_space_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'time-capsule-images'
  and public.time_capsule_storage_owner_id(name) = auth.uid()
  and public.is_space_member(public.time_capsule_storage_space_id(name))
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
);

drop policy if exists "time_capsule_images_delete_own"
  on storage.objects;
create policy "time_capsule_images_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'time-capsule-images'
  and public.time_capsule_storage_owner_id(name) = auth.uid()
  and public.is_space_member(public.time_capsule_storage_space_id(name))
);

commit;
