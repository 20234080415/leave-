import type { ReactNode } from "react";

type TabletBookLayoutProps = {
  left: ReactNode;
  right: ReactNode;
  className?: string;
};

export function TabletBookLayout({
  left,
  right,
  className = "",
}: TabletBookLayoutProps) {
  const showLayoutDebug = process.env.NODE_ENV !== "production";

  return (
    <div
      className={`tablet-book-layout ${className}`}
      data-layout-trigger={
        showLayoutDebug
          ? "双页布局：CSS 视口宽度 >= 700px；横屏平板沿用并压缩垂直留白"
          : undefined
      }
    >
      {showLayoutDebug ? (
        <span className="sr-only" data-layout-debug>
          当前布局触发条件：视口宽度达到 700px 时启用双页；横屏平板优先使用紧凑双页。
        </span>
      ) : null}
      <section className="tablet-book-page tablet-book-page--left">
        {left}
      </section>
      <section className="tablet-book-page tablet-book-page--right">
        {right}
      </section>
    </div>
  );
}
