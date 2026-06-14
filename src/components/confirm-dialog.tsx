"use client";

import { SheetModal } from "@/components/sheet-modal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "再想想",
  pending = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <SheetModal
      open={open}
      title={title}
      description={description}
      onClose={() => {
        if (!pending) {
          onClose();
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="choice-chip w-full"
          onClick={onClose}
          disabled={pending}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#a85e5a] px-4 text-sm font-medium text-white shadow-[0_8px_20px_rgb(168_94_90_/_18%)] transition hover:bg-[#974f4c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? "请稍等…" : confirmLabel}
        </button>
      </div>
    </SheetModal>
  );
}
