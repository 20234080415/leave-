"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SheetModal } from "@/components/sheet-modal";
import { SoftCard } from "@/components/soft-card";

const records = [
  {
    id: 1,
    date: "今天 · 20:14",
    author: "小白",
    avatar: "白",
    avatarColor: "#cbb1a7",
    mood: "开心",
    weather: "多云",
    text: "下班路上看见晚霞，像一封没有写完的信。想把这一刻留给你。",
    hasImage: true,
  },
  {
    id: 2,
    date: "6月11日 · 22:06",
    author: "小留",
    avatar: "留",
    avatarColor: "#dba9a4",
    mood: "平静",
    weather: "晴",
    text: "今天没有发生特别大的事。一起吃完晚饭，慢慢走回家，就已经很好。",
    hasImage: false,
  },
  {
    id: 3,
    date: "6月8日 · 18:32",
    author: "小白",
    avatar: "白",
    avatarColor: "#cbb1a7",
    mood: "被治愈",
    weather: "小雨",
    text: "冰箱里多了一盒你买的草莓。被惦记的感觉，是今天最柔软的一小块。",
    hasImage: false,
  },
];

const weatherOptions = ["晴", "多云", "小雨", "晚风"];
const moodOptions = ["开心", "平静", "想念", "疲惫"];

export default function RecordsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [weather, setWeather] = useState("晴");
  const [mood, setMood] = useState("平静");
  const [isShared, setIsShared] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      setIsOpen(false);
    }, 900);
  }

  function closeModal() {
    setIsOpen(false);
    setSaved(false);
  }

  return (
    <>
      <PageHeader
        eyebrow="OUR DAYS"
        title="我们留下的日子"
        description="不必每天都写，有想记住的时刻再来。"
        action={
          <button
            type="button"
            className="soft-button shrink-0 px-4"
            onClick={() => setIsOpen(true)}
          >
            写下今天
          </button>
        }
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {["全部", "小留", "小白", "有图片"].map((filter, index) => (
          <button
            key={filter}
            type="button"
            className="choice-chip shrink-0"
            data-selected={index === 0}
          >
            {filter}
          </button>
        ))}
      </div>

      <section className="relative grid gap-5 pl-5">
        <div className="absolute bottom-8 left-[5px] top-7 w-px bg-[#e3d4d0]" />
        {records.map((record) => (
          <div key={record.id} className="relative">
            <span className="absolute -left-[19px] top-7 h-2.5 w-2.5 rounded-full border-2 border-[#f8f3f0] bg-[#d89b95]" />
            <SoftCard>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm text-white"
                  style={{ backgroundColor: record.avatarColor }}
                >
                  {record.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{record.author}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{record.date}</p>
                </div>
                <div className="text-right text-xs leading-5 text-ink-muted">
                  <p>☁ {record.weather}</p>
                  <p>☺ {record.mood}</p>
                </div>
              </div>
              <p className="mt-5 text-[16px] leading-8 text-ink-muted">
                {record.text}
              </p>
              {record.hasImage ? (
                <div className="relative mt-4 h-44 overflow-hidden rounded-[20px] bg-gradient-to-br from-[#efb49f] via-[#f1d5c6] to-[#aeb8c7]">
                  <div className="absolute bottom-0 h-20 w-full bg-gradient-to-t from-[#655f6e]/35 to-transparent" />
                  <div className="absolute right-9 top-6 h-11 w-11 rounded-full bg-[#fff0cb]/85" />
                </div>
              ) : null}
            </SoftCard>
          </div>
        ))}
      </section>

      <SheetModal
        open={isOpen}
        title="写下今天"
        description="只写一点也很好，内容暂存在这个页面里。"
        onClose={closeModal}
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
            />
          </div>

          <div>
            <span className="field-label">一张图片</span>
            {previewUrl ? (
              <div className="relative h-44 overflow-hidden rounded-[20px]">
                <Image
                  src={previewUrl}
                  alt="所选图片预览"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white"
                  onClick={() => setPreviewUrl(null)}
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
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          <OptionGroup
            label="天气"
            options={weatherOptions}
            value={weather}
            onChange={setWeather}
          />
          <OptionGroup
            label="心情"
            options={moodOptions}
            value={mood}
            onChange={setMood}
          />

          <div className="flex items-center justify-between rounded-[20px] bg-[#f7efec] p-4">
            <div>
              <p className="text-sm font-medium text-ink">与对方分享</p>
              <p className="mt-1 text-xs text-ink-muted">
                关闭后会作为只属于自己的草稿
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isShared}
              className={`relative h-7 w-12 rounded-full transition ${
                isShared ? "bg-[#d99d97]" : "bg-[#d8cfcc]"
              }`}
              onClick={() => setIsShared((current) => !current)}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  isShared ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <button type="submit" className="soft-button w-full">
            {saved ? "已经轻轻放好了" : "保存这一天"}
          </button>
        </form>
      </SheetModal>
    </>
  );
}

type OptionGroupProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: OptionGroupProps) {
  return (
    <fieldset>
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
