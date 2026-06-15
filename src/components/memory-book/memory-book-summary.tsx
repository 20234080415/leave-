export function MemoryBookSummary({
  year,
  recordCount,
  wishCount,
  photoCount,
  daysTogether,
  memberNames,
}: {
  year: number;
  recordCount: number;
  wishCount: number;
  photoCount: number;
  daysTogether: number;
  memberNames: string[];
}) {
  return (
    <section
      data-memory-book-page
      className="memory-book-paper relative flex min-h-[760px] items-center justify-center overflow-hidden rounded-[30px] border border-white/80 bg-gradient-to-br from-[#fffdfb] via-[#fff8f5] to-[#f4e4e0] p-7 text-center shadow-[0_24px_70px_rgb(101_68_61_/_11%)] sm:p-12"
    >
      <div className="absolute left-10 top-10 h-24 w-24 rounded-full border border-[#e9cdc8]/70" />
      <div className="absolute bottom-12 right-12 h-36 w-36 rounded-full bg-white/45" />
      <div className="relative max-w-2xl">
        <p className="text-xs tracking-[0.24em] text-rose-deep">
          THE LAST PAGE · {year}
        </p>
        <h2 className="mt-7 text-3xl font-medium tracking-[-0.04em] text-ink sm:text-4xl">
          这一年，你们一起留下了
        </h2>
        <div className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryStat value={recordCount} label="篇记录" />
          <SummaryStat value={wishCount} label="个愿望" />
          <SummaryStat value={photoCount} label="张照片" />
          <SummaryStat value={daysTogether} label="天陪伴" />
        </div>
        <p className="mx-auto mt-12 max-w-lg text-base leading-9 text-ink-muted">
          日子不必每一页都热闹。
          <br />
          那些被写下、被期待、被拍下的瞬间，
          <br />
          已经悄悄成为了只属于你们的故事。
        </p>
        <div className="mx-auto mt-12 h-px w-20 bg-[#d9aaa5]" />
        <p className="mt-6 text-sm text-ink-faint">
          {memberNames.length > 1
            ? `${memberNames[0]} & ${memberNames[1]}`
            : "继续一起，慢慢写下去"}
        </p>
      </div>
    </section>
  );
}

function SummaryStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[20px] bg-white/65 px-3 py-5 shadow-sm">
      <p className="text-3xl font-medium text-ink">{value}</p>
      <p className="mt-2 text-xs text-ink-muted">{label}</p>
    </div>
  );
}
