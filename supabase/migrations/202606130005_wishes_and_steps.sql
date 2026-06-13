-- 留白 Leave: shared wishes and checklist steps (v1)
-- Run after 202606130004_daily_questions.sql.

begin;

do $$
begin
  create type public.wish_status as enum (
    '想想中',
    '准备中',
    '进行中',
    '已完成'
  );
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  title text not null
    constraint wishes_title_length
    check (char_length(trim(title)) between 1 and 100),
  description text
    constraint wishes_description_length
    check (description is null or char_length(description) <= 2000),
  status public.wish_status not null default '想想中',
  target_date date,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wish_steps (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes (id) on delete cascade,
  content text not null
    constraint wish_steps_content_length
    check (char_length(trim(content)) between 1 and 300),
  is_done boolean not null default false,
  order_index integer not null default 0
    constraint wish_steps_order_nonnegative check (order_index >= 0),
  constraint wish_steps_order_unique unique (wish_id, order_index)
);

comment on table public.wishes is
  'Shared wish list items scoped to a two-person space.';
comment on table public.wish_steps is
  'Ordered checklist steps belonging to a wish.';

create index if not exists wishes_space_created_at_idx
  on public.wishes (space_id, created_at desc);
create index if not exists wish_steps_wish_order_idx
  on public.wish_steps (wish_id, order_index);

create or replace function public.can_access_wish(target_wish_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wishes
    where wishes.id = target_wish_id
      and public.is_space_member(wishes.space_id)
  );
$$;

revoke all on function public.can_access_wish(uuid) from public;
grant execute on function public.can_access_wish(uuid) to authenticated;

create or replace function public.create_wish_step(
  target_wish_id uuid,
  step_content text
)
returns public.wish_steps
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_content text := trim(step_content);
  next_order_index integer;
  created_step public.wish_steps;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.'
      using errcode = 'insufficient_privilege';
  end if;

  if not public.can_access_wish(target_wish_id) then
    raise exception 'Wish not found.'
      using errcode = 'insufficient_privilege';
  end if;

  if char_length(normalized_content) not between 1 and 300 then
    raise exception 'Invalid step content.'
      using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_wish_id::text, 0));

  select coalesce(max(order_index), -1) + 1
  into next_order_index
  from public.wish_steps
  where wish_id = target_wish_id;

  insert into public.wish_steps (
    wish_id,
    content,
    is_done,
    order_index
  )
  values (
    target_wish_id,
    normalized_content,
    false,
    next_order_index
  )
  returning * into created_step;

  return created_step;
end;
$$;

revoke all on function public.create_wish_step(uuid, text) from public;
grant execute on function public.create_wish_step(uuid, text)
  to authenticated;

alter table public.wishes enable row level security;
alter table public.wish_steps enable row level security;

drop policy if exists "wishes_select_space_members" on public.wishes;
create policy "wishes_select_space_members"
on public.wishes
for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "wishes_insert_space_members" on public.wishes;
create policy "wishes_insert_space_members"
on public.wishes
for insert
to authenticated
with check (public.is_space_member(space_id));

drop policy if exists "wishes_update_space_members" on public.wishes;
create policy "wishes_update_space_members"
on public.wishes
for update
to authenticated
using (public.is_space_member(space_id))
with check (public.is_space_member(space_id));

drop policy if exists "wishes_delete_space_members" on public.wishes;
create policy "wishes_delete_space_members"
on public.wishes
for delete
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "wish_steps_select_space_members" on public.wish_steps;
create policy "wish_steps_select_space_members"
on public.wish_steps
for select
to authenticated
using (public.can_access_wish(wish_id));

drop policy if exists "wish_steps_insert_space_members" on public.wish_steps;
create policy "wish_steps_insert_space_members"
on public.wish_steps
for insert
to authenticated
with check (public.can_access_wish(wish_id));

drop policy if exists "wish_steps_update_space_members" on public.wish_steps;
create policy "wish_steps_update_space_members"
on public.wish_steps
for update
to authenticated
using (public.can_access_wish(wish_id))
with check (public.can_access_wish(wish_id));

drop policy if exists "wish_steps_delete_space_members" on public.wish_steps;
create policy "wish_steps_delete_space_members"
on public.wish_steps
for delete
to authenticated
using (public.can_access_wish(wish_id));

revoke all on table public.wishes from anon;
revoke all on table public.wish_steps from anon;
grant select, insert, update, delete on table public.wishes to authenticated;
grant select, update, delete on table public.wish_steps
  to authenticated;
revoke insert on table public.wish_steps from authenticated;

commit;
