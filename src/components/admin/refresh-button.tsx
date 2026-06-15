"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#a96865] px-4 text-sm font-medium text-white shadow-[0_10px_24px_rgb(169_104_101_/_22%)] disabled:opacity-60"
    >
      <RefreshIcon className={isPending ? "animate-spin" : ""} />
      {isPending ? "正在刷新" : "刷新数据"}
    </button>
  );
}

function RefreshIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6v5h-5" />
      <path d="M4 18v-5h5" />
      <path d="M6.1 9a7 7 0 0 1 11.5-2.6L20 11M4 13l2.4 4.6A7 7 0 0 0 17.9 15" />
    </svg>
  );
}
