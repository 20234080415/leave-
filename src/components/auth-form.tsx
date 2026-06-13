"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export function AuthForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured) {
      setIsError(true);
      setMessage("请先完成 Supabase 环境配置。");
      return;
    }

    setLoading(true);
    setMessage(null);
    setIsError(false);

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nickname: nickname.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (error) {
        setIsError(true);
        setMessage(toFriendlyMessage(error.message));
      } else if (data.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setMessage("确认邮件已经寄出。确认邮箱后，再回来继续。");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsError(true);
        setMessage(toFriendlyMessage(error.message));
      } else {
        router.push("/onboarding");
        router.refresh();
      }
    }

    setLoading(false);
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage(null);
    setIsError(false);
  }

  return (
    <section className="soft-card">
      <div className="grid grid-cols-2 rounded-2xl bg-[#f5ece9] p-1">
        <ModeButton
          active={mode === "login"}
          onClick={() => switchMode("login")}
        >
          登录
        </ModeButton>
        <ModeButton
          active={mode === "signup"}
          onClick={() => switchMode("signup")}
        >
          注册
        </ModeButton>
      </div>

      <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <div>
            <label htmlFor="nickname" className="field-label">
              昵称
            </label>
            <input
              id="nickname"
              name="nickname"
              className="text-field"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="希望对方怎样称呼你？"
              minLength={1}
              maxLength={30}
              required
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="field-label">
            邮箱
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="text-field"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            密码
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="text-field"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 8 位字符"
            minLength={8}
            required
          />
        </div>

        {message ? (
          <p
            role="status"
            className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
              isError
                ? "bg-[#fff0ee] text-[#a25550]"
                : "bg-[#f0f4eb] text-[#66715c]"
            }`}
          >
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          className="soft-button w-full disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading || !configured}
        >
          {loading
            ? "请稍等…"
            : mode === "login"
              ? "登录，回到留白"
              : "创建我的账号"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs leading-5 text-ink-faint">
        没有已读提示，也不要求立即回应。
      </p>
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`rounded-xl py-2.5 text-sm transition ${
        active
          ? "bg-white text-rose-deep shadow-sm"
          : "text-ink-muted hover:text-ink"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function toFriendlyMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "邮箱或密码不正确，请再检查一下。";
  }

  if (normalized.includes("user already registered")) {
    return "这个邮箱已经注册，可以直接登录。";
  }

  if (normalized.includes("password")) {
    return "密码未达到安全要求，请使用至少 8 位字符。";
  }

  return "暂时没有连接成功，请稍后再试。";
}
