# Supabase 设置

1. 在 Supabase Dashboard 打开 **SQL Editor**。
2. 完整执行 `migrations/202606130001_initial_auth_and_spaces.sql`。
3. 在 **Authentication > URL Configuration** 中设置：
   - Site URL：`http://localhost:3000`
   - Redirect URL：`http://localhost:3000/auth/callback`
4. 将项目 URL 和 anon/publishable key 填入根目录的 `.env.local`。
5. 若使用自定义确认邮件模板，可将确认链接指向：

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding
```

`.env.local` 已被 Git 忽略，不要提交真实密钥。
