-- 留白 Leave: fixed daily question bank and simultaneous answer reveal
-- Run after 202606130003_daily_records_and_storage.sql.

begin;

create table if not exists public.question_bank (
  question_index integer primary key
    constraint question_bank_index_nonnegative check (question_index >= 0),
  question text not null
    constraint question_bank_question_length
    check (char_length(trim(question)) between 1 and 200),
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.question_bank is
  'Fixed, globally readable bank of warm daily questions.';

create table if not exists public.question_answers (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  question_index integer not null
    references public.question_bank (question_index) on delete restrict,
  answer_date date not null
    default (timezone('Asia/Shanghai', now())::date),
  user_id uuid not null references public.profiles (id) on delete cascade,
  answer text not null
    constraint question_answers_answer_length
    check (char_length(trim(answer)) between 1 and 3000),
  image_url text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint question_answers_one_per_user
    unique (space_id, answer_date, user_id)
);

comment on table public.question_answers is
  'Answers remain hidden until both members answer the same question index.';

comment on column public.question_answers.image_url is
  'Object path in the private record-images bucket.';

create index if not exists question_answers_space_question_idx
  on public.question_answers (
    space_id,
    answer_date,
    question_index,
    created_at
  );

create unique index if not exists question_answers_image_url_key
  on public.question_answers (image_url)
  where image_url is not null;

alter table public.question_bank enable row level security;
alter table public.question_answers enable row level security;

create or replace function public.is_question_revealed(
  target_space_id uuid,
  target_question_index integer,
  target_answer_date date
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_space_member(target_space_id)
    and (
      select count(distinct question_answers.user_id)
      from public.question_answers
      where question_answers.space_id = target_space_id
        and question_answers.question_index = target_question_index
        and question_answers.answer_date = target_answer_date
    ) >= 2;
$$;

create or replace function public.get_current_question_index()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select (
    (
      timezone('Asia/Shanghai', now())::date - date '1970-01-01'
    ) % greatest((select count(*) from public.question_bank), 1)
  )::integer;
$$;

revoke all on function public.is_question_revealed(uuid, integer, date)
  from public;
revoke all on function public.get_current_question_index() from public;
grant execute on function public.is_question_revealed(uuid, integer, date)
  to authenticated;
grant execute on function public.get_current_question_index()
  to authenticated;

drop policy if exists "question_bank_read_authenticated"
  on public.question_bank;
create policy "question_bank_read_authenticated"
on public.question_bank
for select
to authenticated
using (true);

-- No answer row, including the current user's own answer, is selectable until
-- two distinct space members have answered the same question.
drop policy if exists "question_answers_select_after_both_answer"
  on public.question_answers;
create policy "question_answers_select_after_both_answer"
on public.question_answers
for select
to authenticated
using (
  public.is_question_revealed(space_id, question_index, answer_date)
);

drop policy if exists "question_answers_insert_self"
  on public.question_answers;
create policy "question_answers_insert_self"
on public.question_answers
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_space_member(space_id)
  and answer_date = timezone('Asia/Shanghai', now())::date
  and question_index = public.get_current_question_index()
  and (
    image_url is null
    or (
      (storage.foldername(image_url))[1] = space_id::text
      and (storage.foldername(image_url))[2] = user_id::text
      and (storage.foldername(image_url))[3] = 'questions'
    )
  )
);

-- Waiting-state RPC: returns counts only and never exposes answer content.
create or replace function public.get_question_answer_status(
  target_question_index integer
)
returns table (
  space_id uuid,
  current_user_answered boolean,
  answer_count integer,
  member_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with current_membership as (
    select membership.space_id
    from public.space_members as membership
    where membership.user_id = auth.uid()
    limit 1
  )
  select
    current_membership.space_id,
    exists (
      select 1
      from public.question_answers
      where question_answers.space_id = current_membership.space_id
        and question_answers.question_index = target_question_index
        and question_answers.answer_date =
          timezone('Asia/Shanghai', now())::date
        and question_answers.user_id = auth.uid()
    ),
    (
      select count(distinct question_answers.user_id)::integer
      from public.question_answers
      where question_answers.space_id = current_membership.space_id
        and question_answers.question_index = target_question_index
        and question_answers.answer_date =
          timezone('Asia/Shanghai', now())::date
    ),
    (
      select count(*)::integer
      from public.space_members
      where space_members.space_id = current_membership.space_id
    )
  from current_membership;
$$;

revoke all on table public.question_bank from anon;
revoke all on table public.question_answers from anon;
grant select on table public.question_bank to authenticated;
grant select, insert on table public.question_answers to authenticated;

revoke all on function public.get_question_answer_status(integer) from public;
grant execute on function public.get_question_answer_status(integer)
  to authenticated;

-- Extend private image reads to question answers, but only after both answers
-- exist. Authors may still manage their own upload path for rollback.
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
      when exists (
        select 1
        from public.daily_records
        where daily_records.image_url = object_name
          and daily_records.visibility = 'shared'
          and public.is_space_member(daily_records.space_id)
      ) then true
      else exists (
        select 1
        from public.question_answers
        where question_answers.image_url = object_name
          and public.is_question_revealed(
            question_answers.space_id,
            question_answers.question_index,
            question_answers.answer_date
          )
      )
    end;
$$;

revoke all on function public.can_read_record_image(text) from public;
grant execute on function public.can_read_record_image(text) to authenticated;

insert into public.question_bank (question_index, question)
values
  (0, '最近有什么小事，让你觉得生活很可爱？'),
  (1, '如果把今天收藏起来，你最想留下哪个瞬间？'),
  (2, '最近一次想起我时，你正在做什么？'),
  (3, '这段时间里，我做过哪件小事让你感到安心？'),
  (4, '如果这个周末只安排一件小事，你想和我做什么？'),
  (5, '最近有什么歌、电影或一句话，让你想分享给我？'),
  (6, '你最喜欢我们相处时的哪一种安静？'),
  (7, '今天的你，最希望被怎样温柔地对待？'),
  (8, '最近有没有一个念头，你还没来得及告诉我？'),
  (9, '如果给今天的心情取一个名字，它会叫什么？'),
  (10, '你觉得我们最近有什么小小的默契？'),
  (11, '下一次见面时，你最想先做什么？'),
  (12, '最近哪一顿饭，让你吃得特别满足？'),
  (13, '如果能一起学一件新东西，你会选什么？'),
  (14, '你心里理想的普通一天，是什么样子？'),
  (15, '最近有什么值得为自己轻轻鼓掌的事？'),
  (16, '你最想和我重温我们经历过的哪一天？'),
  (17, '最近一次感到被理解，是什么时候？'),
  (18, '如果给我们的关系写一句旁白，你会写什么？'),
  (19, '你最近最期待的一件小事是什么？'),
  (20, '有哪些习惯，因为彼此而慢慢发生了变化？'),
  (21, '今天有什么疲惫，是你想暂时放在我这里的？'),
  (22, '如果现在可以一起散步，你想走去哪里？'),
  (23, '你觉得我身上哪个小特点最可爱？'),
  (24, '最近有没有一个梦，醒来后还记得？'),
  (25, '如果为我们准备一份小礼物，你会选择什么？'),
  (26, '你最喜欢我们一起度过的哪个季节？为什么？'),
  (27, '最近什么味道或天气，让你想起了我们？'),
  (28, '有什么话不需要我回答，但你想让我知道？'),
  (29, '此刻的你，最想对未来的我们说什么？')
on conflict (question_index) do update
set question = excluded.question;

commit;
