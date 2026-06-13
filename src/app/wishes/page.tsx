import { PageHeader } from "@/components/page-header";
import { SoftCard } from "@/components/soft-card";

const wishes = [
  { title: "一起去海边看一次日出", status: "准备中", progress: 66 },
  { title: "做一本属于我们的相册", status: "进行中", progress: 40 },
  { title: "学会一道对方喜欢的菜", status: "想想中", progress: 12 },
];

export default function WishesPage() {
  return (
    <>
      <PageHeader
        eyebrow="SOMEDAY"
        title="想一起完成的事"
        description="愿望不设期限，想起来时就向前一点。"
        action={
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-deep text-2xl font-light text-white shadow-[0_8px_20px_rgb(169_104_101_/_22%)]"
            aria-label="新建愿望"
          >
            +
          </button>
        }
      />

      <section className="grid gap-4">
        {wishes.map((wish, index) => (
          <SoftCard key={wish.title}>
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7e8e5] text-lg text-rose-deep">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium leading-6 text-ink">{wish.title}</h2>
                  <span className="shrink-0 text-xs text-rose-deep">
                    {wish.status}
                  </span>
                </div>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#efe6e3]">
                  <div
                    className="h-full rounded-full bg-[#dba39e]"
                    style={{ width: `${wish.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-right text-xs text-ink-faint">
                  {wish.progress}%
                </p>
              </div>
            </div>
          </SoftCard>
        ))}
      </section>
    </>
  );
}
