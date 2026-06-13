"use client";

import { useEffect } from "react";

type SheetModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function SheetModal({
  open,
  title,
  description,
  onClose,
  children,
}: SheetModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="sheet-layer" role="presentation">
      <button
        className="sheet-backdrop"
        type="button"
        aria-label="关闭弹窗"
        onClick={onClose}
      />
      <section
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-[#e5d8d4]" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="sheet-title" className="text-xl font-medium text-ink">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6efec] text-xl text-ink-muted"
            aria-label="关闭"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}
