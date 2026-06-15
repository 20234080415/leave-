-- Leave Admin: track the first time a space invite is copied.

begin;

alter table public.spaces
  add column if not exists invite_shared_at timestamptz;

comment on column public.spaces.invite_shared_at is
  'First time the creator copied the invite code for sharing.';

create or replace function public.mark_invite_shared()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required.'
      using errcode = 'insufficient_privilege';
  end if;

  update public.spaces
  set invite_shared_at = coalesce(
    invite_shared_at,
    timezone('utc', now())
  )
  where created_by = auth.uid()
    and exists (
      select 1
      from public.space_members
      where space_members.space_id = spaces.id
        and space_members.user_id = auth.uid()
    );
end;
$$;

revoke all on function public.mark_invite_shared() from public;
grant execute on function public.mark_invite_shared() to authenticated;

commit;
