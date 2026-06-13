-- 留白 Leave: invite codes and atomic two-person space operations
-- Run after 202606130001_initial_auth_and_spaces.sql.

begin;

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result text := '';
  index_value integer;
begin
  for position in 1..6 loop
    index_value := 1 + floor(random() * length(alphabet))::integer;
    result := result || substr(alphabet, index_value, 1);
  end loop;

  return result;
end;
$$;

alter table public.spaces
  add column if not exists invite_code text;

create unique index if not exists spaces_invite_code_key
  on public.spaces (invite_code);

update public.spaces
set invite_code = public.generate_invite_code()
where invite_code is null;

alter table public.spaces
  alter column invite_code set default public.generate_invite_code(),
  alter column invite_code set not null;

alter table public.spaces
  drop constraint if exists spaces_invite_code_format;

alter table public.spaces
  add constraint spaces_invite_code_format
  check (invite_code ~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$');

comment on column public.spaces.invite_code is
  'Unique six-character code used by the second member to join a space.';

create or replace function public.create_space(space_name text default '我们的留白')
returns table (
  space_id uuid,
  invite_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_name text := coalesce(nullif(trim(space_name), ''), '我们的留白');
  created_space_id uuid;
  created_invite_code text;
  attempt integer := 0;
begin
  if current_user_id is null then
    raise exception 'Authentication required.'
      using errcode = 'insufficient_privilege';
  end if;

  if char_length(normalized_name) > 50 then
    raise exception 'Space name is too long.'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1
    from public.space_members
    where user_id = current_user_id
  ) then
    raise exception 'You already belong to a space.'
      using errcode = 'unique_violation';
  end if;

  loop
    attempt := attempt + 1;
    created_invite_code := public.generate_invite_code();

    begin
      insert into public.spaces (name, created_by, invite_code)
      values (normalized_name, current_user_id, created_invite_code)
      returning id into created_space_id;

      exit;
    exception
      when unique_violation then
        if attempt >= 10 then
          raise exception 'Could not generate a unique invite code.';
        end if;
    end;
  end loop;

  insert into public.space_members (space_id, user_id)
  values (created_space_id, current_user_id);

  return query
  select created_space_id, created_invite_code;
end;
$$;

create or replace function public.join_space(invite_code_input text)
returns table (
  space_id uuid,
  invite_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_code text := upper(trim(invite_code_input));
  target_space public.spaces%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required.'
      using errcode = 'insufficient_privilege';
  end if;

  if normalized_code !~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$' then
    raise exception 'Invalid invite code.'
      using errcode = 'invalid_parameter_value';
  end if;

  if exists (
    select 1
    from public.space_members
    where user_id = current_user_id
  ) then
    raise exception 'You already belong to a space.'
      using errcode = 'unique_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(normalized_code, 0));

  select *
  into target_space
  from public.spaces
  where spaces.invite_code = normalized_code
  for update;

  if not found then
    raise exception 'Invite code not found.'
      using errcode = 'no_data_found';
  end if;

  if (
    select count(*)
    from public.space_members
    where space_members.space_id = target_space.id
  ) >= 2 then
    raise exception 'This space already has two members.'
      using errcode = 'check_violation';
  end if;

  insert into public.space_members (space_id, user_id)
  values (target_space.id, current_user_id);

  return query
  select target_space.id, target_space.invite_code;
end;
$$;

-- Clients must use the atomic RPCs above instead of assembling partial state.
revoke insert on table public.spaces from authenticated;
revoke insert on table public.space_members from authenticated;
revoke update on table public.spaces from authenticated;
grant update (name) on table public.spaces to authenticated;

revoke all on function public.generate_invite_code() from public;
revoke all on function public.create_space(text) from public;
revoke all on function public.join_space(text) from public;

grant execute on function public.create_space(text) to authenticated;
grant execute on function public.join_space(text) to authenticated;

commit;
