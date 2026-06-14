"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SheetModal } from "@/components/sheet-modal";
import { SoftCard } from "@/components/soft-card";
import { createClient } from "@/lib/supabase/client";

export function AccountSettings({
  userId,
  nickname,
  spaceId,
  spaceName,
  hasPartner,
  canEditSpace,
}: {
  userId: string;
  nickname: string;
  spaceId: string;
  spaceName: string;
  hasPartner: boolean;
  canEditSpace: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [spaceAction, setSpaceAction] = useState<"leave" | "delete" | null>(
    null,
  );
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

  async function leaveSpace() {
    setSpaceAction("leave");
    setError(null);
    const supabase = createClient();
    const { error: leaveError } = await supabase.rpc("leave_space");

    if (leaveError) {
      setError(getSpaceActionError(leaveError.message, "leave"));
      setSpaceAction(null);
      setLeaveOpen(false);
      return;
    }

    router.replace("/onboarding");
    router.refresh();
  }

  async function deleteSpace() {
    setSpaceAction("delete");
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase.rpc(
      "delete_current_space",
    );

    if (deleteError) {
      setError(getSpaceActionError(deleteError.message, "delete"));
      setSpaceAction(null);
      setDeleteOpen(false);
      return;
    }

    router.replace("/onboarding");
    router.refresh();
  }

  return (
    <>
      <SoftCard className="mt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">账号与空间设置</p>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              修改称呼、空间名称，或整理这段空间关系。
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
          onClick={() => setSignOutOpen(true)}
          disabled={signingOut}
        >
          {signingOut ? "正在退出…" : "退出登录"}
        </button>

        <div className="mt-5 border-t border-[#eee1dd] pt-5">
          <p className="text-xs leading-5 text-ink-faint">
            空间操作不会替你做决定，也不会通知对方催促回应。
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
            {hasPartner ? (
              <button
                type="button"
                className="text-sm text-[#a25550]"
                onClick={() => setLeaveOpen(true)}
                disabled={spaceAction !== null}
              >
                离开空间
              </button>
            ) : null}
            {canEditSpace ? (
              <button
                type="button"
                className="text-sm text-[#a25550]"
                onClick={() => setDeleteOpen(true)}
                disabled={spaceAction !== null}
              >
                删除空间
              </button>
            ) : null}
          </div>
        </div>
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

      <ConfirmDialog
        open={signOutOpen}
        title="要先离开一会儿吗？"
        description="退出后，留在这里的内容不会改变。下次登录时还能继续翻阅。"
        confirmLabel="退出登录"
        cancelLabel="留在这里"
        pending={signingOut}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => void signOut()}
      />

      <ConfirmDialog
        open={leaveOpen}
        title="确定要离开这个空间吗？"
        description="离开后，你将不能再查看这里的内容。共同留下的记录会继续保存在对方的空间里。"
        confirmLabel="离开空间"
        cancelLabel="再想想"
        pending={spaceAction === "leave"}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => void leaveSpace()}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="确定要删掉这个空间吗？"
        description="这里的记录、愿望和回答都会一起删除，删掉后不会恢复。"
        confirmLabel="删除空间"
        cancelLabel="再想想"
        pending={spaceAction === "delete"}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void deleteSpace()}
      />
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

function getSpaceActionError(
  message: string,
  action: "leave" | "delete",
) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("leave_space") ||
    normalized.includes("delete_current_space") ||
    normalized.includes("schema cache")
  ) {
    return "空间操作尚未部署，请先执行最新的 Supabase migration。";
  }

  if (normalized.includes("last member")) {
    return "这里只剩你一个人了，请使用“删除空间”。";
  }

  if (normalized.includes("only the space creator")) {
    return "只有空间创建者可以删除整个空间。";
  }

  return action === "leave"
    ? "暂时没有离开成功，请稍后再试。"
    : "暂时没有删除成功，请稍后再试。";
}
