-- 留白 Leave: security hardening for Storage object path parsing
-- Run after 202606130005_wishes_and_steps.sql.

begin;

create or replace function public.storage_object_space_id(object_name text)
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

create or replace function public.storage_object_owner_id(object_name text)
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

revoke all on function public.storage_object_space_id(text) from public;
revoke all on function public.storage_object_owner_id(text) from public;
grant execute on function public.storage_object_space_id(text)
  to authenticated;
grant execute on function public.storage_object_owner_id(text)
  to authenticated;

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
      when public.storage_object_owner_id(object_name) = auth.uid() then
        public.is_space_member(
          public.storage_object_space_id(object_name)
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
  and public.storage_object_owner_id(name) = auth.uid()
  and public.is_space_member(public.storage_object_space_id(name))
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
  and public.storage_object_owner_id(name) = auth.uid()
  and public.is_space_member(public.storage_object_space_id(name))
);

commit;
