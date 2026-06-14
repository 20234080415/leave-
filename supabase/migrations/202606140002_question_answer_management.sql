-- 留白 Leave: allow an author to revise or withdraw today's answer
-- before both answers are revealed.

begin;

create or replace function public.update_current_question_answer(
  target_question_index integer,
  new_answer text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_date_china date := timezone('Asia/Shanghai', now())::date;
  normalized_answer text := trim(new_answer);
  target_space_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required.'
      using errcode = 'insufficient_privilege';
  end if;

  if target_question_index <> public.get_current_question_index() then
    raise exception 'Only the current question can be updated.'
      using errcode = 'check_violation';
  end if;

  if char_length(normalized_answer) not between 1 and 3000 then
    raise exception 'Invalid answer content.'
      using errcode = 'check_violation';
  end if;

  select space_id
  into target_space_id
  from public.question_answers
  where question_index = target_question_index
    and answer_date = current_date_china
    and user_id = current_user_id;

  if target_space_id is null then
    raise exception 'Answer not found.'
      using errcode = 'no_data_found';
  end if;

  if public.is_question_revealed(
    target_space_id,
    target_question_index,
    current_date_china
  ) then
    raise exception 'Revealed answers cannot be updated.'
      using errcode = 'check_violation';
  end if;

  update public.question_answers
  set answer = normalized_answer
  where space_id = target_space_id
    and question_index = target_question_index
    and answer_date = current_date_china
    and user_id = current_user_id;
end;
$$;

create or replace function public.delete_current_question_answer(
  target_question_index integer
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_date_china date := timezone('Asia/Shanghai', now())::date;
  target_answer public.question_answers%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required.'
      using errcode = 'insufficient_privilege';
  end if;

  if target_question_index <> public.get_current_question_index() then
    raise exception 'Only the current question can be deleted.'
      using errcode = 'check_violation';
  end if;

  select *
  into target_answer
  from public.question_answers
  where question_index = target_question_index
    and answer_date = current_date_china
    and user_id = current_user_id;

  if not found then
    raise exception 'Answer not found.'
      using errcode = 'no_data_found';
  end if;

  if public.is_question_revealed(
    target_answer.space_id,
    target_question_index,
    current_date_china
  ) then
    raise exception 'Revealed answers cannot be deleted.'
      using errcode = 'check_violation';
  end if;

  delete from public.question_answers
  where id = target_answer.id;

  return target_answer.image_url;
end;
$$;

revoke all on function public.update_current_question_answer(integer, text)
  from public;
revoke all on function public.delete_current_question_answer(integer)
  from public;

grant execute on function public.update_current_question_answer(integer, text)
  to authenticated;
grant execute on function public.delete_current_question_answer(integer)
  to authenticated;

commit;
