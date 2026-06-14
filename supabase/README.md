# Supabase 设置

1. 在 Supabase Dashboard 打开 **SQL Editor**。
2. 按文件名顺序完整执行 `migrations/` 中的 SQL：
   - `202606130001_initial_auth_and_spaces.sql`
   - `202606130002_invite_codes_and_space_rpcs.sql`
   - `202606130003_daily_records_and_storage.sql`
   - `202606130004_daily_questions.sql`
   - `202606130005_wishes_and_steps.sql`
   - `202606140001_security_hardening.sql`
3. 在 **Authentication > URL Configuration** 中设置：
   - Site URL：`http://localhost:3000`
   - Redirect URL：`http://localhost:3000/auth/callback`
4. 将项目 URL 和 anon/publishable key 填入根目录的 `.env.local`。
5. 若使用自定义确认邮件模板，可将确认链接指向：

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding
```

`.env.local` 已被 Git 忽略，不要提交真实密钥。

后续所有包含 `space_id` 的业务表，都应使用以下模式限制读写：

```sql
using (public.is_space_member(space_id))
with check (public.is_space_member(space_id))
```

`create_space` 与 `join_space` 是原子 RPC：空间创建、首位成员写入以及邀请码加入会在同一个数据库事务内完成。

`record-images` 是私有桶，限制单张图片最大 5MB，只接受 JPEG、PNG、WebP 和 GIF。对象路径必须使用：

```text
space_id/user_id/random-file-name.ext
```

问题答案图片复用同一桶，路径使用：

```text
space_id/user_id/questions/random-file-name.ext
```

`question_answers` 的 SELECT RLS 只有在同一空间、同一题目已有两位用户回答后才返回内容；等待阶段仅通过 `get_question_answer_status` RPC 返回布尔值与人数。

`wishes` 直接通过 `space_id` 校验成员关系，`wish_steps` 则通过
`can_access_wish(wish_id)` 追溯所属愿望的 `space_id`，因此步骤表不需要重复保存空间字段。

安全回归测试：

1. 在测试 Supabase 项目的 SQL Editor 中执行 `tests/rls_cross_space_security.sql`。
2. 确认返回结果中的 `passed` 全部为 `true`。
3. 测试在事务中运行并最终回滚，不会保留测试数据。
