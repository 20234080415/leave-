-- 留白 Leave: authentication profiles and two-person spaces
-- Run this entire migration in the Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null
    constraint profiles_nickname_length check (char_length(nickname) between 1 and 30),
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'Public profile data linked one-to-one with auth.users.';

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default '我们的留白'
    constraint spaces_name_length check (char_length(name) between 1 and 50),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.spaces is 'A private shared space for at most two people.';

create table public.space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  constraint space_members_space_user_key unique (space_id, user_id),
  constraint space_members_one_space_per_user_key unique (user_id)
);

comment on table public.space_members is 'Membership joining profiles to two-person spaces.';

create index space_members_space_id_idx on public.space_members (space_id);

-- Create the public profile automatically after a Supabase Auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      '留白用户'
    ),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep every space limited to two members, including concurrent inserts.
create or replace function public.enforce_space_member_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.space_id::text, 0));

  if (
    select count(*)
    from public.space_members
    where space_id = new.space_id
  ) >= 2 then
    raise exception 'This space already has two members.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists before_space_member_insert on public.space_members;

create trigger before_space_member_insert
  before insert on public.space_members
  for each row execute procedure public.enforce_space_member_limit();

-- SECURITY DEFINER helpers prevent recursive RLS lookups.
create or replace function public.is_space_member(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.space_members
    where space_id = target_space_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.shares_space_with(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.space_members as mine
    join public.space_members as theirs
      on theirs.space_id = mine.space_id
    where mine.user_id = auth.uid()
      and theirs.user_id = target_user_id
  );
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.enforce_space_member_limit() from public;
revoke all on function public.is_space_member(uuid) from public;
revoke all on function public.shares_space_with(uuid) from public;

grant execute on function public.is_space_member(uuid) to authenticated;
grant execute on function public.shares_space_with(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;

-- Profiles: users can see themselves and the person sharing their space.
create policy "profiles_select_self_or_space_partner"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.shares_space_with(id)
);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Spaces: creators can create a space; members can read it.
create policy "spaces_select_creator_or_member"
on public.spaces
for select
to authenticated
using (
  created_by = auth.uid()
  or public.is_space_member(id)
);

create policy "spaces_insert_creator"
on public.spaces
for insert
to authenticated
with check (created_by = auth.uid());

create policy "spaces_update_creator"
on public.spaces
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "spaces_delete_creator"
on public.spaces
for delete
to authenticated
using (created_by = auth.uid());

-- Membership: members can see both people in their own space.
create policy "space_members_select_own_spaces"
on public.space_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_space_member(space_id)
);

-- Stage 3 only allows a creator to add themselves. Joining by invite code
-- should be implemented later through a tightly scoped SECURITY DEFINER RPC.
create policy "space_members_insert_creator_self"
on public.space_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.spaces
    where id = space_id
      and created_by = auth.uid()
  )
);

create policy "space_members_delete_self"
on public.space_members
for delete
to authenticated
using (user_id = auth.uid());

revoke all on table public.profiles from anon;
revoke all on table public.spaces from anon;
revoke all on table public.space_members from anon;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.spaces to authenticated;
grant select, insert, delete on table public.space_members to authenticated;

commit;
