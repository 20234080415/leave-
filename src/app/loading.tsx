export default function Loading() {
  return (
    <div className="animate-pulse" aria-label="正在翻到下一页">
      <div className="h-3 w-24 rounded-full bg-[#eadedb]" />
      <div className="mt-4 h-8 w-52 rounded-xl bg-[#e8d9d5]" />
      <div className="mt-3 h-4 w-40 rounded-full bg-[#eee4e1]" />

      <div className="mt-8 grid gap-4">
        <div className="h-24 rounded-[26px] bg-[#ead6d2]/75" />
        <div className="h-48 rounded-[28px] bg-white/65 shadow-sm" />
        <div className="h-36 rounded-[28px] bg-[#f1e2df]/70" />
      </div>
      <p className="mt-6 text-center text-xs tracking-[0.12em] text-ink-faint">
        正在轻轻翻到下一页…
      </p>
    </div>
  );
}
