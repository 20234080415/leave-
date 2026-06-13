"use client";

import { useActionState, useState } from "react";
import {
  createSpace,
  joinSpace,
  type SpaceActionState,
} from "@/app/onboarding/actions";
import { SoftCard } from "@/components/soft-card";

const initialState: SpaceActionState = {};

export function SpaceOnboarding() {
  const [mode, setMode] = useState<"create" | "join" | null>(null);
  const [createState, createAction, creating] = useActionState(
    createSpace,
    initialState,
  );
  const [joinState, joinAction, joining] = useActionState(
    joinSpace,
    initialState,
  );

  return (
    <section className="grid gap-4">
      <SoftCard className="relative overflow-hidden bg-[#fff8f6]">
        <span className="absolute -right-4 -top-6 text-8xl text-[#f3ded9]/60">
          +
        </span>
        <div className="relative">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4dfdc] text-xl text-rose-deep">
            ♡
          </span>
          <h2 className="mt-5 text-xl font-medium text-ink">创建一个空间</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            生成专属邀请码，再把它轻轻交给对方。
          </p>

          {mode === "create" ? (
            <form action={createAction} className="mt-6 grid gap-3">
              <label htmlFor="space-name" className="field-label mb-0">
                空间名称
              </label>
              <input
                id="space-name"
                name="name"
                className="text-field"
                placeholder="我们的留白"
                maxLength={50}
              />
              {createState.error ? (
                <ActionError message={createState.error} />
              ) : null}
              <button
                type="submit"
                className="soft-button w-full disabled:opacity-60"
                disabled={creating}
              >
                {creating ? "正在准备空间…" : "创建空间"}
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="soft-button mt-6 w-full"
              onClick={() => setMode("create")}
            >
              创建我们的空间
            </button>
          )}
        </div>
      </SoftCard>

      <SoftCard>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2ece6] text-xl text-[#9d8178]">
          #
        </span>
        <h2 className="mt-5 text-xl font-medium text-ink">加入对方的空间</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          输入 6 位邀请码，找到对方已经准备好的位置。
        </p>

        {mode === "join" ? (
          <form action={joinAction} className="mt-6 grid gap-3">
            <label htmlFor="invite-code" className="sr-only">
              空间邀请码
            </label>
            <input
              id="invite-code"
              name="inviteCode"
              className="text-field text-center font-mono uppercase tracking-[0.28em]"
              placeholder="LEAVE6"
              minLength={6}
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              required
            />
            {joinState.error ? <ActionError message={joinState.error} /> : null}
            <button
              type="submit"
              className="soft-button w-full disabled:opacity-60"
              disabled={joining}
            >
              {joining ? "正在寻找空间…" : "加入空间"}
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="mt-6 w-full rounded-2xl border border-[#dfc8c3] bg-white/55 py-3.5 text-sm font-medium text-rose-deep"
            onClick={() => setMode("join")}
          >
            我有邀请码
          </button>
        )}
      </SoftCard>
    </section>
  );
}

function ActionError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-2xl bg-[#fff0ee] px-4 py-3 text-sm leading-6 text-[#a25550]"
    >
      {message}
    </p>
  );
}
