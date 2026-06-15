"use client";

import { useState } from "react";

export function ExportPdfButton({ year }: { year: number }) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportPdf() {
    setExporting(true);
    setError(null);
    document.body.classList.add("memory-book-exporting");

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const pages = Array.from(
        document.querySelectorAll<HTMLElement>("[data-memory-book-page]"),
      );

      if (!pages.length) {
        throw new Error("Memory book pages not found.");
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (const [index, page] of pages.entries()) {
        const canvas = await html2canvas(page, {
          backgroundColor: "#f8f3f0",
          scale: Math.min(window.devicePixelRatio || 1, 2),
          useCORS: true,
          logging: false,
          windowWidth: Math.max(document.documentElement.clientWidth, 1024),
        });
        const image = canvas.toDataURL("image/jpeg", 0.92);
        const ratio = Math.min(
          pageWidth / canvas.width,
          pageHeight / canvas.height,
        );
        const imageWidth = canvas.width * ratio;
        const imageHeight = canvas.height * ratio;
        const x = (pageWidth - imageWidth) / 2;
        const y = (pageHeight - imageHeight) / 2;

        if (index > 0) {
          pdf.addPage();
        }

        pdf.addImage(image, "JPEG", x, y, imageWidth, imageHeight);
      }

      pdf.save(`leave-memory-book-${year}.pdf`);
    } catch {
      setError("这本书暂时还没有装订好，请稍后再试。");
    } finally {
      document.body.classList.remove("memory-book-exporting");
      setExporting(false);
    }
  }

  return (
    <div data-export-hide className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={exporting}
        onClick={exportPdf}
        className="soft-button min-w-32 gap-2 disabled:bg-[#cdbbb7] disabled:shadow-none"
      >
        <DownloadIcon />
        {exporting ? "正在装订…" : "导出 PDF"}
      </button>
      {error ? (
        <p role="alert" className="max-w-64 text-right text-xs text-[#a25550]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 20h14" />
    </svg>
  );
}
