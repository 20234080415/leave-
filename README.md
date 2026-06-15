# 留白 Leave

> 把想说的话，轻轻放在这里。<br>
> A quiet place to leave the words you want to share.

留白 Leave 是一个为两个人设计的低压力共同日记。它不追求即时回复或连续打卡，而是让记录、问题、愿望与回忆自然地留下来。

Leave is a low-pressure shared journal for two people. It avoids instant-reply pressure and streak mechanics, giving memories, questions, wishes, and future messages a quiet place to stay.

## 功能 / Features

- **今日 / Today**：查看相伴天数、双方今日状态、最新记录和每日问题。
- **记录 / Records**：记录文字、单张图片、天气与心情，并以时间线翻阅共同日常。
- **问题 / Questions**：回答每日问题，双方都写下答案后再一起揭晓。
- **愿望 / Wishes**：管理共同愿望、状态和步骤进度。
- **时间胶囊 / Time Capsules**：把文字和可选照片封存到未来；到期前只显示倒计时，到期后可由空间成员打开。
- **我们 / Us**：查看双方资料、相伴时间、空间数据、邀请码与账户设置。

## 时间胶囊 V1.1

时间胶囊与“未来”概念一起放在愿望页中，不增加底部导航。

- 愿望列表下方提供 `FOR THE FUTURE` 时间胶囊入口。
- 全局玻璃胶囊浮窗支持触控和鼠标拖动，并限制在安全区域内。
- 点击浮窗可快捷进入“写给未来”“我的胶囊”“已解锁胶囊”。
- 支持 30 天、100 天、365 天和自定义解锁日期。
- 支持一张可选图片，使用私有 Supabase Storage bucket。
- 未解锁内容不会下发到浏览器，只展示封存状态和剩余天数。
- 到期后空间成员可确认打开；打开时间由数据库记录。
- 不提供编辑、删除、实时通知、已读状态或催促机制。

## 产品原则 / Product Principles

- 不做实时聊天，不成为即时通讯工具的替代品。
- 不做已读未读或最后在线状态。
- 不做连续打卡、断签提醒或惩罚机制。
- 强调记录、陪伴和回忆，不要求对方回应。
- 让使用体验更像翻阅一本共同日记。

完整说明见 [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md)。

## 技术栈 / Tech Stack

- [Next.js](https://nextjs.org/) 16 with App Router
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Supabase](https://supabase.com/) Auth, PostgreSQL, RLS and Storage
- [ESLint](https://eslint.org/)

## 本地运行 / Local Development

需要 Node.js 20 或更高版本。

```bash
npm install
cp .env.example .env.local
npm run dev
```

在 `.env.local` 中填写 Supabase 项目 URL 和 anon/publishable key。该文件已被 Git 忽略，请勿提交真实密钥。

然后在 Supabase SQL Editor 中按文件名顺序执行 [`supabase/migrations`](./supabase/migrations) 中的 migration。时间胶囊功能对应：

```text
supabase/migrations/202606150001_time_capsules.sql
```

该 migration 会创建：

- `time_capsules` 表及索引
- 基于 `space_members` 的 RLS 策略
- 仅允许到期后更新 `opened_at` 的保护逻辑
- 私有 `time-capsule-images` Storage bucket
- 胶囊图片读写权限策略

启动后打开 [http://localhost:3000](http://localhost:3000)。

## 可用命令 / Scripts

```bash
npm run dev    # 启动开发环境
npm run build  # 创建生产构建
npm run start  # 启动生产服务
npm run lint   # 运行代码检查
```

## 页面路由 / Routes

| 页面 | 路由 |
| --- | --- |
| 今日 | `/` |
| 记录 | `/records` |
| 问题 | `/questions` |
| 愿望 | `/wishes` |
| 时间胶囊 | `/capsules` |
| 我们 | `/us` |
| 登录与注册 | `/auth` |
| 空间引导 | `/onboarding` |

时间胶囊快捷参数：

- `/capsules?compose=1`：直接打开创建胶囊
- `/capsules?view=mine`：查看我的胶囊
- `/capsules?view=opened`：查看已解锁胶囊

## 权限与隐私

- 所有共享业务数据按 `space_id` 隔离。
- RLS 通过 `space_members` 校验空间成员关系。
- 用户只能为自己所属的空间创建胶囊。
- 创建胶囊时 `author_id` 必须是当前登录用户。
- 未到解锁时间时，服务端不会把胶囊内容和图片地址交给前端。
- 图片存放在私有 bucket，路径使用 `space_id/user_id/random-file-name.ext`。

## Roadmap

V1.2 回忆书规划见 [ROADMAP.md](./ROADMAP.md)，当前版本不包含 PDF、电子书或打印版生成。

## 项目状态 / Project Status

当前已完成邮箱认证、双人空间、每日记录、私有图片、每日问题、愿望清单、账户与空间管理，以及 V1.1 时间胶囊。

`npm run lint` 和 `npm run build` 是提交前的基础检查。

<img width="122" height="271" alt="Leave 今日页" src="https://github.com/user-attachments/assets/b3aeb506-0243-4d03-8190-b97514435cfe" />
<img width="122" height="271" alt="Leave 记录页" src="https://github.com/user-attachments/assets/c1a3bbde-2f8a-4999-931e-ec295cd24fb4" />
<img width="122" height="271" alt="Leave 问题页" src="https://github.com/user-attachments/assets/21996129-53eb-4929-b7c5-3d85b9211998" />
<img width="122" height="271" alt="Leave 愿望页" src="https://github.com/user-attachments/assets/2de758c8-b41f-4466-9f29-36191fe1339d" />
<img width="122" height="271" alt="Leave 我们页" src="https://github.com/user-attachments/assets/a2521233-84ed-4883-b08b-8a87b15422cf" />
