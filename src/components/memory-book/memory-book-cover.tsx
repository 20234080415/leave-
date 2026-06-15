export function MemoryBookCover({
  year,
  spaceName,
  createdAt,
  daysTogether,
  recordCount,
  wishCount,
  photoCount,
  coverImageUrl,
  memberNames,
}: {
  year: number;
  spaceName: string;
  createdAt: string;
  daysTogether: number;
  recordCount: number;
  wishCount: number;
  photoCount: number;
  coverImageUrl: string | null;
  memberNames: string[];
}) {
  return (
    <section
      data-memory-book-page
      className="memory-book-paper relative min-h-[760px] overflow-hidden rounded-[30px] border border-white/80 bg-[#fffdfb] shadow-[0_24px_70px_rgb(101_68_61_/_12%)]"
    >
      <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#f6dfdc]/55 blur-2xl" />
      <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#f1e4dd]/70 blur-2xl" />

      <div className="relative grid min-h-[760px] gap-8 p-6 sm:p-10 md:grid-cols-[0.9fr_1.1fr] md:p-12">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-xs tracking-[0.24em] text-rose-deep">
              LEAVE MEMORY BOOK
            </p>
            <h1 className="mt-7 text-[44px] font-medium leading-[1.08] tracking-[-0.05em] text-ink sm:text-[58px]">
              我们的
              <br />
              {year}
            </h1>
            <p className="mt-5 text-base leading-8 text-ink-muted">
              {memberNames.length > 1
                ? `${memberNames[0]} 与 ${memberNames[1]}`
                : spaceName}
            </p>
            <p className="mt-1 text-sm text-ink-faint">
              从 {formatDate(createdAt)} 开始，共 {daysTogether} 天
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <CoverStat value={recordCount} label="篇记录" />
            <CoverStat value={wishCount} label="个愿望" />
            <CoverStat value={photoCount} label="张照片" />
          </div>
        </div>

        <div className="relative min-h-[390px] overflow-hidden rounded-[26px] bg-gradient-to-br from-[#f6deda] via-[#fff8f5] to-[#eadbd5] shadow-[0_20px_45px_rgb(123_80_72_/_16%)] md:min-h-0">
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt="回忆书封面照片"
              crossOrigin="anonymous"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[390px] flex-col items-center justify-center px-8 text-center">
              <span className="text-4xl text-[#c98580]">♡</span>
              <p className="mt-5 text-lg leading-8 text-ink-muted">
                有些日子还没有照片，
                <br />
                但已经被好好记住。
              </p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent px-6 pb-6 pt-20 text-white">
            <p className="text-xs tracking-[0.2em] text-white/75">
              OUR SHARED DAYS
            </p>
            <p className="mt-2 text-lg">{spaceName}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoverStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[18px] bg-[#f9f1ee] px-3 py-4 text-center">
      <p className="text-2xl font-medium text-ink">{value}</p>
      <p className="mt-1 text-[11px] text-ink-muted">{label}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
