import { PageHeader } from "@/components/page-header";
import { SoftCard } from "@/components/soft-card";

const records = [
  {
    date: "6月13日 · 周六",
    mood: "平静",
    text: "今天没有发生特别大的事。一起吃完晚饭，慢慢走回家，就已经很好。",
  },
  {
    date: "6月11日 · 周四",
    mood: "开心",
    text: "冰箱里多了一盒你买的草莓。被惦记的感觉，是今天最柔软的一小块。",
  },
];

export default function RecordsPage() {
  return (
    <>
      <PageHeader
        eyebrow="OUR DAYS"
        title="我们留下的日子"
        description="不必每天都写，有想记住的时刻再来。"
        action={
          <button className="h-11 shrink-0 rounded-full bg-rose-deep px-4 text-sm text-white shadow-[0_8px_20px_rgb(169_104_101_/_22%)]">
            写下今天
          </button>
        }
      />

      <section className="grid gap-4">
        {records.map((record) => (
          <SoftCard key={record.date}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">{record.date}</p>
              <span className="paper-label">{record.mood}</span>
            </div>
            <p className="mt-5 text-[16px] leading-8 text-ink-muted">
              {record.text}
            </p>
          </SoftCard>
        ))}
      </section>
    </>
  );
}
