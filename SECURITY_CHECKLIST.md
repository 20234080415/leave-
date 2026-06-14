# 留白 Leave 安全检查清单

检查日期：2026-06-14

## 检查结论

- [x] 所有业务表均启用 RLS。
- [x] `daily_records`、`question_answers`、`wishes`、`wish_steps` 均通过 `space_members` 校验 `space_id` 权限。
- [x] `record-images` 为私有桶，上传、读取、删除均校验空间成员关系。
- [x] 私密记录仅作者本人可见。
- [x] 今日问题在双方都回答前不会泄露答案正文或图片。
- [x] Storage 对象路径使用安全 UUID 解析，畸形路径不会导致策略转换异常。
- [x] 已提供可重复执行的跨空间越权测试，测试事务结束后自动回滚。

> 本结论基于仓库内 migration 的最终状态。部署时必须按顺序执行
> `202606130001` 至 `202606140001`，并在目标 Supabase 项目中运行本文的策略盘点 SQL。

## RLS 策略总表

### `public.profiles`

| 策略 | 操作 | 规则 |
| --- | --- | --- |
| `profiles_select_self_or_space_partner` | SELECT | 只能读取自己，或与自己同属一个空间的用户资料 |
| `profiles_update_self` | UPDATE | 只能修改自己的资料，且不能把记录改成其他用户 |

- [x] 不允许客户端直接插入或删除 profile。
- [x] profile 由 `auth.users` 注册触发器自动创建。

### `public.spaces`

| 策略 | 操作 | 规则 |
| --- | --- | --- |
| `spaces_select_creator_or_member` | SELECT | 创建者或空间成员可读取 |
| `spaces_insert_creator` | INSERT | 仅允许以自己为创建者；客户端 INSERT 权限已撤销 |
| `spaces_update_creator` | UPDATE | 仅创建者可修改；客户端仅获准更新 `name` |
| `spaces_delete_creator` | DELETE | 仅创建者可删除 |

- [x] 创建空间必须走 `create_space()`，由数据库原子写入空间和首位成员。

### `public.space_members`

| 策略 | 操作 | 规则 |
| --- | --- | --- |
| `space_members_select_own_spaces` | SELECT | 可读取自己的成员记录，以及自己所属空间的成员 |
| `space_members_insert_creator_self` | INSERT | 创建者只能添加自己；客户端 INSERT 权限已撤销 |
| `space_members_delete_self` | DELETE | 只能移除自己的成员记录 |

- [x] 加入空间必须走 `join_space()`，函数内锁定空间并校验最多两人。

### `public.daily_records`

| 策略 | 操作 | 规则 |
| --- | --- | --- |
| `daily_records_select_visible_in_space` | SELECT | 必须是空间成员；共享记录双方可见，私密记录仅作者可见 |
| `daily_records_insert_self_in_space` | INSERT | `author_id = auth.uid()`，且作者属于目标空间 |
| `daily_records_update_own` | UPDATE | 仅作者可改，更新后仍须属于同一目标空间 |
| `daily_records_delete_own` | DELETE | 仅空间内的记录作者可删 |

### `public.question_bank`

| 策略 | 操作 | 规则 |
| --- | --- | --- |
| `question_bank_read_authenticated` | SELECT | 登录用户可读取固定题库 |

- [x] 客户端无题库写权限。

### `public.question_answers`

| 策略 | 操作 | 规则 |
| --- | --- | --- |
| `question_answers_select_after_both_answer` | SELECT | 仅空间成员可读，且同日同题双方均回答后才展示 |
| `question_answers_insert_self` | INSERT | 只能为自己、当前日期和当天题号提交，且必须属于空间 |

- [x] 客户端没有 UPDATE 或 DELETE 权限。
- [x] 未揭晓时仅可通过状态 RPC 获取回答状态，不返回正文或图片。

### `public.wishes`

| 策略 | 操作 | 规则 |
| --- | --- | --- |
| `wishes_select_space_members` | SELECT | 仅空间成员可读 |
| `wishes_insert_space_members` | INSERT | 仅可写入自己所属空间 |
| `wishes_update_space_members` | UPDATE | 更新前后都必须属于对应空间 |
| `wishes_delete_space_members` | DELETE | 仅空间成员可删 |

### `public.wish_steps`

| 策略 | 操作 | 规则 |
| --- | --- | --- |
| `wish_steps_select_space_members` | SELECT | 通过父级愿望的 `space_id` 校验成员关系 |
| `wish_steps_insert_space_members` | INSERT | 策略存在，但客户端 INSERT 权限已撤销 |
| `wish_steps_update_space_members` | UPDATE | 更新前后均通过父级愿望校验成员关系 |
| `wish_steps_delete_space_members` | DELETE | 通过父级愿望校验成员关系 |

- [x] 新建步骤必须走 `create_wish_step()`，避免客户端伪造排序位置。

## 跨空间越权测试

测试文件：`supabase/tests/rls_cross_space_security.sql`

测试会创建临时用户 A、B、C：A 属于空间 A，B/C 属于空间 B。随后以用户 A 的 JWT 身份验证以下行为：

| 业务表 | 测试行为 | 预期结果 |
| --- | --- | --- |
| `daily_records` | 读取空间 B 记录 | 返回 0 行 |
| `daily_records` | 向空间 B 新增记录 | RLS 拒绝 |
| `daily_records` | 修改或删除空间 B 记录 | 影响 0 行 |
| `question_answers` | 读取空间 B 已揭晓的双方答案 | 返回 0 行 |
| `question_answers` | 向空间 B 提交今日答案 | RLS 拒绝 |
| `wishes` | 读取空间 B 愿望 | 返回 0 行 |
| `wishes` | 向空间 B 新增愿望 | RLS 拒绝 |
| `wishes` | 修改或删除空间 B 愿望 | 影响 0 行 |
| `wish_steps` | 读取空间 B 步骤 | 返回 0 行 |
| `wish_steps` | 通过 RPC 向空间 B 新增步骤 | 权限检查拒绝 |
| `wish_steps` | 修改或删除空间 B 步骤 | 影响 0 行 |

执行方法：

1. 在 Supabase SQL Editor 中先执行全部 migration。
2. 再执行 `supabase/tests/rls_cross_space_security.sql`。
3. 确认结果集每一行的 `passed` 都为 `true`。
4. 测试使用事务并最终 `rollback`，不会保留测试用户或业务数据。

## Storage 检查

桶：`record-images`

| 策略 | 操作 | 规则 |
| --- | --- | --- |
| `record_images_select_visible` | SELECT | 由 `can_read_record_image(name)` 判断成员和业务可见性 |
| `record_images_insert_own_space_folder` | INSERT | 路径必须为 `{space_id}/{user_id}/{filename}`；用户必须是空间成员且路径用户为本人 |
| `record_images_delete_own` | DELETE | 仅路径中的本人可删除，且删除时仍是空间成员 |

- [x] 桶为 private，不允许匿名公开读取。
- [x] 单文件限制 5 MB。
- [x] 仅允许 JPEG、PNG、WebP、GIF。
- [x] 共享记录图片：空间成员可读取。
- [x] 私密记录图片：仅作者可读取。
- [x] 问题答案图片：仅双方都回答并揭晓后可读取。
- [x] 没有 UPDATE 策略，客户端不能覆盖已有对象。
- [x] 畸形 UUID 路径安全返回无权限，不抛出转换异常。

建议在客户端环境另做以下集成测试：

- [ ] 用户 A 上传到空间 B 路径，预期 Storage API 返回 403。
- [ ] 用户 A 请求空间 B 图片，预期 Storage API 返回 400/403 或无法创建签名 URL。
- [ ] 用户 A 上传到空间 A、但路径中的用户 ID 写成他人，预期返回 403。
- [ ] 非作者读取同空间 private 记录图片，预期被拒绝。
- [ ] 双方答案未齐时读取问题图片，预期被拒绝；双方回答后可读取。
- [ ] 上传超过 5 MB 或非图片 MIME，预期被拒绝。

## 目标环境策略盘点 SQL

在 Supabase SQL Editor 中运行：

```sql
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
  and tablename in (
    'profiles',
    'spaces',
    'space_members',
    'daily_records',
    'question_bank',
    'question_answers',
    'wishes',
    'wish_steps',
    'objects'
  )
order by schemaname, tablename, policyname;
```

确认 RLS 本身已启用：

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles',
    'spaces',
    'space_members',
    'daily_records',
    'question_bank',
    'question_answers',
    'wishes',
    'wish_steps'
  )
order by c.relname;
```

## 发布前检查

- [ ] 生产环境已执行 `202606140001_security_hardening.sql`。
- [ ] 跨空间 SQL 测试全部通过。
- [ ] Storage API 集成测试全部通过。
- [ ] 浏览器端只使用 publishable/anon key，不包含 service role key。
- [ ] `.env.local` 已被 `.gitignore` 忽略且未进入 Git 历史。
- [ ] 签名 URL 设置较短有效期，当前前端建议值为 1 小时以内。
- [ ] 对创建空间、加入空间、提交答案和上传图片设置合理的频率限制。
- [ ] 新增任何带 `space_id` 的表时，同步增加 RLS 和跨空间越权测试。

## 已知边界

- `service_role` 会按 Supabase 设计绕过 RLS，只能存在于可信服务端环境。
- RLS 防止数据越权，但不替代接口频率限制、异常监控和密钥轮换。
- 数据库策略不能自动清理业务记录删除后遗留的 Storage 对象，应配置定期清理或删除联动任务。
