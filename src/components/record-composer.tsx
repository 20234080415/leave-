"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SheetModal } from "@/components/sheet-modal";
import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const weatherOptions = ["晴", "多云", "小雨", "晚风"];
const moodOptions = ["开心", "平静", "想念", "疲惫"];

export function RecordComposer({
  open,
  onClose,
  spaceId,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  spaceId: string;
  userId: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [weather, setWeather] = useState("晴");
  const [mood, setMood] = useState("平静");
  const [visibility, setVisibility] = useState<"shared" | "private">("shared");
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
    const normalizedContent = content.trim();

    if (!normalizedContent) {
      setError("写下一点内容后再保存。");
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
      imagePath = buildImagePath(spaceId, userId, file);
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

    const { error: insertError } = await supabase.from("daily_records").insert({
      space_id: spaceId,
      author_id: userId,
      content: normalizedContent,
      mood,
      weather,
      image_url: imagePath,
      visibility,
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
          ? "记录没有创建，但图片清理失败。请稍后重试或联系管理员。"
          : getRecordErrorMessage(insertError.message),
      );
      setSaving(false);
      return;
    }

    resetForm();
    setSaving(false);
    onClose();
    router.refresh();
  }

  function resetForm() {
    setContent("");
    setWeather("晴");
    setMood("平静");
    setVisibility("shared");
    setError(null);
    removeImage();
  }

  function closeComposer() {
    if (!saving) {
      onClose();
    }
  }

  return (
    <SheetModal
      open={open}
      title="写下今天"
      description="一段话和一张图片，就足够留住今天。"
      onClose={closeComposer}
    >
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="record-content" className="field-label">
            想留下的话
          </label>
          <textarea
            id="record-content"
            className="text-field min-h-28 resize-none leading-7"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="今天有什么想记住的瞬间？"
            maxLength={5000}
            required
          />
        </div>

        <div>
          <span className="field-label">一张图片</span>
          {previewUrl ? (
            <div className="relative h-48 overflow-hidden rounded-[20px] bg-[#f3e9e5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="所选图片预览"
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
          ) : (
            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed border-[#dcbfba] bg-white/50 text-center">
              <span className="text-2xl text-rose-deep">＋</span>
              <span className="mt-2 text-sm text-ink-muted">
                选择一张今天的照片
              </span>
              <span className="mt-1 text-xs text-ink-faint">
                JPEG、PNG、WebP 或 GIF，小于 5MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleImageChange}
                disabled={saving}
              />
            </label>
          )}
        </div>

        <OptionGroup
          label="天气"
          options={weatherOptions}
          value={weather}
          onChange={setWeather}
          disabled={saving}
        />
        <OptionGroup
          label="心情"
          options={moodOptions}
          value={mood}
          onChange={setMood}
          disabled={saving}
        />

        <div className="flex items-center justify-between rounded-[20px] bg-[#f7efec] p-4">
          <div>
            <p className="text-sm font-medium text-ink">与对方分享</p>
            <p className="mt-1 text-xs text-ink-muted">
              关闭后只会作为自己的草稿
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={visibility === "shared"}
            aria-label="与对方分享"
            className={`relative h-7 w-12 rounded-full transition ${
              visibility === "shared" ? "bg-[#d99d97]" : "bg-[#d8cfcc]"
            }`}
            onClick={() =>
              setVisibility((current) =>
                current === "shared" ? "private" : "shared",
              )
            }
            disabled={saving}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                visibility === "shared" ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl bg-[#fff0ee] px-4 py-3 text-sm leading-6 text-[#a25550]"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="soft-button w-full disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
        >
          {saving ? (file ? "正在上传并保存…" : "正在保存…") : "保存这一天"}
        </button>
      </form>
    </SheetModal>
  );
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="field-label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="choice-chip"
            data-selected={option === value}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function validateImage(file: File) {
  if (!allowedImageTypes.includes(file.type)) {
    return "只支持 JPEG、PNG、WebP 或 GIF 图片。";
  }

  if (file.size >= MAX_IMAGE_SIZE) {
    return "图片必须小于 5MB，请压缩后再试。";
  }

  return null;
}

function buildImagePath(spaceId: string, userId: string, file: File) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return `${spaceId}/${userId}/${crypto.randomUUID()}.${extensions[file.type]}`;
}

function getUploadErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("maximum allowed size") || normalized.includes("too large")) {
    return "图片超过 5MB，未创建记录。";
  }

  if (normalized.includes("mime") || normalized.includes("content type")) {
    return "图片格式不受支持，未创建记录。";
  }

  if (
    normalized.includes("row-level security") ||
    normalized.includes("bucket") ||
    normalized.includes("not found")
  ) {
    return "图片存储尚未配置完成，记录没有创建。";
  }

  return "图片上传失败，记录没有创建，请稍后再试。";
}

function getRecordErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("daily_records") ||
    normalized.includes("schema cache") ||
    normalized.includes("does not exist")
  ) {
    return "记录功能尚未部署，图片已清理，记录没有创建。";
  }

  return "记录保存失败，已清理上传图片，请稍后再试。";
}
