-- 留白 Leave: safe space leave and deletion operations.
-- Run after 202606140002_question_answer_management.sql.

begin;

create or replace function public.leave_space()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_space_id uuid;
  remaining_user_id uuid;
  member_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required.'
      using errcode = 'insufficient_privilege';
  end if;

  select membership.space_id
  into target_space_id
  from public.space_members as membership
  where membership.user_id = current_user_id;

  if target_space_id is null then
    raise exception 'Space membership not found.'
      using errcode = 'no_data_found';
  end if;

  perform 1
  from public.spaces
  where spaces.id = target_space_id
  for update;

  perform pg_advisory_xact_lock(hashtextextended(target_space_id::text, 0));

  select count(*)::integer
  into member_count
  from public.space_members
  where space_members.space_id = target_space_id;

  if member_count <= 1 then
    raise exception 'The last member must delete the space.'
      using errcode = 'check_violation';
  end if;

  select membership.user_id
  into remaining_user_id
  from public.space_members as membership
  where membership.space_id = target_space_id
    and membership.user_id <> current_user_id
  order by membership.joined_at
  limit 1;

  update public.spaces
  set created_by = remaining_user_id
  where spaces.id = target_space_id
    and spaces.created_by = current_user_id;

  delete from public.space_members
  where space_members.space_id = target_space_id
    and space_members.user_id = current_user_id;
end;
$$;

create or replace function public.delete_current_space()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_space_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required.'
      using errcode = 'insufficient_privilege';
  end if;

  select membership.space_id
  into target_space_id
  from public.space_members as membership
  where membership.user_id = current_user_id;

  if target_space_id is null then
    raise exception 'Space membership not found.'
      using errcode = 'no_data_found';
  end if;

  perform 1
  from public.spaces
  where spaces.id = target_space_id
    and spaces.created_by = current_user_id
  for update;

  if not found then
    raise exception 'Only the space creator can delete the space.'
      using errcode = 'insufficient_privilege';
  end if;

  delete from public.spaces
  where spaces.id = target_space_id;
end;
$$;

revoke all on function public.leave_space() from public;
revoke all on function public.delete_current_space() from public;

grant execute on function public.leave_space() to authenticated;
grant execute on function public.delete_current_space() to authenticated;

commit;
