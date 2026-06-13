# 留白 Leave

> 把想说的话，轻轻放在这里。<br>
> A quiet place to leave the words you want to share.

留白 Leave 是一个为两个人设计的低压力日常记录空间。它不追求即时回应或连续打卡，而是让记录、问题和共同愿望自然地留下来。

Leave is a low-pressure shared journal designed for two people. Instead of encouraging instant replies or daily streaks, it offers a gentle place for memories, questions, and shared wishes.

## 功能 / Features

- **今日 / Today**：查看相伴天数、双方记录状态、最新记录和今日问题。<br>
  See the number of days together, each person's daily status, the latest entry, and today's question.
- **记录 / Records**：浏览时间线，通过弹窗记录文字、单张图片、天气、心情和可见范围。<br>
  Browse a timeline and create an entry with text, one image, weather, mood, and visibility.
- **问题 / Questions**：回答每日问题，在双方都回答前保持等待状态。<br>
  Answer a daily question and keep both answers hidden until each person has responded.
- **愿望 / Wishes**：管理共同愿望、状态和步骤进度。<br>
  Manage shared wishes, statuses, and step progress.
- **我们 / Us**：展示双方资料、纪念日倒计时和空间邀请码。<br>
  View both profiles, an anniversary countdown, and the shared-space invite code.

当前版本使用 mock 数据，重点完成移动端静态界面与交互流程。

The current version uses mock data and focuses on the mobile interface and interaction flows.

## 设计原则 / Product Principles

- 不做实时聊天，不成为即时通讯工具的替代品。<br>
  No real-time chat or messaging-app replacement.
- 不做已读未读或最后在线状态，减少等待压力。<br>
  No read receipts or last-seen indicators.
- 不做连续打卡、断签提醒或惩罚机制。<br>
  No streaks, missed-day alerts, or attendance penalties.
- 强调“留下来”，而不是“要求回应”。<br>
  Content is left with care, never used to demand a response.

完整说明见 [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md)。

See [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) for the full principles.

## 技术栈 / Tech Stack

- [Next.js](https://nextjs.org/) 16 with App Router
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [ESLint](https://eslint.org/)

## 本地运行 / Local Development

环境要求：Node.js 20 或更高版本。

Requirement: Node.js 20 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

在 `.env.local` 中填写 Supabase 项目 URL 和 anon/publishable key，并在
Supabase SQL Editor 中执行
[`supabase/migrations/202606130001_initial_auth_and_spaces.sql`](./supabase/migrations/202606130001_initial_auth_and_spaces.sql)。

Fill `.env.local` with your Supabase project URL and anon/publishable key, then
run
[`supabase/migrations/202606130001_initial_auth_and_spaces.sql`](./supabase/migrations/202606130001_initial_auth_and_spaces.sql)
in the Supabase SQL Editor.

打开 [http://localhost:3000](http://localhost:3000)。

Open [http://localhost:3000](http://localhost:3000).

## 可用命令 / Scripts

```bash
npm run dev    # 启动开发环境 / Start development server
npm run build  # 创建生产构建 / Create production build
npm run start  # 启动生产服务 / Start production server
npm run lint   # 运行代码检查 / Run lint checks
```

## 页面路由 / Routes

| 页面 Page | 路由 Route |
| --- | --- |
| 今日 Today | `/` |
| 记录 Records | `/records` |
| 问题 Questions | `/questions` |
| 愿望 Wishes | `/wishes` |
| 我们 Us | `/us` |
| 登录与注册 Auth | `/auth` |
| 空间引导 Space setup | `/onboarding` |

## 项目状态 / Project Status

项目正在按阶段开发。目前已完成项目骨架、五页静态 UI、Supabase 数据库基础和邮箱认证。创建/加入双人空间与业务数据持久化将在后续阶段完成。

The project is being developed in stages. The foundation, five-page static UI,
Supabase database schema, and email authentication are complete. Creating or
joining a shared space and persisting product data will follow.
