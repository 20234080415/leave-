"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SheetModal } from "@/components/sheet-modal";
import { SoftCard } from "@/components/soft-card";
import { createClient } from "@/lib/supabase/client";

export function AccountSettings({
  userId,
  nickname,
  spaceId,
  spaceName,
  canEditSpace,
}: {
  userId: string;
  nickname: string;
  spaceId: string;
  spaceName: string;
  canEditSpace: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setSigningOut(true);
    setError(null);
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError("暂时没有退出成功，请稍后再试。");
      setSigningOut(false);
      return;
    }

    router.replace("/auth");
    router.refresh();
  }

  return (
    <>
      <SoftCard className="mt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">账号与空间设置</p>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              修改称呼、空间名称，或退出当前账号。
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-[#f5ece9] px-4 py-2 text-xs text-ink-muted"
            onClick={() => setEditOpen(true)}
          >
            编辑
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-2xl bg-[#fff0ee] px-4 py-3 text-sm leading-6 text-[#a25550]"
          >
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="mt-5 text-sm text-[#a25550]"
          onClick={signOut}
          disabled={signingOut}
        >
          {signingOut ? "正在退出…" : "退出登录"}
        </button>
      </SoftCard>

      {editOpen ? (
        <SettingsModal
          userId={userId}
          nickname={nickname}
          spaceId={spaceId}
          spaceName={spaceName}
          canEditSpace={canEditSpace}
          onClose={() => setEditOpen(false)}
          onError={setError}
        />
      ) : null}
    </>
  );
}

function SettingsModal({
  userId,
  nickname,
  spaceId,
  spaceName,
  canEditSpace,
  onClose,
  onError,
}: {
  userId: string;
  nickname: string;
  spaceId: string;
  spaceName: string;
  canEditSpace: boolean;
  onClose: () => void;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const [nextNickname, setNextNickname] = useState(nickname);
  const [nextSpaceName, setNextSpaceName] = useState(spaceName);
  const [saving, setSaving] = useState(false);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedNickname = nextNickname.trim();
    const normalizedSpaceName = nextSpaceName.trim();

    if (!normalizedNickname) {
      onError("昵称不能为空。");
      return;
    }

    if (canEditSpace && !normalizedSpaceName) {
      onError("空间名称不能为空。");
      return;
    }

    setSaving(true);
    onError(null);
    const supabase = createClient();
    const profileResult = await supabase
      .from("profiles")
      .update({ nickname: normalizedNickname })
      .eq("id", userId);

    if (profileResult.error) {
      onError("昵称没有保存成功，请稍后再试。");
      setSaving(false);
      return;
    }

    if (canEditSpace && normalizedSpaceName !== spaceName) {
      const spaceResult = await supabase
        .from("spaces")
        .update({ name: normalizedSpaceName })
        .eq("id", spaceId);

      if (spaceResult.error) {
        onError("昵称已保存，但空间名称没有修改成功。");
        setSaving(false);
        router.refresh();
        return;
      }
    }

    onClose();
    router.refresh();
  }

  return (
    <SheetModal
      open
      title="账号与空间设置"
      description="这些称呼只会显示在你们的留白空间里。"
      onClose={() => {
        if (!saving) {
          onClose();
        }
      }}
    >
      <form className="grid gap-5" onSubmit={saveSettings}>
        <div>
          <label htmlFor="settings-nickname" className="field-label">
            我的昵称
          </label>
          <input
            id="settings-nickname"
            className="text-field"
            value={nextNickname}
            onChange={(event) => setNextNickname(event.target.value)}
            minLength={1}
            maxLength={30}
            disabled={saving}
            required
          />
        </div>

        <div>
          <label htmlFor="settings-space-name" className="field-label">
            空间名称
          </label>
          <input
            id="settings-space-name"
            className="text-field"
            value={nextSpaceName}
            onChange={(event) => setNextSpaceName(event.target.value)}
            minLength={1}
            maxLength={50}
            disabled={saving || !canEditSpace}
            required={canEditSpace}
          />
          {!canEditSpace ? (
            <p className="mt-2 text-xs leading-5 text-ink-faint">
              只有空间创建者可以修改空间名称。
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          className="soft-button w-full disabled:opacity-60"
          disabled={saving || !nextNickname.trim()}
        >
          {saving ? "正在保存…" : "保存设置"}
        </button>
      </form>
    </SheetModal>
  );
}
