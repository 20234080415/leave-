-- Cross-space RLS security test for 留白 Leave.
-- Run in Supabase SQL Editor after all migrations.
-- The entire test is wrapped in a transaction and always rolls back.

begin;

-- Three temporary users:
-- user A owns space A; users B and C belong to space B.
insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'rls-a@leave.test',
    crypt('temporary-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nickname":"安全测试 A"}'::jsonb,
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'rls-b@leave.test',
    crypt('temporary-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nickname":"安全测试 B"}'::jsonb,
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'rls-c@leave.test',
    crypt('temporary-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nickname":"安全测试 C"}'::jsonb,
    now(),
    now()
  );

insert into public.spaces (id, name, created_by, invite_code)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '安全测试空间 A',
    '10000000-0000-4000-8000-000000000001',
    'TESTA2'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '安全测试空间 B',
    '10000000-0000-4000-8000-000000000002',
    'TESTB2'
  );

insert into public.space_members (space_id, user_id)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003'
  );

insert into public.daily_records (
  id,
  space_id,
  author_id,
  content,
  visibility
)
values (
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000002',
  '空间 B 的记录',
  'shared'
);

insert into public.question_answers (
  id,
  space_id,
  question_index,
  answer_date,
  user_id,
  answer
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    public.get_current_question_index(),
    timezone('Asia/Shanghai', now())::date,
    '10000000-0000-4000-8000-000000000002',
    '空间 B 用户 B 的答案'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    public.get_current_question_index(),
    timezone('Asia/Shanghai', now())::date,
    '10000000-0000-4000-8000-000000000003',
    '空间 B 用户 C 的答案'
  );

insert into public.wishes (
  id,
  space_id,
  title,
  status
)
values (
  '50000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  '空间 B 的愿望',
  '想想中'
);

insert into public.wish_steps (
  id,
  wish_id,
  content,
  order_index
)
values (
  '60000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  '空间 B 的步骤',
  0
);

create or replace function public.run_cross_space_rls_test()
returns table (
  test_name text,
  passed boolean,
  detail text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected_rows integer;
  visible_rows integer;
begin
  test_name := 'membership: A is not a member of space B';
  passed := not public.is_space_member(
    '20000000-0000-4000-8000-000000000002'
  );
  detail := 'Expected false from is_space_member(space_b).';
  return next;

  select count(*) into visible_rows
  from public.daily_records
  where space_id = '20000000-0000-4000-8000-000000000002';
  test_name := 'daily_records: cross-space SELECT returns zero rows';
  passed := visible_rows = 0;
  detail := format('Visible rows: %s', visible_rows);
  return next;

  begin
    insert into public.daily_records (
      space_id,
      author_id,
      content,
      visibility
    )
    values (
      '20000000-0000-4000-8000-000000000002',
      auth.uid(),
      '越权写入',
      'shared'
    );
    test_name := 'daily_records: cross-space INSERT is rejected';
    passed := false;
    detail := 'Unexpected INSERT success.';
    return next;
  exception
    when insufficient_privilege then
      test_name := 'daily_records: cross-space INSERT is rejected';
      passed := true;
      detail := 'Rejected by RLS.';
      return next;
  end;

  update public.daily_records
  set content = '越权更新'
  where id = '30000000-0000-4000-8000-000000000001';
  get diagnostics affected_rows = row_count;
  test_name := 'daily_records: cross-space UPDATE affects zero rows';
  passed := affected_rows = 0;
  detail := format('Affected rows: %s', affected_rows);
  return next;

  delete from public.daily_records
  where id = '30000000-0000-4000-8000-000000000001';
  get diagnostics affected_rows = row_count;
  test_name := 'daily_records: cross-space DELETE affects zero rows';
  passed := affected_rows = 0;
  detail := format('Affected rows: %s', affected_rows);
  return next;

  select count(*) into visible_rows
  from public.question_answers
  where space_id = '20000000-0000-4000-8000-000000000002';
  test_name := 'question_answers: revealed cross-space SELECT returns zero rows';
  passed := visible_rows = 0;
  detail := format('Visible rows: %s', visible_rows);
  return next;

  begin
    insert into public.question_answers (
      space_id,
      question_index,
      user_id,
      answer
    )
    values (
      '20000000-0000-4000-8000-000000000002',
      public.get_current_question_index(),
      auth.uid(),
      '越权回答'
    );
    test_name := 'question_answers: cross-space INSERT is rejected';
    passed := false;
    detail := 'Unexpected INSERT success.';
    return next;
  exception
    when insufficient_privilege then
      test_name := 'question_answers: cross-space INSERT is rejected';
      passed := true;
      detail := 'Rejected by RLS.';
      return next;
  end;

  select count(*) into visible_rows
  from public.wishes
  where space_id = '20000000-0000-4000-8000-000000000002';
  test_name := 'wishes: cross-space SELECT returns zero rows';
  passed := visible_rows = 0;
  detail := format('Visible rows: %s', visible_rows);
  return next;

  begin
    insert into public.wishes (space_id, title)
    values (
      '20000000-0000-4000-8000-000000000002',
      '越权愿望'
    );
    test_name := 'wishes: cross-space INSERT is rejected';
    passed := false;
    detail := 'Unexpected INSERT success.';
    return next;
  exception
    when insufficient_privilege then
      test_name := 'wishes: cross-space INSERT is rejected';
      passed := true;
      detail := 'Rejected by RLS.';
      return next;
  end;

  update public.wishes
  set title = '越权更新'
  where id = '50000000-0000-4000-8000-000000000001';
  get diagnostics affected_rows = row_count;
  test_name := 'wishes: cross-space UPDATE affects zero rows';
  passed := affected_rows = 0;
  detail := format('Affected rows: %s', affected_rows);
  return next;

  delete from public.wishes
  where id = '50000000-0000-4000-8000-000000000001';
  get diagnostics affected_rows = row_count;
  test_name := 'wishes: cross-space DELETE affects zero rows';
  passed := affected_rows = 0;
  detail := format('Affected rows: %s', affected_rows);
  return next;

  select count(*) into visible_rows
  from public.wish_steps
  where wish_id = '50000000-0000-4000-8000-000000000001';
  test_name := 'wish_steps: cross-space SELECT returns zero rows';
  passed := visible_rows = 0;
  detail := format('Visible rows: %s', visible_rows);
  return next;

  begin
    perform public.create_wish_step(
      '50000000-0000-4000-8000-000000000001',
      '越权步骤'
    );
    test_name := 'wish_steps: cross-space create RPC is rejected';
    passed := false;
    detail := 'Unexpected RPC success.';
    return next;
  exception
    when insufficient_privilege then
      test_name := 'wish_steps: cross-space create RPC is rejected';
      passed := true;
      detail := 'Rejected by membership check.';
      return next;
  end;

  update public.wish_steps
  set content = '越权更新'
  where id = '60000000-0000-4000-8000-000000000001';
  get diagnostics affected_rows = row_count;
  test_name := 'wish_steps: cross-space UPDATE affects zero rows';
  passed := affected_rows = 0;
  detail := format('Affected rows: %s', affected_rows);
  return next;

  delete from public.wish_steps
  where id = '60000000-0000-4000-8000-000000000001';
  get diagnostics affected_rows = row_count;
  test_name := 'wish_steps: cross-space DELETE affects zero rows';
  passed := affected_rows = 0;
  detail := format('Affected rows: %s', affected_rows);
  return next;

  test_name := 'Storage: A cannot read a space B owner path';
  passed := not public.can_read_record_image(
    '20000000-0000-4000-8000-000000000002/'
      || '10000000-0000-4000-8000-000000000002/'
      || 'private.jpg'
  );
  detail := 'Expected false from can_read_record_image(space_b path).';
  return next;

  test_name := 'Storage: malformed object path is safely rejected';
  passed := public.storage_object_space_id('not-a-uuid/user/file.jpg') is null;
  detail := 'Expected NULL instead of UUID cast error.';
  return next;
end;
$$;

grant execute on function public.run_cross_space_rls_test()
  to authenticated;

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

set local role authenticated;
select * from public.run_cross_space_rls_test();
reset role;

rollback;
