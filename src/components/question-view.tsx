"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { SoftCard } from "@/components/soft-card";
import { TabletBookLayout } from "@/components/tablet-book-layout";
import { createClient } from "@/lib/supabase/client";

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export type RevealedAnswer = {
  id: string;
  userId: string;
  authorName: string;
  avatarUrl: string | null;
  answer: string;
  imageUrl: string | null;
  createdAt: string;
};

export function QuestionView({
  question,
  questionIndex,
  questionDate,
  spaceId,
  userId,
  currentUserAnswered,
  answerCount,
  memberCount,
  revealedAnswers,
  loadError,
}: {
  question: string | null;
  questionIndex: number;
  questionDate: string;
  spaceId: string;
  userId: string;
  currentUserAnswered: boolean;
  answerCount: number;
  memberCount: number;
  revealedAnswers: RevealedAnswer[];
  loadError: string | null;
}) {
  const isRevealed = answerCount >= 2 && revealedAnswers.length >= 2;

  return (
    <TabletBookLayout
      left={
        <>
          <PageHeader
            eyebrow={`QUESTION ${String(questionIndex + 1).padStart(2, "0")}`}
            title="今天，想问你"
            description="答案不急着交换，先听听自己的心。"
          />

          <SoftCard className="relative overflow-hidden bg-[#fff9f7] px-6 py-9">
            <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-[#f4dedb]/70" />
            <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-[#f7e9df]/80" />
            <span className="relative text-3xl text-rose">“</span>
            <h1 className="relative mt-3 text-[24px] font-medium leading-[1.65] tracking-[-0.02em] text-ink">
              {question ?? "今天先留一会儿白，也很好。"}
            </h1>
            <div className="relative mt-7 flex items-center justify-between">
              <p className="text-sm text-ink-faint">{questionDate}</p>
              <span className="paper-label">第 {questionIndex + 1} 题</span>
            </div>
          </SoftCard>

          <SoftCard className="book-desktop-only mt-4 bg-[#fbf5f1]">
            <p className="text-xs tracking-[0.16em] text-rose-deep">
              ANSWER STATUS
            </p>
            <p className="mt-3 text-lg font-medium text-ink">
              {isRevealed
                ? "两份答案已经一起揭晓"
                : currentUserAnswered
                  ? "你的答案已经收好"
                  : "等待你写下这一页"}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              当前已有 {answerCount}/{Math.max(memberCount, 2)} 份回答
            </p>
          </SoftCard>
        </>
      }
      right={
        <>
          {loadError ? (
            <SoftCard className="border border-[#efd2cd] bg-[#fff7f5]">
              <p className="text-sm leading-6 text-[#a25550]">{loadError}</p>
            </SoftCard>
          ) : isRevealed ? (
            <RevealedAnswers answers={revealedAnswers} userId={userId} />
          ) : currentUserAnswered ? (
            <WaitingCard
              memberCount={memberCount}
              questionIndex={questionIndex}
            />
          ) : (
            <AnswerForm
              spaceId={spaceId}
              userId={userId}
              questionIndex={questionIndex}
              disabled={!question}
            />
          )}
        </>
      }
    />
  );
}

function AnswerForm({
  spaceId,
  userId,
  questionIndex,
  disabled,
}: {
  spaceId: string;
  userId: string;
  questionIndex: number;
  disabled: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setError(null);

    if (!selectedFile) {
      return;
    }

    const validationError = validateImage(selectedFile);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  function removeImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAnswer = answer.trim();

    if (!normalizedAnswer) {
      setError("写下一点回答后再保存。");
      return;
    }

    if (file) {
      const validationError = validateImage(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    let imagePath: string | null = null;

    if (file) {
      imagePath = buildQuestionImagePath(spaceId, userId, file);
      const { error: uploadError } = await supabase.storage
        .from("record-images")
        .upload(imagePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setError(getUploadErrorMessage(uploadError.message));
        setSaving(false);
        return;
      }
    }

    const { error: insertError } = await supabase
      .from("question_answers")
      .insert({
        space_id: spaceId,
        question_index: questionIndex,
        user_id: userId,
        answer: normalizedAnswer,
        image_url: imagePath,
      });

    if (insertError) {
      let cleanupFailed = false;
      if (imagePath) {
        const { error: cleanupError } = await supabase.storage
          .from("record-images")
          .remove([imagePath]);
        cleanupFailed = Boolean(cleanupError);
      }

      setError(
        cleanupFailed
          ? "答案没有保存，但图片清理失败。请稍后联系管理员。"
          : getAnswerErrorMessage(insertError.message),
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    router.refresh();
  }

  return (
    <form
      className="mt-4 rounded-[28px] border border-dashed border-[#dec7c2] bg-white/45 p-5"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center justify-between">
        <label htmlFor="answer" className="text-sm font-medium text-ink">
          我的回答
        </label>
        <span className="text-xs text-ink-faint">{answer.length}/3000</span>
      </div>
      <textarea
        id="answer"
        rows={6}
        maxLength={3000}
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="慢慢写，不用急着想好……"
        className="mt-3 w-full resize-none bg-transparent text-[16px] leading-7 text-ink outline-none placeholder:text-ink-faint"
        disabled={saving || disabled}
        required
      />

      {previewUrl ? (
        <div className="relative mt-3 h-44 overflow-hidden rounded-[20px] bg-[#f3e9e5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="答案图片预览"
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white"
            onClick={removeImage}
            disabled={saving}
          >
            移除
          </button>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-2xl bg-[#fff0ee] px-4 py-3 text-sm leading-6 text-[#a25550]"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl bg-[#f4e8e4] text-xl text-rose-deep">
          <span aria-hidden="true">+</span>
          <span className="sr-only">添加一张图片</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleImageChange}
            disabled={saving || disabled}
          />
        </label>
        <button
          type="submit"
          disabled={!answer.trim() || saving || disabled}
          className="soft-button flex-1 disabled:cursor-not-allowed disabled:bg-[#d8c9c5] disabled:shadow-none"
        >
          {saving ? (file ? "正在上传并保存…" : "正在保存…") : "轻轻放在这里"}
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-ink-faint">
        图片支持 JPEG、PNG、WebP 或 GIF，小于 5MB
      </p>
    </form>
  );
}

function WaitingCard({
  memberCount,
  questionIndex,
}: {
  memberCount: number;
  questionIndex: number;
}) {
  const router = useRouter();
  const [revising, setRevising] = useState(false);
  const [answer, setAnswer] = useState("");
  const [pending, setPending] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reviseAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAnswer = answer.trim();

    if (!normalizedAnswer) {
      return;
    }

    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.rpc(
      "update_current_question_answer",
      {
        target_question_index: questionIndex,
        new_answer: normalizedAnswer,
      },
    );

    if (updateError) {
      setError(getAnswerManagementError(updateError.message));
      setPending(false);
      return;
    }

    setAnswer("");
    setRevising(false);
    setPending(false);
    router.refresh();
  }

  async function withdrawAnswer() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { data: imagePath, error: deleteError } = await supabase.rpc(
      "delete_current_question_answer",
      {
        target_question_index: questionIndex,
      },
    );

    if (deleteError) {
      setError(getAnswerManagementError(deleteError.message));
      setPending(false);
      return;
    }

    if (typeof imagePath === "string" && imagePath) {
      await supabase.storage.from("record-images").remove([imagePath]);
    }

    setPending(false);
    setWithdrawOpen(false);
    router.refresh();
  }

  return (
    <SoftCard className="mt-4 border border-[#f0e4e0] text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f7e7e4] text-2xl text-rose-deep">
        ✓
      </div>
      <h2 className="mt-4 text-lg font-medium text-ink">答案已经留好了</h2>
      <p className="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-ink-muted">
        你的答案已经安静收好。对方想写的时候再写，两份内容会在那之后一起出现。
      </p>
      {memberCount < 2 ? (
        <p className="mt-4 text-xs text-ink-faint">
          空间里还留着一个位置，可以在“我们”页复制邀请码。
        </p>
      ) : null}

      {revising ? (
        <form className="mt-5 text-left" onSubmit={reviseAnswer}>
          <label htmlFor="revised-answer" className="field-label">
            重新写一份回答
          </label>
          <textarea
            id="revised-answer"
            className="text-field min-h-28 resize-none leading-7"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="新的文字会替换刚才的回答，原图片会保留。"
            maxLength={3000}
            disabled={pending}
            required
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="choice-chip flex-1"
              onClick={() => {
                setRevising(false);
                setAnswer("");
                setError(null);
              }}
              disabled={pending}
            >
              取消
            </button>
            <button
              type="submit"
              className="soft-button flex-1"
              disabled={pending || !answer.trim()}
            >
              {pending ? "正在保存…" : "替换回答"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            className="rounded-full bg-[#f5ece9] px-4 py-2 text-xs text-ink-muted"
            onClick={() => setRevising(true)}
            disabled={pending}
          >
            重新写一份
          </button>
          <button
            type="button"
            className="rounded-full px-4 py-2 text-xs text-[#a25550]"
            onClick={() => setWithdrawOpen(true)}
            disabled={pending}
          >
            {pending ? "正在处理…" : "撤回答案"}
          </button>
        </div>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-[#fff0ee] px-4 py-3 text-left text-sm leading-6 text-[#a25550]"
        >
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={withdrawOpen}
        title="要把这份回答收回来吗？"
        description="撤回后不会保留，你仍然可以重新写一份。"
        confirmLabel="撤回答案"
        pending={pending}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={() => void withdrawAnswer()}
      />
    </SoftCard>
  );
}

function RevealedAnswers({
  answers,
  userId,
}: {
  answers: RevealedAnswer[];
  userId: string;
}) {
  return (
    <section className="mt-5 grid gap-4">
      <div className="text-center">
        <span className="paper-label">两份答案，一起揭晓</span>
      </div>
      {answers.map((item, index) => (
        <SoftCard key={item.id}>
          <div className="flex items-center gap-3">
            <Avatar
              name={item.authorName}
              url={item.avatarUrl}
              color={index % 2 ? "#cbb1a7" : "#dba9a4"}
            />
            <div>
              <p className="text-sm font-medium text-ink">
                {item.authorName}
                {item.userId === userId ? " · 我" : ""}
              </p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {formatAnswerTime(item.createdAt)}
              </p>
            </div>
          </div>
          <p className="mt-5 whitespace-pre-wrap text-[16px] leading-8 text-ink-muted">
            {item.answer}
          </p>
          {item.imageUrl ? (
            <div className="mt-4 h-52 overflow-hidden rounded-[20px] bg-[#f3e9e5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={`${item.authorName}的回答图片`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
        </SoftCard>
      ))}
    </section>
  );
}

function Avatar({
  name,
  url,
  color,
}: {
  name: string;
  url: string | null;
  color: string;
}) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm text-white"
      style={{ backgroundColor: color }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`${name}的头像`} className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}

function validateImage(file: File) {
  if (!allowedImageTypes.includes(file.type)) {
    return "只支持 JPEG、PNG、WebP 或 GIF 图片。";
  }

  if (file.size >= maxImageSize) {
    return "图片必须小于 5MB，请压缩后再试。";
  }

  return null;
}

function buildQuestionImagePath(spaceId: string, userId: string, file: File) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return `${spaceId}/${userId}/questions/${crypto.randomUUID()}.${extensions[file.type]}`;
}

function getUploadErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("maximum allowed size") || normalized.includes("too large")) {
    return "图片超过 5MB，答案没有保存。";
  }

  if (normalized.includes("mime") || normalized.includes("content type")) {
    return "图片格式不受支持，答案没有保存。";
  }

  return "图片上传失败，答案没有保存，请稍后再试。";
}

function getAnswerErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("duplicate") || normalized.includes("unique")) {
    return "今天的答案已经记录好了。";
  }

  if (
    normalized.includes("question_answers") ||
    normalized.includes("schema cache") ||
    normalized.includes("does not exist")
  ) {
    return "今日问题尚未部署，图片已清理，答案没有保存。";
  }

  return "答案保存失败，已清理上传图片，请稍后再试。";
}

function getAnswerManagementError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("revealed")) {
    return "两份答案已经揭晓，不能再修改或撤回。";
  }

  if (
    normalized.includes("update_current_question_answer")
    || normalized.includes("delete_current_question_answer")
    || normalized.includes("schema cache")
    || normalized.includes("could not find the function")
  ) {
    return "回答管理功能尚未部署，请先执行最新的 Supabase migration。";
  }

  return "这次操作没有完成，请稍后再试。";
}

function formatAnswerTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
