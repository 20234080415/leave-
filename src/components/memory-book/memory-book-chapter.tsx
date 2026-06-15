import type { MemoryBookChapterData } from "@/components/memory-book/types";

export function MemoryBookChapter({
  chapter,
  chapterNumber,
}: {
  chapter: MemoryBookChapterData;
  chapterNumber: number;
}) {
  const hasMemories =
    chapter.records.length > 0 ||
    chapter.wishes.length > 0 ||
    chapter.photos.length > 0;

  return (
    <section
      data-memory-book-page
      className="memory-book-paper min-h-[760px] rounded-[30px] border border-white/80 bg-[#fffdfb] p-6 shadow-[0_22px_60px_rgb(101_68_61_/_9%)] sm:p-10"
    >
      <header className="flex items-end justify-between gap-5 border-b border-[#eadfdb] pb-6">
        <div>
          <p className="text-xs tracking-[0.22em] text-rose-deep">
            CHAPTER {String(chapterNumber).padStart(2, "0")}
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-ink">
            {chapter.title}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">{chapter.subtitle}</p>
        </div>
        <div className="hidden text-right text-xs leading-6 text-ink-faint sm:block">
          <p>{chapter.records.length} 篇记录</p>
          <p>{chapter.wishes.length} 个完成的愿望</p>
        </div>
      </header>

      {hasMemories ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            {chapter.records.map((record) => (
              <article
                key={record.id}
                className="relative border-l border-[#deb8b2] pl-5"
              >
                <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full border-2 border-[#fffdfb] bg-[#c98580]" />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                  <time>{formatDate(record.createdAt)}</time>
                  <span>{record.authorName}</span>
                  {record.weather ? <span>{record.weather}</span> : null}
                  {record.mood ? <span>{record.mood}</span> : null}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-ink-muted">
                  {record.content}
                </p>
                {record.imageUrl ? (
                  <div className="mt-4 overflow-hidden rounded-[18px] bg-[#f3e9e5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={record.imageUrl}
                      alt="共同记录中的照片"
                      crossOrigin="anonymous"
                      className="max-h-72 w-full object-cover"
                    />
                  </div>
                ) : null}
              </article>
            ))}

            {chapter.records.length === 0 ? (
              <GentleNote text="这个季节的文字还留着一点空白，等某一天慢慢写进来。" />
            ) : null}
          </div>

          <aside className="space-y-5">
            <div className="rounded-[22px] bg-[#faf3f0] p-5">
              <p className="text-xs tracking-[0.18em] text-rose-deep">
                WISHES COME TRUE
              </p>
              <div className="mt-4 space-y-4">
                {chapter.wishes.map((wish) => (
                  <article key={wish.id}>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d59a94] text-xs text-white">
                        ✓
                      </span>
                      <div>
                        <h3 className="text-sm font-medium leading-6 text-ink">
                          {wish.title}
                        </h3>
                        <p className="mt-1 text-xs text-ink-faint">
                          {formatDate(wish.date)}
                        </p>
                        {wish.description ? (
                          <p className="mt-2 text-xs leading-6 text-ink-muted">
                            {wish.description}
                          </p>
                        ) : null}
                        {wish.steps.length ? (
                          <p className="mt-2 text-[11px] text-ink-faint">
                            {wish.steps.filter((step) => step.isDone).length}/
                            {wish.steps.length} 个小步骤被完成
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
                {chapter.wishes.length === 0 ? (
                  <p className="text-sm leading-7 text-ink-muted">
                    愿望还在路上，慢一点也很好。
                  </p>
                ) : null}
              </div>
            </div>

            {chapter.photos.length ? (
              <div className="grid grid-cols-2 gap-2">
                {chapter.photos.slice(0, 4).map((photo, index) => (
                  <figure
                    key={photo.id}
                    className={`overflow-hidden rounded-[18px] bg-[#f3e9e5] ${
                      index === 0 && chapter.photos.length % 2 === 1
                        ? "col-span-2"
                        : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      crossOrigin="anonymous"
                      className="h-36 w-full object-cover"
                    />
                  </figure>
                ))}
              </div>
            ) : (
              <GentleNote text="照片还没有来到这一页，文字已经先替你们留住了日子。" />
            )}
          </aside>
        </div>
      ) : (
        <div className="flex min-h-[560px] items-center justify-center text-center">
          <div>
            <span className="text-3xl text-rose">♡</span>
            <p className="mt-5 text-lg text-ink">这一页还在等你们。</p>
            <p className="mt-2 text-sm leading-7 text-ink-muted">
              不着急，季节会带着新的故事慢慢走来。
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function GentleNote({ text }: { text: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#e6d5d0] px-5 py-7 text-center text-sm leading-7 text-ink-muted">
      {text}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
