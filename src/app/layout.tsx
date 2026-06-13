import type { Metadata } from "next";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "留白 Leave",
    template: "%s · 留白 Leave",
  },
  description: "把想说的话，轻轻放在这里。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          <main className="page-content">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
