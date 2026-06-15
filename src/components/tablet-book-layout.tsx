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
  return (
    <div className={`tablet-book-layout ${className}`}>
      <section className="tablet-book-page tablet-book-page--left">
        {left}
      </section>
      <section className="tablet-book-page tablet-book-page--right">
        {right}
      </section>
    </div>
  );
}
