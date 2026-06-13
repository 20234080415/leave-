# Supabase 设置

1. 在 Supabase Dashboard 打开 **SQL Editor**。
2. 按文件名顺序完整执行 `migrations/` 中的 SQL：
   - `202606130001_initial_auth_and_spaces.sql`
   - `202606130002_invite_codes_and_space_rpcs.sql`
   - `202606130003_daily_records_and_storage.sql`
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
